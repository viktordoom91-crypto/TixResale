// app/api/pusher/message/route.ts
import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: Request) {
  try {
    const { message, senderId, channelName } = await request.json();

    // Broadcast the message to the specific chat channel
    await pusherServer.trigger(channelName, 'new-message', {
      text: message,
      senderId: senderId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pusher Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}