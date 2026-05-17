// app/api/checkout/card2crypto/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // 1. Fetch Env Variables
    const myPolygonWallet = process.env.MASTER_POLYGON_WALLET; 
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // 🛠 THE FIX: Safety check for missing .env variables
    if (!myPolygonWallet || !baseUrl) {
      console.error("CRITICAL: MASTER_POLYGON_WALLET or NEXT_PUBLIC_BASE_URL is missing in .env");
      return NextResponse.json({ error: 'Payment gateway configuration missing.' }, { status: 500 });
    }
    
    const callbackUrl = `${baseUrl}/api/webhooks/card2crypto?orderId=${order.id}`;

    // STEP 1: Generate Encrypted Temporary Wallet
    const walletReqUrl = `https://api.card2crypto.org/control/wallet.php?address=${myPolygonWallet}&callback=${encodeURIComponent(callbackUrl)}`;
    
    const walletRes = await fetch(walletReqUrl);
    
    // 🛠 THE FIX: Catch HTML error pages from Card2Crypto before trying to parse JSON
    const contentType = walletRes.headers.get("content-type");
    if (!walletRes.ok || !contentType || !contentType.includes("application/json")) {
       const errorText = await walletRes.text();
       console.error("Card2Crypto API returned invalid response:", errorText.substring(0, 200));
       return NextResponse.json({ error: 'Gateway rejected the request. Verify your Polygon address.' }, { status: 500 });
    }

    const walletData = await walletRes.json();

    if (!walletData.address_in) {
      return NextResponse.json({ error: 'Failed to generate crypto gateway routing' }, { status: 500 });
    }

    // STEP 2: Generate the Smart Redirect URL
    const checkoutUrl = `https://pay.card2crypto.org/pay.php?` + new URLSearchParams({
      address: walletData.address_in,
      amount: order.totalAmount.toString(),
      email: order.user.email,
      currency: 'USD',
      domain: 'pay.card2crypto.org'
    }).toString();

    return NextResponse.json({ url: checkoutUrl });

  } catch (error) {
    console.error('Card2Crypto Init Error:', error);
    return NextResponse.json({ error: 'Gateway initialization failed' }, { status: 500 });
  }
}