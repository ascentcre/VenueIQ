import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const events = await prisma.event.findMany({
      where: { venueId: venueMember.venueId },
      include: {
        notes: true,
        comments: true,
        tags: true,
        documents: true,
      },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const { title, description, startDate, endDate, artistName, supportActs } = await req.json();

    const event = await prisma.event.create({
      data: {
        venueId: venueMember.venueId,
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

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

