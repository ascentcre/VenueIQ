import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
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

    const { title, description, startDate, endDate, artistName, supportActs } = await req.json();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        title,
        description: description ?? null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        artistName: artistName || title || null,
        supportActs: supportActs ?? null,
      },
      include: {
        notes: true,
        comments: true,
        tags: true,
        documents: true,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

