// app/api/checkout/confirm/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { orderId, receiptUrl } = await request.json();

    if (!orderId || !receiptUrl) {
      return NextResponse.json({ error: 'Missing order ID or receipt.' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'VERIFYING', // Moves it out of Pending!
        receiptUrl: receiptUrl, // Saves the Cloudinary image
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Confirmation Error:', error);
    return NextResponse.json({ error: 'Failed to confirm order.' }, { status: 500 });
  }
}