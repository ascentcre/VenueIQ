import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Support Next.js 14 and 15+ where params may be a Promise
    const resolvedParams = await Promise.resolve(params);
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!opportunity || opportunity.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const body = await req.json();
    const { stage, description, eventId, ...otherFields } = body;

    const updatedOpportunity = await prisma.opportunity.update({
      where: { id: resolvedParams.id },
      data: {
        ...(stage && { stage }),
        ...(description !== undefined && { description }),
        ...(eventId && { eventId }),
        ...otherFields,
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

    return NextResponse.json(updatedOpportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
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

    // Support Next.js 14 and 15+ where params may be a Promise
    const resolvedParams = await Promise.resolve(params);
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: 'Opportunity ID is required' }, { status: 400 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!opportunity || opportunity.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    await prisma.opportunity.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ message: 'Opportunity deleted' });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

