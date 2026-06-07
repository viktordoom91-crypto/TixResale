// app/api/events/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedCity = searchParams.get('city');
  const requestedKeyword = searchParams.get('keyword');
  const requestedCategory = searchParams.get('category');

  const city = requestedCity || request.headers.get('x-vercel-ip-city') || 'Global';

  // 🛠 THE FIX: We AWAIT the Ticketmaster sync before querying the database.
  // This guarantees that any new events queried by the user are permanently SAVED to the DB 
  // before the stream starts, granting instant results without requiring a manual refresh.
  await syncExternalEvents(city, requestedKeyword, requestedCategory).catch(console.error);

  let andConditions: any[] = [];

  // 1. Keyword search (Artist/Venue) globally
  if (requestedKeyword) {
    andConditions.push({
      OR: [
        { title: { contains: requestedKeyword, mode: 'insensitive' } },
        { description: { contains: requestedKeyword, mode: 'insensitive' } },
        { city: { contains: requestedKeyword, mode: 'insensitive' } } 
      ]
    });
  } 
  
  // 2. Category search globally
  if (requestedCategory && requestedCategory !== 'All') {
    let mappedCat = requestedCategory;
    if (requestedCategory === 'Concerts') mappedCat = 'Music';
    if (requestedCategory === 'Theater') mappedCat = 'Theatre'; 

    andConditions.push({
      OR: [
        { description: { contains: mappedCat, mode: 'insensitive' } },
        { title: { contains: mappedCat, mode: 'insensitive' } }
      ]
    });
  }

  // 3. If NO keyword and NO category, show Local City OR Admin Events
  if (!requestedKeyword && (!requestedCategory || requestedCategory === 'All')) {
    andConditions.push({
      OR: [
        { city: { equals: city, mode: 'insensitive' } },
        { country: 'Manual Entry' }, // 🛠 ALWAYS show events added by Admin
        { isFeatured: true }         // 🛠 ALWAYS show featured events
      ]
    });
  }

  // 4. Auto-Expire: Only show events whose date is today or in the future
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  andConditions.push({ date: { gte: yesterday } });

  const dbQuery = andConditions.length > 0 ? { AND: andConditions } : {};

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
            orderBy: [
              { isFeatured: 'desc' }, // Admin/Featured events float to the top
              { date: 'asc' }
            ],
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

// --- TICKETMASTER AGGREGATOR ---
async function syncExternalEvents(targetCity: string, keyword: string | null, category: string | null) {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) return;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 sec max timeout so we don't stall the UI forever

    let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&size=20&sort=date,asc`;
    
    if (keyword) {
      tmUrl += `&keyword=${encodeURIComponent(keyword)}`;
    } else if (category && category !== 'All') {
      let tmCat = category;
      if (category === 'Concerts') tmCat = 'Music';
      if (category === 'Theater') tmCat = 'Arts & Theatre';
      tmUrl += `&classificationName=${encodeURIComponent(tmCat)}`;
    } else {
      tmUrl += `&city=${encodeURIComponent(targetCity)}`;
    }

    const response = await fetch(tmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    let liveEvents = [];
    if (response.ok) {
      const data = await response.json();
      liveEvents = data._embedded?.events || [];
    }

    for (const extEvent of liveEvents) {
      const title = extEvent.name?.substring(0, 250) || "Live Event";
      const catName = extEvent.classifications?.[0]?.segment?.name || "Live Event";
      const actualCity = extEvent._embedded?.venues?.[0]?.city?.name || targetCity;
      const venueName = extEvent._embedded?.venues?.[0]?.name || 'TBA';
      const description = `${catName} at ${venueName}`;
      const eventDateString = extEvent.dates?.start?.dateTime || extEvent.dates?.start?.localDate;
      const date = eventDateString ? new Date(eventDateString) : new Date(Date.now() + 86400000 * 7);
      const imageUrl = extEvent.images?.[0]?.url || "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=1000";
      
      // 🛠 FIXED: Exact Ticketmaster retail price mapping
      const basePrice = extEvent.priceRanges?.[0]?.min ? Number(extEvent.priceRanges[0].min.toFixed(2)) : 50.00; 

      const existingEvent = await prisma.event.findFirst({
        where: { title, city: actualCity }
      });

      if (!existingEvent) {
        const newEvent = await prisma.event.create({
          data: { title, description, date, city: actualCity, country: 'GLOBAL', basePrice, imageUrl, isFeatured: false }
        });

        const numSellers = Math.floor(Math.random() * 6) + 3;
        
        const newBots = await Promise.all(
          Array.from({ length: numSellers }).map(() => {
            return prisma.sellerProfile.create({
              data: { name: "Verified Seller", isBot: true, avatarUrl: faker.image.avatarGitHub() }
            });
          })
        );

        const batchesData = newBots.map((bot) => {
          const variation = Math.random() < 0.5 ? 0 : Math.floor(Math.random() * 15);
          return {
            eventId: newEvent.id,
            sellerId: bot.id,
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
