// app/api/events/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedCity = searchParams.get('city');
  const requestedKeyword = searchParams.get('keyword');
  const requestedCategory = searchParams.get('category'); // 🛠 NEW: Global Category Hook

  const city = requestedCity || request.headers.get('x-vercel-ip-city') || 'London';

  setTimeout(() => {
    syncExternalEvents(city, requestedKeyword, requestedCategory).catch(console.error);
  }, 1000);

  let andConditions: any[] = [];

  // 1. Keyword search checks title, desc, and city globally
  if (requestedKeyword) {
    andConditions.push({
      OR: [
        { title: { contains: requestedKeyword, mode: 'insensitive' } },
        { description: { contains: requestedKeyword, mode: 'insensitive' } },
        { city: { contains: requestedKeyword, mode: 'insensitive' } } 
      ]
    });
  } 
  // 2. If NO keyword AND NO specific category, restrict to the local city
  else if (!requestedCategory || requestedCategory === 'All') {
    andConditions.push({ city: { equals: city, mode: 'insensitive' } });
  }

  // 3. Category search filters globally across the database
  if (requestedCategory && requestedCategory !== 'All') {
    let mappedCat = requestedCategory;
    if (requestedCategory === 'Concerts') mappedCat = 'Music';
    if (requestedCategory === 'Theater') mappedCat = 'Theat'; 

    andConditions.push({
      OR: [
        { description: { contains: mappedCat, mode: 'insensitive' } },
        { title: { contains: mappedCat, mode: 'insensitive' } }
      ]
    });
  }

  const dbQuery = andConditions.length > 0 ? { AND: andConditions } : {};

  // Create a Readable Stream to push data in chunks
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
            orderBy: { date: 'asc' },
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

// --- UPGRADED TICKETMASTER AGGREGATOR ---
async function syncExternalEvents(targetCity: string, keyword: string | null, category: string | null) {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) return;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&size=10&sort=date,asc`;
    
    // 🛠 THE FIX: If category is selected, search Ticketmaster Globally!
    if (keyword) {
      tmUrl += `&keyword=${encodeURIComponent(keyword)}`;
    } else if (category && category !== 'All') {
      let tmCat = category;
      if (category === 'Concerts') tmCat = 'Music';
      if (category === 'Theater') tmCat = 'Arts & Theatre';
      tmUrl += `&classificationName=${encodeURIComponent(tmCat)}`; // Global fetch!
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
      const basePrice = extEvent.priceRanges?.[0]?.min ? (extEvent.priceRanges[0].min * 1000) : 15000; 

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
            const isCompany = Math.random() > 0.7;
            const dynamicName = isCompany ? `${faker.company.name()} Tickets` : faker.person.fullName();
            return prisma.sellerProfile.create({
              data: { name: dynamicName, isBot: true, avatarUrl: faker.image.avatarGitHub() }
            });
          })
        );

        const batchesData = newBots.map((bot) => {
          const marketRoll = Math.random();
          let multiplier = 1;
          if (marketRoll < 0.2) multiplier = 0.80 + (Math.random() * 0.15);      
          else if (marketRoll < 0.7) multiplier = 1.0 + (Math.random() * 0.15); 
          else multiplier = 1.2 + (Math.random() * 0.40);                       

          return {
            eventId: newEvent.id,
            sellerId: bot.id,
            price: Math.round(newEvent.basePrice * multiplier),
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