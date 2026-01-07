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
    });

    if (!venueMember) {
      return NextResponse.json({ hasAccess: false });
    }

    return NextResponse.json({ hasAccess: venueMember.canViewAnalytics });
  } catch (error) {
    console.error('Error checking analytics access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

