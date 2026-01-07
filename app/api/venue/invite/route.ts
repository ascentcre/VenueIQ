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

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
      include: { venue: true },
    });

    if (!venueMember || venueMember.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
        },
      });
    }

    // Check if already a member
    const existingMember = await prisma.venueMember.findFirst({
      where: {
        venueId: venueMember.venueId,
        userId: user.id,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      );
    }

    // Add user to venue
    const newMember = await prisma.venueMember.create({
      data: {
        venueId: venueMember.venueId,
        userId: user.id,
        role: 'member',
        canViewAnalytics: false,
      },
    });

    // TODO: Send invitation email
    // For now, just return success

    return NextResponse.json({ 
      message: 'User invited successfully',
      member: newMember 
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

