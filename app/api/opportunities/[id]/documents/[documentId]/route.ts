import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> | { id: string; documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14 vs 15+)
    const resolvedParams = await Promise.resolve(params);
    
    if (!resolvedParams?.id || !resolvedParams?.documentId) {
      return NextResponse.json({ error: 'Opportunity ID and Document ID are required' }, { status: 400 });
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

    const document = await prisma.opportunityDocument.findUnique({
      where: { id: resolvedParams.documentId },
    });

    if (!document || document.opportunityId !== resolvedParams.id) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await prisma.opportunityDocument.delete({
      where: { id: resolvedParams.documentId },
    });

    return NextResponse.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Error deleting document:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}

