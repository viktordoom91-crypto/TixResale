// app/admin/approve-order/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function POST(request: Request) {
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  
  // Verify Admin Security
  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, action } = await request.json(); // action is 'APPROVE' or 'REJECT'

  if (!orderId || !action) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (action === 'APPROVE') {
      // Approve the order (funds confirmed, ticket belongs to user)
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'APPROVED' },
      });
      
    } else if (action === 'REJECT') {
      // 🛠 FIXED: If rejected, cancel the order and put the ticket back into the TicketBatch pool
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        }),
        prisma.ticketBatch.update({
          where: { id: order.ticketBatchId }, // Changed from listingId
          data: { ticketsSold: { decrement: 1 } }, // Puts the ticket back in the available pool
        })
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
