// app/api/support/chat/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';

export async function GET(request: Request) {
  // 1. Securely identify the user using the JWT token
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Fetch their specific conversation history
  const conversation = await prisma.conversation.findFirst({
    where: { userId: token.id as string },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });

  return NextResponse.json(conversation ? conversation.messages : []);
}

export async function POST(request: Request) {
  // 1. Securely identify the user
  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await request.json();
  const userId = token.id as string;

  if (!content) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });

  // 2. Find their existing conversation, or create a brand new one
  let conversation = await prisma.conversation.findFirst({ where: { userId } });
  
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: { userId } });
  }

  // 3. Save the message to the database
  const message = await prisma.message.create({
    data: {
      content,
      senderId: userId,
      conversationId: conversation.id
    }
  });

  // 4. Bump the updatedAt time so it jumps to the top of the Admin's inbox
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() }
  });

  return NextResponse.json({ success: true, message });
}