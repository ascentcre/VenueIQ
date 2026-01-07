import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
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
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Only admins can update venue details
    if (venueMember.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { name, city, state, zipcode, capacity } = await req.json();

    if (!name || !city || !state || !zipcode || capacity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updatedVenue = await prisma.venue.update({
      where: { id: venueMember.venueId },
      data: {
        name,
        city,
        state,
        zipcode,
        capacity: parseInt(capacity),
      },
    });

    return NextResponse.json({
      id: updatedVenue.id,
      name: updatedVenue.name,
      city: updatedVenue.city,
      state: updatedVenue.state,
      zipcode: updatedVenue.zipcode,
      capacity: updatedVenue.capacity,
    });
  } catch (error) {
    console.error('Error updating venue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

