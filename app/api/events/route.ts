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

  // Run the external sync in the background so it doesn't block the user
  setTimeout(() => {
    syncExternalEvents(requestedCity, requestedKeyword, requestedCategory).catch(console.error);
  }, 1000);

  let andConditions: any[] = [];

  // 1. Keyword search (Artist/Venue) searches globally
  if (requestedKeyword) {
    andConditions.push({
      OR: [
        { title: { contains: requestedKeyword, mode: 'insensitive' } },
        { description: { contains: requestedKeyword, mode: 'insensitive' } },
        { city: { contains: requestedKeyword, mode: 'insensitive' } } 
      ]
    });
  } 
  
  // 2. Category search filters globally across the database
  if (requestedCategory && requestedCategory !== 'All') {
    let mappedCat = requestedCategory;
    if (requestedCategory === 'Concerts') mappedCat = 'Music';
    if (requestedCategory === 'Theater') mappedCat = 'Theatre'; 
    if (requestedCategory === 'Comedy') mappedCat = 'Comedy';
    if (requestedCategory === 'Sports') mappedCat = 'Sports';
    if (requestedCategory === 'Festivals') mappedCat = 'Festival';

    andConditions.push({
      OR: [
        { description: { contains: mappedCat, mode: 'insensitive' } },
        { title: { contains: mappedCat, mode: 'insensitive' } }
      ]
    });
  }

  // 3. City filter applied ONLY if explicitly requested from the Navbar dropdown
  if (requestedCity) {
    andConditions.push({ city: { equals: requestedCity, mode: 'insensitive' } });
  }

  const dbQuery = andConditions.length > 0 ? { AND: andConditions } : {};

  // Stream logic to handle UI pagination
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
async function syncExternalEvents(targetCity: string | null, keyword: string | null, category: string | null) {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) return;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}`;
    
    // 🛠 GLOBAL & CATEGORY QUERY LOGIC
    if (keyword) {
      // Pull the full artist tour globally
      tmUrl += `&keyword=${encodeURIComponent(keyword)}&size=100&sort=date,asc`;
    } else if (category && category !== 'All') {
      // Map categories to Ticketmaster classifications globally
      let tmCat = category;
      if (category === 'Concerts') tmCat = 'Music';
      if (category === 'Theater') tmCat = 'Arts & Theatre';
      if (category === 'Comedy') tmCat = 'Comedy';
      if (category === 'Sports') tmCat = 'Sports';
      
      if (category === 'Festivals') {
        tmUrl += `&keyword=Festival&size=50&sort=date,asc`;
      } else {
        tmUrl += `&classificationName=${encodeURIComponent(tmCat)}&size=50&sort=date,asc`; 
      }
    } else if (targetCity) {
      // Fetch specific city
      tmUrl += `&city=${encodeURIComponent(targetCity)}&size=50&sort=date,asc`;
    } else {
      // Default: Fetch top global events
      tmUrl += `&size=50&sort=relevance,desc`;
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
      const actualCity = extEvent._embedded?.venues?.[0]?.city?.name || targetCity || "Global";
      const venueName = extEvent._embedded?.venues?.[0]?.name || 'TBA';
      const description = `${catName} at ${venueName}`;
      const eventDateString = extEvent.dates?.start?.dateTime || extEvent.dates?.start?.localDate;
      const date = eventDateString ? new Date(eventDateString) : new Date(Date.now() + 86400000 * 7);
      const imageUrl = extEvent.images?.[0]?.url || "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=1000";
      
      // 🛠 EXACT TICKETMASTER PRICE FIX
      // Uses the true minimum price from Ticketmaster (defaults to 50 if missing)
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
          // Keep price identical to TM, or add a tiny variation ($0 to $15) to represent better seats
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
