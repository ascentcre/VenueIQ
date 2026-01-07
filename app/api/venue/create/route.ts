import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { venueName, city, state, zipcode, capacity } = await req.json();

    if (!venueName || !city || !state || !zipcode || !capacity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already has a venue
    const existingMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User already has a venue' },
        { status: 400 }
      );
    }

    // Create venue and make user admin
    const venue = await prisma.venue.create({
      data: {
        name: venueName,
        city,
        state,
        zipcode,
        capacity: parseInt(capacity),
        members: {
          create: {
            userId: session.user.id,
            role: 'admin',
            canViewAnalytics: true, // Admin has analytics access by default
          },
        },
      },
    });

    return NextResponse.json({ 
      message: 'Venue created successfully',
      venueId: venue.id 
    });
  } catch (error) {
    console.error('Error creating venue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

