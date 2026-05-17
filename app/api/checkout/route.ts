// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Ensure this path points to your NextAuth config

export async function POST(request: Request) {
  try {
    // Note: The frontend passes listingId, but it represents the ticketBatchId now.
    const { listingId, quantity = 1 } = await request.json();

    // 1. Securely fetch the session from the server
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null; 

    // 2. Transactional Lock using TicketBatch
    const batch = await prisma.ticketBatch.findUnique({
      where: { id: listingId },
    });

    if (!batch || batch.quantity < quantity) {
      return NextResponse.json({ error: 'Not enough tickets available in this batch.' }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 3. ATOMIC TRANSACTION: Create Order & Decrement Inventory
    // This perfectly prevents double-selling if 100 users click "Buy" at once
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          ticketBatchId: listingId, // 🛠 FIX: Links to TicketBatch
          userId, 
          expiresAt,
          status: 'PENDING',
        },
      }),
      prisma.ticketBatch.update({
        where: { id: listingId },
        data: { 
          quantity: { decrement: quantity }, // 🛠 FIX: Subtracts tickets safely
          ticketsSold: { increment: quantity }
        },
      })
    ]);

    const systemSettings = await prisma.systemSettings.findFirst();

    return NextResponse.json({ 
      orderId: order.id, 
      expiresAt: order.expiresAt,
      bankDetails: systemSettings 
    });

  } catch (error) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: 'Failed to initiate checkout' }, { status: 500 });
  }
}