// app/api/events/route.ts
import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

export const dynamic = 'force-dynamic';

// ─── SYNC COOLDOWN (Prevents TM API Rate Limiting) ───────────────────────
const syncCooldown = new Map<string, number>();
const SYNC_TTL_MS  = 30 * 60 * 1000; // 30 minutes

function isSyncCoolingDown(key: string) {
  const last = syncCooldown.get(key);
  return !!last && Date.now() - last < SYNC_TTL_MS;
}

function markSynced(key: string) {
  syncCooldown.set(key, Date.now());
}

// ─── BOT SELLER POOL (Prevents DB Overload) ──────────────────────────────
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

// ─── GLOBAL INTENT PARSERS ───────────────────────────────────────────────
function isGlobalCity(city: string | null): boolean {
  if (!city) return true;
  const c = city.toLowerCase().trim();
  return ['global', 'all', 'any', 'worldwide'].includes(c);
}

function parseGlobalIntent(keyword: string | null, category: string | null) {
  let resolvedKeyword = keyword?.trim() || null;
  let resolvedCategory = category;

  if (resolvedKeyword) {
    const lowerKw = resolvedKeyword.toLowerCase();

    // 1. All/Any Artists
    if (['all artists', 'all artist', 'any artist', 'any artists', 'all music', 'any music'].includes(lowerKw)) {
      resolvedKeyword = null; 
      resolvedCategory = 'Concerts'; 
    }
    // 2. All/Any Sports
    else if (['all sports', 'all sport', 'any sport', 'any sports', 'any sport event', 'all sport events'].includes(lowerKw)) {
      resolvedKeyword = null;
      resolvedCategory = 'Sports';
    }
    // 3. Specific Major Leagues
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


// ─── MAIN HANDLER ────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCity     = searchParams.get('city');
  const rawKeyword  = searchParams.get('keyword');
  const rawCategory = searchParams.get('category');
  const apiKey      = process.env.TICKETMASTER_API_KEY;

  // 1. Parse Intents
  const { intentKeyword, intentCategory } = parseGlobalIntent(rawKeyword, rawCategory);
  
  // 2. Await External Sync Safely using the Cooldown map
  const syncKey = `${rawCity ?? 'global'}::${intentKeyword ?? ''}::${intentCategory ?? ''}`;
  if (apiKey && !isSyncCoolingDown(syncKey)) {
    markSynced(syncKey);
    await syncExternalEvents(rawCity, intentKeyword, intentCategory, apiKey).catch(console.error);
  }

  // 3. Build Query Conditions
  const andConditions: any[] = [];

  // Keyword search (Artist/Venue) searches globally using the description fix
  if (intentKeyword) {
    const words = intentKeyword.trim().split(/\s+/).filter(Boolean);
    const wordConditions = words.map(word => ({
      OR: [
        { title:       { contains: word, mode: 'insensitive' } },
        { description: { contains: word, mode: 'insensitive' } }, // Artist name caught here!
        { city:        { contains: word, mode: 'insensitive' } },
      ]
    }));
    andConditions.push(...wordConditions);
  }

  // Category mapping
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

  // City filter applied ONLY if explicitly requested and NOT a global term
  if (rawCity && !isGlobalCity(rawCity)) {
    andConditions.push({ city: { equals: rawCity.trim(), mode: 'insensitive' } });
  }

  const dbQuery = andConditions.length > 0 ? { AND: andConditions } : {};

  // 4. Initialize bot pool in background
  getBotPool().catch(err => console.error('Bot pool warm failed:', err));

  // 5. Stream logic to handle UI pagination
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let skip = 0;
      const batchSize = 12; 
      let hasMore = true;

      try {
        while (hasMore) {
          const batch = await prisma.event.findMany({
            where: dbQuery,
            include: {
              ticketBatches: {
                where: { quantity: { gt: 0 } },
                include: { seller: { select: { name: true, avatarUrl: true, isBot: true } } },
                orderBy: { price: 'asc' },
              },
            },
            orderBy: [{ isFeatured: 'desc' }, { date: 'asc' }],
            take: batchSize,
            skip: skip,
          });

          if (batch.length === 0) {
            hasMore = false;
          } else {
            const formattedBatch = batch.map(event => ({
              ...event,
              listings: event.ticketBatches, 
              ticketBatches: undefined 
            }));

            const chunk = JSON.stringify(formattedBatch) + "\n";
            controller.enqueue(encoder.encode(chunk));
            skip += batchSize;
          }
        }
      } catch (error) {
        console.error("Stream Error:", error);
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { 
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    },
  });
}

// ─── UPGRADED TICKETMASTER AGGREGATOR ────────────────────────────────────
async function syncExternalEvents(
  targetCity: string | null, 
  keyword: string | null, 
  category: string | null,
  apiKey: string
) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&size=50`;
    
    // 🛠 GLOBAL & CATEGORY QUERY LOGIC
    if (keyword) {
      tmUrl += `&keyword=${encodeURIComponent(keyword)}&sort=relevance,desc`;
    } 
    
    if (category && category !== 'All') {
      const catMap: Record<string, string> = {
        Concerts: 'Music', Theater: 'Arts & Theatre',
        Comedy: 'Comedy', Sports: 'Sports', Sport: 'Sports'
      };
      
      if (category === 'Festivals') {
        if (!keyword) tmUrl += `&keyword=Festival`;
      } else {
        tmUrl += `&classificationName=${encodeURIComponent(catMap[category] ?? category)}`; 
      }
    } 
    
    if (targetCity && !isGlobalCity(targetCity)) {
      tmUrl += `&city=${encodeURIComponent(targetCity)}`;
    } 

    // Sort by date if no keyword is present, otherwise relevance
    if (!keyword) {
        tmUrl += `&sort=date,asc`;
    }

    const response = await fetch(tmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return;

    const data = await response.json();
    const liveEvents = data._embedded?.events || [];
    if (liveEvents.length === 0) return;

    const botPool = await getBotPool();

    for (const extEvent of liveEvents) {
      // Skip cancelled events and events without prices
      if (extEvent.dates?.status?.code?.toLowerCase() === 'cancelled') continue;
      if (!extEvent.priceRanges?.[0]?.min) continue;

      const title = extEvent.name?.substring(0, 250) || "Live Event";
      const catName = extEvent.classifications?.[0]?.segment?.name || "Live Event";
      const actualCity = extEvent._embedded?.venues?.[0]?.city?.name || (isGlobalCity(targetCity) ? "Global" : targetCity) || "Global";
      const venueName = extEvent._embedded?.venues?.[0]?.name || 'TBA';
      const eventDateString = extEvent.dates?.start?.dateTime || extEvent.dates?.start?.localDate;
      const date = eventDateString ? new Date(eventDateString) : new Date(Date.now() + 86400000 * 7);
      const imageUrl = 
        extEvent.images?.find((img: any) => img.ratio === '16_9' && img.width >= 1024)?.url || 
        extEvent.images?.[0]?.url || 
        "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=1000";
      
      const basePrice = Number(extEvent.priceRanges[0].min.toFixed(2)); 

      // 🔥 ARTIST/ATTRACTION FIX: Inject artists directly into the description
      const attractions = extEvent._embedded?.attractions?.map((a: any) => a.name).join(', ');
      const description = `${catName} at ${venueName}${attractions ? ` • Feat. ${attractions}` : ''}`;

      const existingEvent = await prisma.event.findFirst({
        where: { title, city: actualCity }
      });

      if (!existingEvent) {
        const newEvent = await prisma.event.create({
          data: { title, description, date, city: actualCity, country: 'GLOBAL', basePrice, imageUrl, isFeatured: false }
        });

        // Use the Bot Pool instead of creating new records every time
        const numSellers = Math.floor(Math.random() * 6) + 3;
        const assignedBots = [...botPool].sort(() => Math.random() - 0.5).slice(0, numSellers);

        const batchesData = assignedBots.map((botId) => {
          const variation = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 15);
          return {
            eventId: newEvent.id,
            sellerId: botId,
            price: basePrice + variation,
            quantity: Math.floor(Math.random() * 4) + 1,
          };
        });

        await prisma.ticketBatch.createMany({ data: batchesData });
      }
    }
  } catch (error) {
    console.error("Ticketmaster Sync Suppressed:", error instanceof Error ? error.message : "Timeout");
  }
            }
