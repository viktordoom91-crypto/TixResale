// app/api/admin/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await request.json(); 

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      // 🛠 FIXED: Replaced 'listing' with 'ticketBatch' here!
      include: { ticketBatch: { include: { event: true } } }
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
