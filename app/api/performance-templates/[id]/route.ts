import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Get a specific template
export async function GET(
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

    const template = await prisma.performanceTemplate.findFirst({
      where: {
        id: templateId,
        venueId: venueMember.venueId,
      },
      include: {
        ticketLevels: {
          orderBy: { sortOrder: 'asc' },
        },
        customExpenses: {
          orderBy: { sortOrder: 'asc' },
        },
        customRevenueStreams: {
          orderBy: { sortOrder: 'asc' },
        },
        customMarketingInvestments: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a template
export async function PUT(
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

    const body = await req.json();
    const { name, description, ticketLevels, customExpenses, customRevenueStreams, customMarketingInvestments, defaultValues, isDefault } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.performanceTemplate.updateMany({
        where: { 
          venueId: venueMember.venueId, 
          isDefault: true,
          id: { not: templateId },
        },
        data: { isDefault: false },
      });
    }

    // Delete existing ticket levels, expenses, and revenue streams, then recreate
    await prisma.templateTicketLevel.deleteMany({
      where: { templateId },
    });
    await prisma.templateCustomExpense.deleteMany({
      where: { templateId },
    });
    await prisma.templateCustomRevenueStream.deleteMany({
      where: { templateId },
    });
    await prisma.templateCustomMarketingInvestment.deleteMany({
      where: { templateId },
    });

    // Update template
    const template = await prisma.performanceTemplate.update({
      where: { id: templateId },
      data: {
        name: name || existingTemplate.name,
        description: description !== undefined ? description : existingTemplate.description,
        isDefault: isDefault !== undefined ? isDefault : existingTemplate.isDefault,
        defaultValues: defaultValues !== undefined ? defaultValues : existingTemplate.defaultValues,
        ticketLevels: {
          create: (ticketLevels || []).map((tl: any, index: number) => ({
            tierName: tl.tierName,
            price: tl.price,
            quantityAvailable: tl.quantityAvailable || null,
            marketingChannel: tl.marketingChannel || null,
            sortOrder: index,
          })),
        },
        customExpenses: {
          create: (customExpenses || []).map((ce: any, index: number) => ({
            expenseName: ce.expenseName,
            expenseAmount: ce.expenseAmount || null,
            category: ce.category || null,
            sortOrder: index,
          })),
        },
        customRevenueStreams: {
          create: (customRevenueStreams || []).map((rs: any, index: number) => ({
            streamName: rs.streamName,
            amount: rs.amount || null,
            category: rs.category || null,
            sortOrder: index,
          })),
        },
        customMarketingInvestments: {
          create: (customMarketingInvestments || []).map((mi: any, index: number) => ({
            investmentName: mi.investmentName,
            amount: mi.amount || null,
            category: mi.category || null,
            estimatedReach: mi.estimatedReach || null,
            newCustomersAcquired: mi.newCustomersAcquired || null,
            sortOrder: index,
          })),
        },
      },
      include: {
        ticketLevels: {
          orderBy: { sortOrder: 'asc' },
        },
        customExpenses: {
          orderBy: { sortOrder: 'asc' },
        },
        customRevenueStreams: {
          orderBy: { sortOrder: 'asc' },
        },
        customMarketingInvestments: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a template
export async function DELETE(
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

    // Delete template (cascade will delete ticket levels and expenses)
    await prisma.performanceTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
