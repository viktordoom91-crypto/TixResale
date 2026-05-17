// app/api/webhooks/card2crypto/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Extract the parameters sent by the Card2Crypto bot
  const orderId = searchParams.get('orderId');
  const valueCoin = searchParams.get('value_coin'); // USDC amount paid
  const txidOut = searchParams.get('txid_out');     // Blockchain receipt

  if (!orderId || !valueCoin) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    // 1. Mark the order as PAID automatically!
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'PAID',
        paymentMethod: 'Card2Crypto',
        transactionHash: txidOut // Save the blockchain receipt
      }
    });

    // 2. Return a 200 OK so the bot knows we received it
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
  }
}