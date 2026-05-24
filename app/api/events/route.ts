// app/api/events/route.ts
import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

export const dynamic = 'force-dynamic';

// ─── SYNC COOLDOWN ────────────────────────────────────────────────────────
const syncCooldown = new Map<string, number>();
const SYNC_TTL_MS  = 30 * 60 * 1000; // 30 minutes per unique query

function isSyncCoolingDown(key: string) {
  const last = syncCooldown.get(key);
  return !!last && Date.now() - last < SYNC_TTL_MS;
}
function markSynced(key: string) {
  syncCooldown.set(key, Date.now());
}

// ─── BOT SELLER POOL ─────────────────────────────────────────────────────
// 40 shared bots reused across all events — zero new seller docs per sync.
const BOT_POOL_SIZE = 40;
let _botPoolCache: string[] | null = null;

async function getBotPool(): Promise<string[]> {
  if (_botPoolCache && _botPoolCache.length >= BOT_POOL_SIZE) return _botPoolCache;

  const existing = await prisma.sellerProfile.findMany({
    where:  { isBot: true },
    select: { id: true },
    take:   BOT_POOL_SIZE,
  });

  if (existing.length >= BOT_POOL_SIZE) {
    _botPoolCache = existing.map(b => b.id);
    return _botPoolCache;
  }

  const needed = BOT_POOL_SIZE - existing.length;
  await prisma.sellerProfile.createMany({
    data: Array.from({ length: needed }).map(() => ({
      name:      'Verified Seller',
      isBot:     true,
      avatarUrl: faker.image.avatarGitHub(),
    })),
  });

  const allBots = await prisma.sellerProfile.findMany({
    where:  { isBot: true },
    select: { id: true },
    take:   BOT_POOL_SIZE,
  });

  _botPoolCache = allBots.map(b => b.id);
  return _botPoolCache;
}

// ─── CITY ALIAS MAP ───────────────────────────────────────────────────────
const CITY_ALIASES: Record<string, string> = {
  'nyc': 'New York', 'ny': 'New York', 'new yok': 'New York', 'new yokr': 'New York',
  'la':  'Los Angeles', 'los angles': 'Los Angeles', 'los angelos': 'Los Angeles',
  'lon': 'London', 'londen': 'London', 'londn': 'London',
  'chi': 'Chicago', 'chicgo': 'Chicago',
  'sf':  'San Francisco', 'san fran': 'San Francisco',
  'dc':  'Washington', 'washington dc': 'Washington',
  'lv':  'Las Vegas', 'vegas': 'Las Vegas',
  'atl': 'Atlanta',  'atlnata': 'Atlanta',
  'mia': 'Miami',    'miamia':  'Miami',
  'tor': 'Toronto',  'tronto':  'Toronto',
  'par': 'Paris',    'pris': 'Paris',     'paaris': 'Paris',
  'ber': 'Berlin',   'berlim': 'Berlin',
  'tok': 'Tokyo',    'tokio':  'Tokyo',
  'syd': 'Sydney',   'sydeny': 'Sydney',
  'mel': 'Melbourne','melbourna': 'Melbourne',
  'lag': 'Lagos',    'abj': 'Abuja',
  'dub': 'Dubai',    'dubay': 'Dubai',
};

function normalizeCity(city: string | null): string | null {
  if (!city) return null;
  const lower = city.trim().toLowerCase();
  return CITY_ALIASES[lower] ?? city.trim();
}

// ─── FUZZY KEYWORD CORRECTION via TM Suggest ─────────────────────────────
async function correctKeyword(keyword: string, apiKey: string): Promise<string> {
  // Bypass auto-correction completely for short acronyms like UFC, WWE
  if (keyword.trim().length <= 4 && keyword.trim() === keyword.trim().toUpperCase()) {
    return keyword;
  }

  try {
    const url = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=${apiKey}`
              + `&keyword=${encodeURIComponent(keyword)}&resource=attractions,events&size=1`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return keyword;
    const json = await res.json();
    const suggestion =
      json._embedded?.attractions?.[0]?.name ||
      json._embedded?.events?.[0]?.name;
    if (!suggestion) return keyword;
    // Accept correction only if it shares the first 4 chars (avoids unrelated results)
    const similar = suggestion.toLowerCase().startsWith(keyword.toLowerCase().slice(0, 4));
    return similar ? suggestion : keyword;
  } catch {
    return keyword;
  }
}

// ─── FUZZY CITY CORRECTION via TM Suggest ────────────────────────────────
async function correctCity(city: string, apiKey: string): Promise<string> {
  try {
    const url = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=${apiKey}`
              + `&keyword=${encodeURIComponent(city)}&resource=venues&size=1`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return city;
    const json = await res.json();
    return json._embedded?.venues?.[0]?.city?.name || city;
  } catch {
    return city;
  }
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCity     = searchParams.get('city');
  const rawKeyword  = searchParams.get('keyword');
  const rawCategory = searchParams.get('category');
  const apiKey      = process.env.TICKETMASTER_API_KEY;

  // ── 1. Correct inputs in parallel (non-blocking — failures fall back safely)
  const [resolvedKeyword, resolvedCity] = await Promise.all([
    rawKeyword && apiKey
      ? correctKeyword(rawKeyword, apiKey).catch(() => rawKeyword)
      : Promise.resolve(rawKeyword),

    rawCity && apiKey
      ? (async () => {
          const aliased = normalizeCity(rawCity);
          if (aliased !== rawCity) return aliased; // alias map hit — skip API call
          return correctCity(rawCity, apiKey).catch(() => rawCity);
        })()
      : Promise.resolve(normalizeCity(rawCity)),
  ]);

  const keywordCorrected = !!rawKeyword  && resolvedKeyword !== rawKeyword;
  const cityCorrected    = !!rawCity     && resolvedCity    !== rawCity;
  const isGlobalQuery    = !resolvedKeyword && !resolvedCity && !rawCategory;

  // ── 2. Build DB WHERE clause ──────────────────────────────────────────
  const andConditions: any[] = [];

  // Loose multi-word query structure (OR condition applied to each split word)
  if (resolvedKeyword) {
    const words = resolvedKeyword.trim().split(/\s+/).filter(Boolean);
    andConditions.push({
      OR: words.flatMap(word => [
        { title:       { contains: word, mode: 'insensitive' } },
        { description: { contains: word, mode: 'insensitive' } },
        { city:        { contains: word, mode: 'insensitive' } },
      ]),
    });
  }

  if (rawCategory && rawCategory !== 'All') {
    const catMap: Record<string, string> = {
      Concerts: 'Music', Theater: 'Theatre',
      Comedy: 'Comedy', Sports: 'Sports', Festivals: 'Festival',
    };
    const mapped = catMap[rawCategory] ?? rawCategory;
    andConditions.push({
      OR: [
        { title:       { contains: mapped, mode: 'insensitive' } },
        { description: { contains: mapped, mode: 'insensitive' } },
      ],
    });
  }

  // City filter: case-insensitive phrase matching (not strict equality)
  if (resolvedCity && !resolvedKeyword) {
    andConditions.push({ city: { contains: resolvedCity, mode: 'insensitive' } });
  }

  const dbQuery = andConditions.length > 0 ? { AND: andConditions } : {};

  // ── 3. Count existing events — bot pool warmed independently
  getBotPool().catch(err => console.error('Bot pool warm failed:', err));
  const existingCount = await prisma.event.count({ where: dbQuery });

  // ── 4. Sync strategy ─────────────────────────────────────────────────
  const syncKey = `${resolvedCity ?? ''}::${resolvedKeyword ?? ''}::${rawCategory ?? ''}`;

  if (existingCount > 0) {
    // Data exists → stream it immediately, refresh cache in background
    if (apiKey && !isSyncCoolingDown(syncKey)) {
      markSynced(syncKey);
      syncExternalEvents(resolvedCity, resolvedKeyword, rawCategory, apiKey).catch(console.error);
    }
  } else {
    // No data at all → await the sync first so user sees results on first load
    if (apiKey) {
      markSynced(syncKey);
      await syncExternalEvents(resolvedCity, resolvedKeyword, rawCategory, apiKey).catch(console.error);
    }
  }

  // Re-count after sync
  const finalCount = await prisma.event.count({ where: dbQuery });

  // ── 5. Response headers ───────────────────────────────────────────────
  const headers: Record<string, string> = {
    'Content-Type':  'application/x-ndjson',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive',
  };
  if (keywordCorrected && resolvedKeyword) {
    headers['X-Corrected-Keyword'] = resolvedKeyword;
    headers['X-Original-Keyword']  = rawKeyword!;
  }
  if (cityCorrected && resolvedCity) {
    headers['X-Corrected-City'] = resolvedCity;
  }

  // ── 6. Stream ─────────────────────────────────────────────────────────
  const encoder  = new TextEncoder();
  const batchSize = 12;

  const stream = new ReadableStream({
    async start(controller) {
      const meta = {
        __meta: true,
        total:  finalCount,
        query: {
          keyword:  resolvedKeyword  ?? null,
          city:     resolvedCity     ?? null,
          category: rawCategory      ?? null,
          isGlobal: isGlobalQuery,
          correctedKeyword: keywordCorrected ? resolvedKeyword : null,
          correctedCity:    cityCorrected    ? resolvedCity    : null,
        },
      };
      controller.enqueue(encoder.encode(JSON.stringify(meta) + '\n'));

      if (finalCount === 0) {
        controller.close();
        return;
      }

      let skip    = 0;
      let hasMore = true;
      const sizes = [6, ...Array(200).fill(batchSize)];

      try {
        for (const take of sizes) {
          if (!hasMore) break;

          const batch = await prisma.event.findMany({
            where: dbQuery,
            include: {
              ticketBatches: {
                where:   { quantity: { gt: 0 } },
                include: {
                  seller: {
                    select: { id: true, name: true, avatarUrl: true, isBot: true }
                  }
                },
                orderBy: { price: 'asc' },
              },
            },
            orderBy: [{ isFeatured: 'desc' }, { date: 'asc' }],
            take,
            skip,
          });

          if (batch.length === 0) {
            hasMore = false;
          } else {
            const formatted = batch.map(({ ticketBatches, ...rest }) => ({
              ...rest,
              listings: ticketBatches.map(tb => ({
                id:          tb.id,
                price:       tb.price,
                quantity:    tb.quantity,
                ticketsSold: tb.ticketsSold,
                seller:      tb.seller,
              })),
            }));

            controller.enqueue(encoder.encode(JSON.stringify(formatted) + '\n'));
            skip += take;
          }
        }
      } catch (err) {
        console.error('Stream error:', err);
        controller.enqueue(
          encoder.encode(JSON.stringify({ __error: 'Stream interrupted' }) + '\n')
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}

// ─── TICKETMASTER SYNC ────────────────────────────────────────────────────
async function syncExternalEvents(
  targetCity: string | null,
  keyword:    string | null,
  category:   string | null,
  apiKey:     string,
) {
  try {
    let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}`;

    if (keyword) {
      tmUrl += `&keyword=${encodeURIComponent(keyword)}&size=50&sort=date,asc`;
    } else if (category && category !== 'All') {
      const catMap: Record<string, string> = {
        Concerts: 'Music', Theater: 'Arts & Theatre',
        Comedy:   'Comedy', Sports: 'Sports',
      };
      if (category === 'Festivals') {
        tmUrl += `&keyword=Festival&size=50&sort=date,asc`;
      } else {
        tmUrl += `&classificationName=${encodeURIComponent(catMap[category] ?? category)}&size=50&sort=date,asc`;
      }
    } else if (targetCity) {
      tmUrl += `&city=${encodeURIComponent(targetCity)}&size=50&sort=date,asc`;
    } else {
      tmUrl += `&size=50&sort=relevance,desc`;
    }

    const res = await fetch(tmUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return;

    const data       = await res.json();
    const liveEvents = (data._embedded?.events ?? []) as any[];
    if (liveEvents.length === 0) return;

    const candidateTitles = liveEvents
      .filter(e => (e.dates?.status?.code as string)?.toLowerCase() !== 'cancelled')
      .filter(e => e.priceRanges?.[0]?.min != null)
      .map(e => (e.name as string)?.substring(0, 250) || 'Live Event');

    const alreadyInDb = new Set(
      (await prisma.event.findMany({
        where:  { title: { in: candidateTitles } },
        select: { title: true },
      })).map(e => e.title)
    );

    const botPool = await getBotPool();

    for (const extEvent of liveEvents) {
      const statusCode = (extEvent.dates?.status?.code as string)?.toLowerCase();
      if (statusCode === 'cancelled') continue;

      const priceRange = extEvent.priceRanges?.[0];
      if (!priceRange?.min) continue;

      const title = (extEvent.name as string)?.substring(0, 250) || 'Live Event';
      if (alreadyInDb.has(title)) continue;

      const basePrice   = Number(Number(priceRange.min).toFixed(2));
      const catName     = extEvent.classifications?.[0]?.segment?.name || 'Live Event';
      const actualCity  = extEvent._embedded?.venues?.[0]?.city?.name  || targetCity || 'Global';
      const venueName   = extEvent._embedded?.venues?.[0]?.name         || 'TBA';
      const imageUrl    =
        extEvent.images?.find((img: any) => img.ratio === '16_9' && img.width >= 1024)?.url ||
        extEvent.images?.[0]?.url ||
        'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=1000';

      const eventDateString = extEvent.dates?.start?.dateTime || extEvent.dates?.start?.localDate;
      const date = eventDateString
        ? new Date(eventDateString)
        : new Date(Date.now() + 86_400_000 * 7);

      // Extract Attractions & Generate Description
      const attractionsList = extEvent._embedded?.attractions
        ?.map((a: any) => a.name)
        .filter(Boolean)
        .join(', ');

      const description = attractionsList
        ? `${catName} at ${venueName} • Feat. ${attractionsList}`
        : `${catName} at ${venueName}`;

      const newEvent = await prisma.event.create({
        data: {
          title,
          description,
          date,
          city:        actualCity,
          country:     'GLOBAL',
          basePrice,
          imageUrl,
          isFeatured:  false,
        },
      });

      const numSellers   = Math.floor(Math.random() * 5) + 3;
      const assignedBots = [...botPool].sort(() => Math.random() - 0.5).slice(0, numSellers);

      await prisma.ticketBatch.createMany({
        data: assignedBots.map(botId => ({
          eventId:  newEvent.id,
          sellerId: botId,
          price:    basePrice,
          quantity: Math.floor(Math.random() * 4) + 1,
        })),
      });

      alreadyInDb.add(title);
    }
  } catch (err) {
    console.error('TM Sync error:', err instanceof Error ? err.message : err);
  }
                              }
