// app/api/admin/settings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findFirst({
      include: { paymentMethods: true }
    });
    
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          bankName: 'Legacy', accountName: 'Legacy', accountNumber: '0', instructions: 'Legacy',
          allowManualPayments: true,
          vatRate: 12.4, 
          paymentMethods: {
            create: [
              {
                type: 'Bank Transfer',
                accountName: 'Salex Holding Account',
                accountNumber: '1029384756',
                receiverName: 'Salex Admin',
                instructions: 'Transfer exactly the total amount. Upload your receipt on the next step.',
                timerMinutes: 15
              }
            ]
          }
        },
        include: { paymentMethods: true }
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentSettings = await prisma.systemSettings.findFirst();

    if (!currentSettings) {
      return NextResponse.json({ error: 'Settings not initialized' }, { status: 400 });
    }

    // 1. SAFELY update ONLY the allowed base settings (Ignoring hidden fields like id/updatedAt)
    await prisma.systemSettings.update({
      where: { id: currentSettings.id },
      data: {
        allowManualPayments: Boolean(body.allowManualPayments),
        vatRate: parseFloat(body.vatRate) || 0,
      },
    });

    // 2. Sync Payment Methods: Wipe old ones and insert the updated list
    await prisma.paymentMethod.deleteMany({
      where: { settingsId: currentSettings.id }
    });

    if (body.paymentMethods && Array.isArray(body.paymentMethods) && body.paymentMethods.length > 0) {
      await prisma.paymentMethod.createMany({
        data: body.paymentMethods.map((pm: any) => ({
          type: pm.type || 'Bank Transfer',
          accountName: pm.accountName || '',
          accountNumber: pm.accountNumber || '',
          receiverName: pm.receiverName || '',
          instructions: pm.instructions || '',
          timerMinutes: parseInt(pm.timerMinutes) || 15,
          isActive: pm.isActive !== undefined ? pm.isActive : true,
          settingsId: currentSettings.id
        }))
      });
    }

    // Return fresh data to the frontend
    const finalSettings = await prisma.systemSettings.findFirst({
      include: { paymentMethods: true }
    });

    return NextResponse.json({ success: true, settings: finalSettings });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}