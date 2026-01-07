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
      include: { venue: true },
    });

    if (!venueMember) {
      return NextResponse.json({ name: '' });
    }

    return NextResponse.json({
      id: venueMember.venue.id,
      name: venueMember.venue.name,
      city: venueMember.venue.city,
      state: venueMember.venue.state,
      zipcode: venueMember.venue.zipcode,
      capacity: venueMember.venue.capacity,
    });
  } catch (error) {
    console.error('Error fetching venue:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

