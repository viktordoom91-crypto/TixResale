// app/api/events/route.ts
import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

export const dynamic = 'force-dynamic';

// ─── SYNC COOLDOWN ───────────────────────────────────────────────────────
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

// ─── CITY ALIAS MAP ──────────────────────────────────────────────────────
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

// 🔥 FIX: Global City Check
function isGlobalCity(city: string | null): boolean {
  if (!city) return true;
  const c = city.toLowerCase().trim();
  return ['global', 'all', 'any', 'worldwide'].includes(c);
}

// 🔥 FIX: Global Intent Parser for Catch-All Queries
function parseGlobalIntent(keyword: string | null, category: string | null) {
  let resolvedKeyword = keyword?.trim() || null;
  let resolvedCategory = category;

  if (resolvedKeyword) {
    const lowerKw = resolvedKeyword.toLowerCase();

    // 1. All/Any Artists -> Strip keyword, force Concerts/Music category
    if (['all artists', 'all artist', 'any artist', 'any artists', 'all music', 'any music'].includes(lowerKw)) {
      resolvedKeyword = null; 
      resolvedCategory = 'Concerts'; 
    }
    // 2. All/Any Sports -> Strip keyword, force Sports category
    else if (['all sports', 'all sport', 'any sport', 'any sports', 'any sport event', 'all sport events'].includes(lowerKw)) {
      resolvedKeyword = null;
      resolvedCategory = 'Sports';
    }
    // 3. Specific Leagues -> Keep keyword, format cleanly, force Sports category
    else {
      const majorSports = ['nfl', 'nba', 'mlb', 'ufc', 'wwe', 'golf', 'tennis', 'f1', 'nhl', 'mls'];
      if (majorSports.includes(lowerKw)) {
        resolvedKeyword = ['golf', 'tennis'].includes(lowerKw) 
          ? lowerKw.charAt(0).toUpperCase() + lowerKw.slice(1) 
          : lowerKw.toUpperCase(); 
        resolvedCategory = 'Sports';
      }
    }
  }

  return { intentKeyword: resolvedKeyword, intentCategory: resolvedCategory };
}

// ─── FUZZY KEYWORD CORRECTION ────────────────────────────────────────────
async function correctKeyword(keyword: string, apiKey: string): Promise<string> {
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
    const similar = suggestion.toLowerCase().startsWith(keyword.toLowerCase().slice(0, 4));
    return similar ? suggestion : keyword;
  } catch {
    return keyword;
  }
}

// ─── FUZZY CITY CORRECTION ───────────────────────────────────────────────
async function correctCity(city: string, apiKey: string): Promise<string> {
  if (isGlobalCity(city)) return city; 
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

  // ── 1. Parse Global Catch-All Intents
  const { intentKeyword, intentCategory } = parseGlobalIntent(rawKeyword, rawCategory);

  // ── 2. Correct inputs
  const [resolvedKeyword, resolvedCity] = await Promise.all([
    intentKeyword && apiKey
      ? correctKeyword(intentKeyword, apiKey).catch(() => intentKeyword)
      : Promise.resolve(intentKeyword),

    rawCity && apiKey
      ? (async () => {
          const aliased = normalizeCity(rawCity);
          if (aliased !== rawCity || isGlobalCity(aliased)) return aliased;
          return correctCity(rawCity, apiKey).catch(() => rawCity);
        })()
      : Promise.resolve(normalizeCity(rawCity))
  ]);

  const keywordCorrected = !!intentKeyword && resolvedKeyword !== intentKeyword;
  const cityCorrected    = !!rawCity       && resolvedCity    !== rawCity;
  const isGlobalQuery    = !resolvedKeyword && isGlobalCity(resolvedCity) && (!intentCategory || intentCategory === 'All');

  // ── 3. Build DB WHERE clause
  const andConditions: any[] = [];

  if (resolvedKeyword) {
    const words = resolvedKeyword.trim().split(/\s+/).filter(Boolean);
    const wordConditions = words.map(word => ({
      OR: [
        { title:       { contains: word, mode: 'insensitive' } },
        { description: { contains: word, mode: 'insensitive' } }, // Artist search via description
        { city:        { contains: word, mode: 'insensitive' } },
      ]
    }));
    andConditions.push(...wordConditions);
  }

  if (intentCategory && intentCategory !== 'All') {
    const catMap: Record<string, string> = {
      Concerts: 'Music', Theater: 'Theatre',
      Comedy: 'Comedy', Sports: 'Sports', Sport: 'Sports', Festivals: 'Festival'
    };
    const mapped = catMap[intentCategory] ?? intentCategory;
    andConditions.push({
      OR: [
        { title:       { contains: mapped, mode: 'insensitive' } },
        { description: { contains: mapped, mode: 'insensitive' } }
      ]
    });
  }

  if (resolvedCity && !isGlobalCity(resolvedCity)) {
    andConditions.push({ city: { contains: resolvedCity, mode: 'insensitive' } });
  }

  const dbQuery = andConditions.length > 0 ? { AND: andConditions } : {};

  // ── 4. Initialize Bots
  getBotPool().catch(err => console.error('Bot pool warm failed:', err));

  // ── 5. Sync Strategy
  const syncKey = `${resolvedCity ?? 'global'}::${resolvedKeyword ?? ''}::${intentCategory ?? ''}`;

  if (apiKey && !isSyncCoolingDown(syncKey)) {
    markSynced(syncKey);
    await syncExternalEvents(resolvedCity, resolvedKeyword, intentCategory, apiKey).catch(console.error);
  }

  const finalCount = await prisma.event.count({ where: dbQuery });

  // ── 6. Response headers
  const headers: Record<string, string> = {
    'Content-Type':  'application/x-ndjson',
    'Cache-Control': 'no-cache',
    'Connection':    'keep-alive'
  };
  if (keywordCorrected && resolvedKeyword) {
    headers['X-Corrected-Keyword'] = resolvedKeyword;
    headers['X-Original-Keyword']  = rawKeyword!;
  }
  if (cityCorrected && resolvedCity) {
    headers['X-Corrected-City'] = resolvedCity;
  }

  // ── 7. Stream
  const encoder   = new TextEncoder();
  const batchSize = 12;

  const stream = new ReadableStream({
    async start(controller) {
      const meta = {
        __meta: true,
        total:  finalCount,
        query: {
          keyword:  resolvedKeyword  ?? null,
          city:     resolvedCity     ?? null,
          category: intentCategory   ?? null,
          isGlobal: isGlobalQuery,
          correctedKeyword: keywordCorrected ? resolvedKeyword : null,
          correctedCity:    cityCorrected    ? resolvedCity    : null
        }
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
                orderBy: { price: 'asc' }
              }
            },
            orderBy: [{ isFeatured: 'desc' }, { date: 'asc' }],
            take,
            skip
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
                seller:      tb.seller
              }))
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
    }
  });

  return new Response(stream, { headers });
}

// ─── TICKETMASTER SYNC ───────────────────────────────────────────────────
async function syncExternalEvents(
  targetCity: string | null,
  keyword:    string | null,
  category:   string | null,
  apiKey:     string
) {
  try {
    let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&size=100`;

    if (keyword) {
      tmUrl += `&keyword=${encodeURIComponent(keyword)}`;
    }
    
    if (targetCity && !isGlobalCity(targetCity)) {
      tmUrl += `&city=${encodeURIComponent(targetCity)}`;
    }

    if (category && category !== 'All') {
      const catMap: Record<string, string> = {
        Concerts: 'Music', Theater: 'Arts & Theatre',
        Comedy:   'Comedy', Sports: 'Sports', Sport: 'Sports'
      };
     
      if (category === 'Festivals') {
        if (!keyword) tmUrl += `&keyword=Festival`;
      } else {
        tmUrl += `&classificationName=${encodeURIComponent(catMap[category] ?? category)}`;
      }
    }

    if (keyword || (!targetCity && (!category || category === 'All'))) {
      tmUrl += `&sort=relevance,desc`;
    } else {
      tmUrl += `&sort=date,asc`;
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
        select: { title: true }
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
      const actualCity  = extEvent._embedded?.venues?.[0]?.city?.name  || (isGlobalCity(targetCity) ? 'Global' : targetCity) || 'Global';
      const venueName   = extEvent._embedded?.venues?.[0]?.name        || 'TBA';
      const imageUrl    =
        extEvent.images?.find((img: any) => img.ratio === '16_9' && img.width >= 1024)?.url ||
        extEvent.images?.[0]?.url ||
        'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=1000';

      const eventDateString = extEvent.dates?.start?.dateTime || extEvent.dates?.start?.localDate;
      const date = eventDateString
        ? new Date(eventDateString)
        : new Date(Date.now() + 86_400_000 * 7);

      // Extracts artist/attraction names directly from Ticketmaster
      const attractions = extEvent._embedded?.attractions
        ?.map((a: any) => a.name)
        .join(', ');

      const description = `${catName} at ${venueName}${attractions ? ` • Feat. ${attractions}` : ''}`;

      const newEvent = await prisma.event.create({
        data: {
          title,
          description,
          date,
          city:        actualCity,
          country:     'GLOBAL',
          basePrice,
          imageUrl,
          isFeatured:  false
        }
      });

      const numSellers   = Math.floor(Math.random() * 5) + 3;
      const assignedBots = [...botPool].sort(() => Math.random() - 0.5).slice(0, numSellers);

      await prisma.ticketBatch.createMany({
        data: assignedBots.map(botId => ({
          eventId:  newEvent.id,
          sellerId: botId,
          price:    basePrice,
          quantity: Math.floor(Math.random() * 4) + 1
        }))
      });

      alreadyInDb.add(title);
    }
  } catch (err) {
    console.error('TM Sync error:', err instanceof Error ? err.message : err);
  }
                             }
