// app/api/admin/support/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  // 1. Verify Admin Status
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Fetch all conversations for the inbox
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        user: { select: { name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Only pull the latest message for the sidebar preview
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Admin GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // 1. Verify Admin Status
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId, content } = await request.json();

  if (!conversationId || !content) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    // 🚀 THE FIX: Bulletproof Ghost Admin Creation using Upsert.
    // This will NEVER crash on a duplicate email constraint!
    let dbAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    
    if (!dbAdmin) {
      dbAdmin = await prisma.user.upsert({
        where: { email: 'system_escrow_bot@tixresale.com' },
        update: { role: 'ADMIN' },
        create: {
          name: 'Admin Support Team',
          email: 'system_escrow_bot@tixresale.com',
          password: 'locked_system_account',
          role: 'ADMIN'
        }
      });
    }

    // 2. Save the message using the Ghost Admin's valid database ID
    const message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: dbAdmin.id 
      },
      include: { sender: true }
    });

    // 3. Update the conversation's updatedAt timestamp to bring it to the top
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error("Admin POST Error:", error.message);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}