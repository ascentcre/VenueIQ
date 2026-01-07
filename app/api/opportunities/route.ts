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

    const opportunities = await prisma.opportunity.findMany({
      where: { venueId: venueMember.venueId },
      include: {
        labels: true,
        notes: true,
        comments: true,
        documents: true,
        event: {
          include: {
            performance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
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

    const { artistName, artistInfo, stage, description } = await req.json();

    if (!artistName) {
      return NextResponse.json(
        { error: 'Artist name is required' },
        { status: 400 }
      );
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        venueId: venueMember.venueId,
        artistName,
        ...(artistInfo !== undefined ? { artistInfo } : {}),
        stage: stage || 'New Prospect',
        description,
      },
      include: {
        labels: true,
        notes: true,
        comments: true,
        documents: true,
        event: {
          include: {
            performance: true,
          },
        },
      },
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

