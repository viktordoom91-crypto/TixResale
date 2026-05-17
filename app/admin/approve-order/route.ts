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

  const { orderId, action } = await request.json(); 

  if (!orderId || !action) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (action === 'APPROVE') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'APPROVED' },
      });
      
    } else if (action === 'REJECT') {
      // 🛠 THE FIX: Update TicketBatch instead of Listing!
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        }),
        prisma.ticketBatch.update({
          where: { id: order.ticketBatchId }, 
          data: { ticketsSold: { decrement: 1 } }, 
        })
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
