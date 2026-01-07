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

    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    const note = await prisma.opportunityNote.create({
      data: {
        opportunityId: resolvedParams.id,
        content: content.trim(),
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

