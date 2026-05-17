// app/api/orders/[orderId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    // 🛠 FIXED: Changed 'id' to 'orderId' to match the [orderId] folder name
    const { orderId } = await params;
    const { status } = await request.json(); 

    const order = await prisma.order.update({
      where: { id: orderId }, // 🛠 FIXED: Query using orderId
      data: { status },
      include: { ticketBatch: { include: { event: true } } }
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
