// app/api/events/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

export const dynamic = 'force-dynamic';

// ─── SYNC COOLDOWN CACHE ───────────────────────────────────────────────────
// Prevents hammering the Ticketmaster API on every request.
// Each unique query key is rate-limited to one sync per 30 minutes.
const syncCooldown = new Map<string, number>();
const SYNC_TTL_MS  = 30 * 60 * 1000; // 30 minutes

function isSyncCoolingDown(key: string): boolean {
  const last = syncCooldown.get(key);
  return !!last && Date.now() - last < SYNC_TTL_MS;
}
function markSynced(key: string) {
  syncCooldown.set(key, Date.now());
}

// ─── BOT SELLER POOL ───────────────────────────────────────────────────────
// Instead of creating 3-8 new bot documents per event (hundreds of DB writes
// per sync), we maintain a shared pool of 40 bots and randomly assign from it.
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

  // Fill the gap
  const needed   = BOT_POOL_SIZE - existing.length;
  const newBots  = await prisma.sellerProfile.createManyAndReturn({
    data: Array.from({ length: needed }).map(() => ({
      name:      'Verified Seller',
      isBot:     true,
      avatarUrl: faker.image.avatarGitHub(),
    })),
  });

  _botPoolCache = [...existing.map(b => b.id), ...newBots.map(b => b.id)];
  return _botPoolCache;
}

// ─── CITY ALIAS MAP ────────────────────────────────────────────────────────
// Catches common abbreviations and misspellings before hitting the DB or TM.
const CITY_ALIASES: Record<string, string> = {
  'nyc': 'New York', 'ny': 'New York', 'new yok': 'New York', 'new yokr': 'New York',
  'la': 'Los Angeles', 'los angles': 'Los Angeles', 'los angelos': 'Los Angeles',
  'lon': 'London', 'londen': 'London', 'londn': 'London',
  'chi': 'Chicago', 'chicgo': 'Chicago',
  'sf': 'San Francisco', 'san fran': 'San Francisco',
  'dc': 'Washington', 'washington dc': 'Washington',
  'lv': 'Las Vegas', 'vegas': 'Las Vegas',
  'atl': 'Atlanta', 'atlnata': 'Atlanta',
  'mia': 'Miami', 'miamia': 'Miami',
  'tor': 'Toronto', 'tronto': 'Toronto',
  'par': 'Paris', 'pris': 'Paris', 'paaris': 'Paris',
  'ber': 'Berlin', 'berlim': 'Berlin',
  'tok': 'Tokyo', 'tokio': 'Tokyo',
  'syd': 'Sydney', 'sydeny': 'Sydney',
  'mel': 'Melbourne', 'melbourna': 'Melbourne',
  'lag': 'Lagos', 'lagos': 'Lagos',
  'abj': 'Abuja',
  'dub': 'Dubai', 'dubay': 'Dubai',
};

function normalizeCity(city: string | null): string | null {
  if (!city) return null;
  const lower = city.trim().toLowerCase();
  return CITY_ALIASES[lower] ?? city.trim();
}

// ─── FUZZY KEYWORD CORRECTION via TM Suggest API ─────────────────────────
// Calls Ticketmaster's /suggest endpoint to autocorrect artist/event typos.
// Returns the corrected term, or the original if suggestion fails.
async function correctKeyword(keyword: string, apiKey: string): Promise<string> {
  try {
    const url = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=${apiKey}`
              + `&keyword=${encodeURIComponent(keyword)}&resource=attractions,events&size=1`;

    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return keyword;

    const json = await res.json();

    // Prefer attraction name (artist/band), fallback to event name
    const attraction = json._embedded?.attractions?.[0]?.name;
    const event      = json._embedded?.events?.[0]?.name;
    const suggestion = attraction || event;

    if (!suggestion) return keyword;

    // Only accept the correction if it's meaningfully different
    const similarity = suggestion.toLowerCase().includes(keyword.toLowerCase().slice(0, 4));
    return similarity ? suggestion : keyword;

  } catch {
    return keyword; // Never block on correction failure
  }
}

// ─── FUZZY CITY CORRECTION via TM Suggest API ────────────────────────────
async function correctCity(city: string, apiKey: string): Promise<string> {
  try {
    const url = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=${apiKey}`
              + `&keyword=${encodeURIComponent(city)}&resource=venues&size=1`;

    const res  = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return city;
    const json = await res.json();

    const correctedCity = json._embedded?.venues?.[0]?.city?.name;
    return correctedCity || city;
  } catch {
    return city;
  }
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCity     = searchParams.get('city');
  const rawKeyword  = searchParams.get('keyword');
  const rawCategory = searchParams.get('category');

  const apiKey = process.env.TICKETMASTER_API_KEY;

  // ── 1. Correct / normalise inputs in parallel ──────────────────────────
  const [resolvedKeyword, resolvedCity] = await Promise.all([
    rawKeyword && apiKey ? correctKeyword(rawKeyword, apiKey) : Promise.resolve(rawKeyword),
    rawCity    && apiKey
      ? (async () => {
          const aliased = normalizeCity(rawCity);
          // Only hit TM Suggest if alias map didn't already fix it
          return aliased !== rawCity ? aliased : correctCity(rawCity, apiKey);
        })()
      : Promise.resolve(normalizeCity(rawCity)),
  ]);

  const keywordCorrected = resolvedKeyword !== rawKeyword;
  const cityCorrected    = resolvedCity    !== rawCity;

  // ── 2. Build Prisma WHERE clause ──────────────────────────────────────
  const andConditions: any[] = [];

  if (resolvedKeyword) {
    // Split multi-word queries and OR them for partial fuzzy DB matching
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
      Concerts: 'Music', Theater: 'Theatre', Comedy: 'Comedy',
      Sports: 'Sports', Festivals: 'Festival',
    };
    const mappedCat = catMap[rawCategory] ?? rawCategory;
    andConditions.push({
      OR: [
        { description: { contains: mappedCat, mode: 'insensitive' } },
        { title:       { contains: mappedCat, mode: 'insensitive' } },
      ],
    });
  }

  if (resolvedCity && !resolvedKeyword) {
    andConditions.push({ city: { contains: resolvedCity, mode: 'insensitive' } });
  }

  const dbQuery    = andConditions.length > 0 ? { AND: andConditions } : {};
  const syncKey    = `${resolvedCity}::${resolvedKeyword}::${rawCategory}`;
  const batchSize  = 12;

  // ── 3. Parallel: count existing + prime bot pool ──────────────────────
  const [existingCount] = await Promise.all([
    prisma.event.count({ where: dbQuery }),
    getBotPool(), // warm the pool cache while we count
  ]);

  // ── 4. Sync strategy ──────────────────────────────────────────────────
  if (existingCount > 0) {
    // Results exist → stream immediately, sync in background (non-blocking)
    if (!isSyncCoolingDown(syncKey) && apiKey) {
      markSynced(syncKey);
      syncExternalEvents(resolvedCity, resolvedKeyword, rawCategory, apiKey).catch(console.error);
    }
  } else {
    // First-ever query → must await sync so user sees data on first load
    if (apiKey) {
      markSynced(syncKey);
      await syncExternalEvents(resolvedCity, resolvedKeyword, rawCategory, apiKey).catch(console.error);
    }
  }

  // ── 5. Build corrected-keyword headers for frontend display ───────────
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

  // ── 6. Stream paginated results ────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let skip    = 0;
      let hasMore = true;

      // Send first batch fast (take 6) so the page renders instantly,
      // then continue in larger batches of 12.
      const sizes = [6, ...Array(100).fill(batchSize)];

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
            // Rename ticketBatches → listings for frontend compatibility,
            // and include full availability metadata per card
            const formatted = batch.map(event => {
              const { ticketBatches, ...rest } = event;
              return {
                ...rest,
                listings: ticketBatches.map(tb => ({
                  id:         tb.id,
                  price:      tb.price,
                  quantity:   tb.quantity,
                  ticketsSold: tb.ticketsSold,
                  seller:     tb.seller,
                })),
              };
            });

            controller.enqueue(encoder.encode(JSON.stringify(formatted) + '\n'));
            skip += take;
          }
        }
      } catch (error) {
        console.error('Stream error:', error);
        // Emit a soft error line so the client knows the stream ended early
        controller.enqueue(encoder.encode(JSON.stringify({ __error: 'Stream interrupted' }) + '\n'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}

// ─── TICKETMASTER SYNC ────────────────────────────────────────────────────
// Rules:
//   • offsale / postponed events ARE included (valid resale).
//   • Only truly cancelled events are skipped.
//   • No invented prices — only real TM priceRanges data.
//   • Uses the shared bot pool — zero new sellerProfile documents per event.
//   • Batch-checks existing events in ONE query instead of N individual lookups.
// ─────────────────────────────────────────────────────────────────────────
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
        Comedy: 'Comedy', Sports: 'Sports',
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

    // ── Batch dedup: one query to find all already-imported events ────────
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

    // ── Get bot pool (already warmed by GET handler) ──────────────────────
    const botPool = await getBotPool();

    // ── Process only new events ───────────────────────────────────────────
    for (const extEvent of liveEvents) {
      const statusCode = (extEvent.dates?.status?.code as string)?.toLowerCase();
      if (statusCode === 'cancelled') continue;

      const priceRange = extEvent.priceRanges?.[0];
      if (!priceRange?.min) continue;

      const title = (extEvent.name as string)?.substring(0, 250) || 'Live Event';
      if (alreadyInDb.has(title)) continue; // skip — already in DB

      const basePrice   = Number(Number(priceRange.min).toFixed(2));
      const catName     = extEvent.classifications?.[0]?.segment?.name || 'Live Event';
      const actualCity  = extEvent._embedded?.venues?.[0]?.city?.name || targetCity || 'Global';
      const venueName   = extEvent._embedded?.venues?.[0]?.name || 'TBA';
      const description = `${catName} at ${venueName}`;
      const imageUrl    =
        extEvent.images?.find((img: any) => img.ratio === '16_9' && img.width >= 1024)?.url ||
        extEvent.images?.[0]?.url ||
        'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=1000';

      const eventDateString = extEvent.dates?.start?.dateTime || extEvent.dates?.start?.localDate;
      const date = eventDateString
        ? new Date(eventDateString)
        : new Date(Date.now() + 86_400_000 * 7);

      // Create event
      const newEvent = await prisma.event.create({
        data: {
          title, description, date,
          city:       actualCity,
          country:    'GLOBAL',
          basePrice,
          imageUrl,
          isFeatured: false,
        },
      });

      // Assign random bots from the shared pool — zero new seller documents
      const numSellers   = Math.floor(Math.random() * 5) + 3; // 3-7 sellers
      const shuffled     = [...botPool].sort(() => Math.random() - 0.5);
      const assignedBots = shuffled.slice(0, numSellers);

      await prisma.ticketBatch.createMany({
        data: assignedBots.map(botId => ({
          eventId:  newEvent.id,
          sellerId: botId,
          price:    basePrice,
          quantity: Math.floor(Math.random() * 4) + 1, // 1-4 tickets
        })),
      });

      alreadyInDb.add(title); // prevent duplicate processing in same sync run
    }

  } catch (error) {
    console.error(
      'TM Sync error:',
      error instanceof Error ? error.message : 'Unknown',
    );
  }
  }
