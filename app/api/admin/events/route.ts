// app/api/admin/events/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, date, city, basePrice, imageUrl, isFeatured } = body;

    // 1. Create the new Event
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        city,
        basePrice: parseInt(basePrice),
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=1000",
        isFeatured: Boolean(isFeatured),
        country: 'Manual Entry' 
      }
    });

    // 2. Fetch random bot sellers to populate the event
    const bots = await prisma.sellerProfile.findMany({
      where: { isBot: true },
      take: 12 // Grabs 12 bots to act as sellers
    });

    // 3. 🛠 THE FIX: Generate `TicketBatch` rows instead of Listings
    if (bots.length > 0) {
      const batchesData = bots.map((bot) => {
        // Creates a realistic price variance (+/- 15%)
        const multiplier = 0.85 + Math.random() * 0.30; 
        return {
          eventId: newEvent.id,
          sellerId: bot.id,
          price: Math.round(newEvent.basePrice * multiplier),
          quantity: Math.floor(Math.random() * 6) + 1, // Randomly assigns 1 to 6 tickets per bot
        };
      });

      await prisma.ticketBatch.createMany({ data: batchesData });
    }

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Create Event Error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}