// app/api/admin/events/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // Awaiting the Next.js 15+ promise
    const { isFeatured } = await request.json();

    const event = await prisma.event.update({
      where: { id },
      data: { isFeatured },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Event Update Error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}