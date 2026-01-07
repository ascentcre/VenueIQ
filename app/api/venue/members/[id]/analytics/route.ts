import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
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

    const memberToUpdate = await prisma.venueMember.findUnique({
      where: { id: params.id },
    });

    if (!memberToUpdate || memberToUpdate.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const { canViewAnalytics } = await req.json();

    const updatedMember = await prisma.venueMember.update({
      where: { id: params.id },
      data: { canViewAnalytics },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating analytics access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

