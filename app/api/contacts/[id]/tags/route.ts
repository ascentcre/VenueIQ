import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
    });

    if (!contact || contact.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const { name } = await req.json();

    const tag = await prisma.contactTag.create({
      data: {
        contactId: params.id,
        name,
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

