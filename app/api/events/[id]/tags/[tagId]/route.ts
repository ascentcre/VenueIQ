import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; tagId: string } }
) {
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

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event || event.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await prisma.eventTag.delete({
      where: { id: params.tagId },
    });

    return NextResponse.json({ message: 'Tag deleted' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

