// app/api/events/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedCity     = searchParams.get('city');
  const requestedKeyword  = searchParams.get('keyword');
  const requestedCategory = searchParams.get('category');

  // Build the Prisma WHERE clause
  const andConditions: any[] = [];

  if (requestedKeyword) {
    andConditions.push({
      OR: [
        { title:       { contains: requestedKeyword, mode: 'insensitive' } },
        { description: { contains: requestedKeyword, mode: 'insensitive' } },
        { city:        { contains: requestedKeyword, mode: 'insensitive' } },
      ],
    });
  }

  if (requestedCategory && requestedCategory !== 'All') {
    let mappedCat = requestedCategory;
    if (requestedCategory === 'Concerts')  mappedCat = 'Music';
    if (requestedCategory === 'Theater')   mappedCat = 'Theatre';
    if (requestedCategory === 'Comedy')    mappedCat = 'Comedy';
    if (requestedCategory === 'Sports')    mappedCat = 'Sports';
    if (requestedCategory === 'Festivals') mappedCat = 'Festival';

    andConditions.push({
      OR: [
        { description: { contains: mappedCat, mode: 'insensitive' } },
        { title:       { contains: mappedCat, mode: 'insensitive' } },
      ],
    });
  }

  if (requestedCity && !requestedKeyword) {
    andConditions.push({ city: { equals: requestedCity, mode: 'insensitive' } });
  }

  const dbQuery = andConditions.length > 0 ? { AND: andConditions } : {};

  // ─── SPEED OPTIMISATION ───────────────────────────────────────────────────
  // Check whether we already have matching events in the DB.
  // If yes  → stream them IMMEDIATELY and kick off the external sync in the
  //           background so the next request benefits from fresh data.
  // If no   → await the sync first (first-ever query for this search term),
  //           then stream whatever was just imported.
  // ─────────────────────────────────────────────────────────────────────────
  const existingCount = await prisma.event.count({ where: dbQuery });

  if (existingCount > 0) {
    // Fire-and-forget: update the cache in the background without blocking
    syncExternalEvents(requestedCity, requestedKeyword, requestedCategory).catch(console.error);
  } else {
    // First load for this query — wait for sync so the user sees results
    await syncExternalEvents(requestedCity, requestedKeyword, requestedCategory).catch(console.error);
  }

  // Stream paginated results from the DB
  const encoder = new TextEncoder();
  const stream  = new ReadableStream({
    async start(controller) {
      let skip      = 0;
      const batchSize = 12;
      let hasMore   = true;

      try {
        while (hasMore) {
          const batch = await prisma.event.findMany({
            where: dbQuery,
            include: {
              ticketBatches: {
                // Only include batches that still have stock
                where:   { quantity: { gt: 0 } },
                include: { seller: { select: { name: true, avatarUrl: true, isBot: true } } },
                orderBy: { price: 'asc' },
              },
            },
            orderBy: { date: 'asc' },
            take:  batchSize,
            skip,
          });

          if (batch.length === 0) {
            hasMore = false;
          } else {
            const formattedBatch = batch.map(event => ({
              ...event,
              listings:     event.ticketBatches,
              ticketBatches: undefined,
            }));

            controller.enqueue(encoder.encode(JSON.stringify(formattedBatch) + '\n'));
            skip += batchSize;
          }
        }
      } catch (error) {
        console.error('Stream Error:', error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}

// ─── TICKETMASTER SYNC ────────────────────────────────────────────────────────
// Rules:
//   • Uses only real Ticketmaster prices — no invented numbers.
//   • offsale (sold out on TM) and postponed events ARE included — they are
//     listed as available resale tickets at the exact price they sold for.
//   • Only truly cancelled events are skipped (event not happening).
//   • Skips events with no price data (price unknown ≠ free).
//   • All bot batches use the EXACT TM sold price; no random markup.
// ─────────────────────────────────────────────────────────────────────────────
async function syncExternalEvents(
  targetCity: string | null,
  keyword:    string | null,
  category:   string | null,
) {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) return;

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 15000);

    let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}`;

    if (keyword) {
      tmUrl += `&keyword=${encodeURIComponent(keyword)}&size=50&sort=date,asc`;
    } else if (category && category !== 'All') {
      let tmCat = category;
      if (category === 'Concerts') tmCat = 'Music';
      if (category === 'Theater')  tmCat = 'Arts & Theatre';
      if (category === 'Comedy')   tmCat = 'Comedy';
      if (category === 'Sports')   tmCat = 'Sports';

      if (category === 'Festivals') {
        tmUrl += `&keyword=Festival&size=50&sort=date,asc`;
      } else {
        tmUrl += `&classificationName=${encodeURIComponent(tmCat)}&size=50&sort=date,asc`;
      }
    } else if (targetCity) {
      tmUrl += `&city=${encodeURIComponent(targetCity)}&size=50&sort=date,asc`;
    } else {
      tmUrl += `&size=50&sort=relevance,desc`;
    }

    const response = await fetch(tmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return;

    const data       = await response.json();
    const liveEvents = (data._embedded?.events ?? []) as any[];

    for (const extEvent of liveEvents) {
      // ── 1. Skip only truly cancelled events (event isn't happening) ──
      // offsale  = sold out on TM  → list as resale at sold price ✓
      // postponed = date TBD       → list as resale at sold price ✓
      // cancelled = event scrapped → nothing to sell, skip         ✗
      const statusCode = extEvent.dates?.status?.code as string | undefined;
      if (statusCode === 'cancelled') {
        continue;
      }

      // ── 2. Require a real price — skip if TM has no price data ─────────
      const priceRange = extEvent.priceRanges?.[0];
      if (!priceRange || priceRange.min == null) {
        // Price is genuinely unknown; don't invent one
        continue;
      }
      const basePrice = Number(Number(priceRange.min).toFixed(2));

      // ── 3. Parse the rest of the event details ─────────────────────────
      const title       = (extEvent.name as string)?.substring(0, 250) || 'Live Event';
      const catName     = extEvent.classifications?.[0]?.segment?.name || 'Live Event';
      const actualCity  = extEvent._embedded?.venues?.[0]?.city?.name || targetCity || 'Global';
      const venueName   = extEvent._embedded?.venues?.[0]?.name || 'TBA';
      const description = `${catName} at ${venueName}`;

      const eventDateString = extEvent.dates?.start?.dateTime || extEvent.dates?.start?.localDate;
      const date = eventDateString
        ? new Date(eventDateString)
        : new Date(Date.now() + 86_400_000 * 7);

      const imageUrl =
        extEvent.images?.[0]?.url ||
        'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=1000';

      // ── 4. Upsert — skip if this event is already in the DB ────────────
      const existing = await prisma.event.findFirst({
        where: { title, city: actualCity },
      });
      if (existing) continue;

      // ── 5. Create event ────────────────────────────────────────────────
      const newEvent = await prisma.event.create({
        data: {
          title,
          description,
          date,
          city:       actualCity,
          country:    'GLOBAL',
          basePrice,
          imageUrl,
          isFeatured: false,
        },
      });

      // ── 6. Create bot sellers and ticket batches ───────────────────────
      //    Price = exact TM basePrice for all batches. No random markup.
      const numSellers = Math.floor(Math.random() * 6) + 3;

      const newBots = await Promise.all(
        Array.from({ length: numSellers }).map(() =>
          prisma.sellerProfile.create({
            data: {
              name:      'Verified Seller',
              isBot:     true,
              avatarUrl: faker.image.avatarGitHub(),
            },
          }),
        ),
      );

      const batchesData = newBots.map(bot => ({
        eventId:  newEvent.id,
        sellerId: bot.id,
        price:    basePrice,                           // exact TM price — no hallucination
        quantity: Math.floor(Math.random() * 4) + 1,  // 1–4 tickets per batch
      }));

      await prisma.ticketBatch.createMany({ data: batchesData });
    }
  } catch (error) {
    console.error(
      'Ticketmaster Sync Suppressed:',
      error instanceof Error ? error.message : 'Timeout',
    );
  }
    }
