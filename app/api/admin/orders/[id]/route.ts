// app/api/admin/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await request.json(); // e.g., 'APPROVED', 'CANCELLED'

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { listing: { include: { event: true } } }
    });

    // NOTE FOR PHASE 5: Right here is where we will trigger Resend to email the PDF receipt!

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
