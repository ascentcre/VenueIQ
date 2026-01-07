import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both sync and async params (Next.js 15+ compatibility)
    const resolvedParams = await Promise.resolve(params);
    const eventId = resolvedParams.id;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { content } = await req.json();

    const comment = await prisma.eventComment.create({
      data: {
        eventId: eventId,
        content,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

