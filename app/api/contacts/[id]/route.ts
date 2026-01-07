import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
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

    const { type, name, email, phone, notes } = await req.json();

    const updatedContact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        type,
        name,
        email,
        phone,
        notes,
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
    });

    if (!contact || contact.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    await prisma.contact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

