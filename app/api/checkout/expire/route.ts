// app/api/checkout/expire/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.status !== 'PENDING') {
      return NextResponse.json({ message: 'Order already processed or invalid' });
    }

    // 🛠 FIX: Release the ticket back to the marketplace by incrementing the batch
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      }),
      prisma.ticketBatch.update({
        where: { id: order.ticketBatchId }, // 🛠 FIX: Use ticketBatchId
        data: { 
          quantity: { increment: 1 }, // 🛠 FIX: Puts the ticket back into the pool safely
          ticketsSold: { decrement: 1 }
        },
      })
    ]);

    return NextResponse.json({ success: true, message: 'Ticket released back to market' });
  } catch (error) {
    console.error('Expire Error:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}