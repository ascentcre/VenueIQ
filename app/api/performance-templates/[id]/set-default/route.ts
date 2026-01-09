import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: Set a template as default
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const templateId = resolvedParams.id;

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    // Verify template belongs to venue
    const existingTemplate = await prisma.performanceTemplate.findFirst({
      where: {
        id: templateId,
        venueId: venueMember.venueId,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Unset all other defaults
    await prisma.performanceTemplate.updateMany({
      where: { 
        venueId: venueMember.venueId, 
        isDefault: true,
        id: { not: templateId },
      },
      data: { isDefault: false },
    });

    // Set this template as default
    const template = await prisma.performanceTemplate.update({
      where: { id: templateId },
      data: { isDefault: true },
      include: {
        ticketLevels: {
          orderBy: { sortOrder: 'asc' },
        },
        customExpenses: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error setting default template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
