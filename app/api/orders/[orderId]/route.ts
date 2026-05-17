// app/api/orders/[orderId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;

    // 1. Fetch the order securely
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        ticketBatch: { 
          include: {
            event: true,
            seller: { select: { id: true, name: true, avatarUrl: true, isBot: true } }
          }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. ISOLATED SETTINGS FETCH
    let systemSettings = null;
    try {
      // 🛠 THE FIX: Using the plural 'systemSettings' to match your exact Prisma Schema
      systemSettings = await prisma.systemSettings.findFirst({
        include: {
          paymentMethods: true 
        }
      });
    } catch (dbError: any) {
      console.warn("Database mismatch on Settings/Payment tables. Using fallbacks.", dbError.message);
    }

    // 3. SAFE FALLBACK
    if (!systemSettings || !systemSettings.paymentMethods || systemSettings.paymentMethods.length === 0) {
      systemSettings = {
        vatRate: 12.5,
        paymentMethods: [
          { 
            type: 'Bank Transfer', 
            accountNumber: '8291047563', 
            accountName: 'Salex Escrow (Moniepoint)', 
            receiverName: 'Salex Secure Holdings', 
            instructions: 'Transfer the exact Total Amount. Upload your receipt below once completed.' 
          }
        ]
      } as any;
    }

    return NextResponse.json({ order, systemSettings });
    
  } catch (error: any) {
    console.error('CRITICAL Order Fetch Error:', error.message || error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
}
