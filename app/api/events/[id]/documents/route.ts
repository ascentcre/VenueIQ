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

    // Handle both Promise and direct params (Next.js 14 vs 15+)
    const resolvedParams = await Promise.resolve(params);
    
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!event || event.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { name, url, type } = await req.json();

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    const document = await prisma.eventDocument.create({
      data: {
        eventId: resolvedParams.id,
        name,
        url,
        type: type || null,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

