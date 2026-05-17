// app/api/admin/approve-order/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { orderId, action } = await request.json(); // action can be 'APPROVE' or 'REJECT'

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.status !== 'VERIFYING') {
      return NextResponse.json({ error: 'Invalid order or order not ready for verification' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      // Approve the transfer, finalize the sale
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'APPROVED' },
      });
      return NextResponse.json({ success: true, message: 'Ticket issued successfully.' });
    } 
    
    if (action === 'REJECT') {
      // Transfer failed or was fake. Cancel order, put ticket back on market.
      await prisma.$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        }),
        prisma.listing.update({
          where: { id: order.listingId },
          data: { isAvailable: true },
        })
      ]);
      return NextResponse.json({ success: true, message: 'Fraudulent transfer rejected. Ticket released.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Approval Error:', error);
    return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
  }
}