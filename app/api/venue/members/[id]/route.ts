import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember || venueMember.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const memberToDelete = await prisma.venueMember.findUnique({
      where: { id: params.id },
    });

    if (!memberToDelete || memberToDelete.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (memberToDelete.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin member' },
        { status: 400 }
      );
    }

    await prisma.venueMember.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

