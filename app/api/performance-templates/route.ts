import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: List all templates for the venue
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
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const templates = await prisma.performanceTemplate.findMany({
      where: { venueId: venueMember.venueId },
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
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new template
export async function POST(req: Request) {
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

    const body = await req.json();
    const { 
      name, 
      description, 
      ticketLevels = [], 
      customExpenses = [], 
      customRevenueStreams = [], 
      customMarketingInvestments = [], 
      defaultValues, 
      isDefault 
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.performanceTemplate.updateMany({
        where: { venueId: venueMember.venueId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Process and filter arrays
    const processedTicketLevels = Array.isArray(ticketLevels)
      ? ticketLevels
          .filter((tl: any) => {
            if (!tl || !tl.tierName || !String(tl.tierName).trim()) return false;
            const price = Number(tl.price);
            return !isNaN(price) && isFinite(price);
          })
          .map((tl: any, index: number) => {
            const price = Number(tl.price);
            if (isNaN(price) || !isFinite(price)) {
              throw new Error(`Invalid price for ticket level: ${tl.tierName}`);
            }
            return {
              tierName: String(tl.tierName).trim(),
              price: price,
              quantityAvailable: tl.quantityAvailable != null ? Number(tl.quantityAvailable) : null,
              marketingChannel: tl.marketingChannel ? String(tl.marketingChannel).trim() : null,
              sortOrder: index,
            };
          })
      : [];

    const processedCustomExpenses = Array.isArray(customExpenses)
      ? customExpenses
          .filter((ce: any) => ce && ce.expenseName && ce.expenseName.trim())
          .map((ce: any, index: number) => ({
            expenseName: String(ce.expenseName).trim(),
            expenseAmount: ce.expenseAmount ? Number(ce.expenseAmount) : null,
            category: ce.category ? String(ce.category).trim() : null,
            sortOrder: index,
          }))
      : [];

    const processedCustomRevenueStreams = Array.isArray(customRevenueStreams)
      ? customRevenueStreams
          .filter((rs: any) => rs && rs.streamName && rs.streamName.trim())
          .map((rs: any, index: number) => ({
            streamName: String(rs.streamName).trim(),
            amount: rs.amount ? Number(rs.amount) : null,
            category: rs.category ? String(rs.category).trim() : null,
            sortOrder: index,
          }))
      : [];

    const processedCustomMarketingInvestments = Array.isArray(customMarketingInvestments)
      ? customMarketingInvestments
          .filter((mi: any) => mi && mi.investmentName && mi.investmentName.trim())
          .map((mi: any, index: number) => ({
            investmentName: String(mi.investmentName).trim(),
            amount: mi.amount ? Number(mi.amount) : null,
            category: mi.category ? String(mi.category).trim() : null,
            estimatedReach: mi.estimatedReach ? Number(mi.estimatedReach) : null,
            newCustomersAcquired: mi.newCustomersAcquired ? Number(mi.newCustomersAcquired) : null,
            sortOrder: index,
          }))
      : [];

    // Build the data object conditionally
    const templateData: any = {
      venueId: venueMember.venueId,
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      isDefault: Boolean(isDefault),
      defaultValues: defaultValues || null,
    };

    // Only include nested creates if there are items (double-check they're arrays)
    if (Array.isArray(processedTicketLevels) && processedTicketLevels.length > 0) {
      templateData.ticketLevels = { create: processedTicketLevels };
    }
    if (Array.isArray(processedCustomExpenses) && processedCustomExpenses.length > 0) {
      templateData.customExpenses = { create: processedCustomExpenses };
    }
    if (Array.isArray(processedCustomRevenueStreams) && processedCustomRevenueStreams.length > 0) {
      templateData.customRevenueStreams = { create: processedCustomRevenueStreams };
    }
    if (Array.isArray(processedCustomMarketingInvestments) && processedCustomMarketingInvestments.length > 0) {
      templateData.customMarketingInvestments = { create: processedCustomMarketingInvestments };
    }

    // Log the data structure for debugging (remove sensitive data)
    console.log('Creating template with data:', {
      venueId: templateData.venueId,
      name: templateData.name,
      hasTicketLevels: !!templateData.ticketLevels,
      hasCustomExpenses: !!templateData.customExpenses,
      hasCustomRevenueStreams: !!templateData.customRevenueStreams,
      hasCustomMarketingInvestments: !!templateData.customMarketingInvestments,
      ticketLevelsCount: processedTicketLevels.length,
      customExpensesCount: processedCustomExpenses.length,
      customRevenueStreamsCount: processedCustomRevenueStreams.length,
      customMarketingInvestmentsCount: processedCustomMarketingInvestments.length,
    });

    // Validate that venueId exists
    if (!venueMember?.venueId) {
      throw new Error('Venue ID is missing');
    }

    // Validate templateData structure before sending to Prisma
    console.log('Template data structure:', JSON.stringify(templateData, null, 2));
    
    // Create template with nested ticket levels and expenses
    let template;
    try {
      // Use a more explicit approach - ensure all required fields are present
      const createData: any = {
        venueId: templateData.venueId,
        name: templateData.name,
        description: templateData.description,
        isDefault: templateData.isDefault,
        defaultValues: templateData.defaultValues,
      };
      
      // Add nested creates only if they exist and have items
      if (templateData.ticketLevels?.create?.length > 0) {
        createData.ticketLevels = templateData.ticketLevels;
      }
      if (templateData.customExpenses?.create?.length > 0) {
        createData.customExpenses = templateData.customExpenses;
      }
      if (templateData.customRevenueStreams?.create?.length > 0) {
        createData.customRevenueStreams = templateData.customRevenueStreams;
      }
      if (templateData.customMarketingInvestments?.create?.length > 0) {
        createData.customMarketingInvestments = templateData.customMarketingInvestments;
      }
      
      console.log('Final create data:', JSON.stringify(createData, null, 2));
      
      template = await prisma.performanceTemplate.create({
        data: createData,
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
    } catch (prismaError: any) {
      console.error('=== PRISMA CREATE ERROR ===');
      console.error('Prisma error:', prismaError);
      console.error('Prisma error code:', prismaError?.code);
      console.error('Prisma error meta:', JSON.stringify(prismaError?.meta, null, 2));
      console.error('Prisma error message:', prismaError?.message);
      console.error('==========================');
      throw prismaError;
    }

    return NextResponse.json(template);
  } catch (error: any) {
    // Log full error details
    console.error('=== ERROR CREATING TEMPLATE ===');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error name:', error?.name);
    console.error('Error code:', error?.code);
    console.error('Error stack:', error?.stack);
    if (error?.meta) {
      console.error('Error meta:', JSON.stringify(error.meta, null, 2));
    }
    console.error('Full error object:', error);
    console.error('===============================');
    
    // Extract a safe error message
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = String(error.message);
    }
    
    // Build safe error response
    const errorResponse: any = { error: errorMessage };
    if (process.env.NODE_ENV === 'development') {
      if (error?.stack) {
        errorResponse.stack = String(error.stack);
      }
      if (error?.code) {
        errorResponse.code = String(error.code);
      }
      if (error?.meta) {
        try {
          errorResponse.meta = JSON.parse(JSON.stringify(error.meta));
        } catch (e) {
          // If meta can't be serialized, skip it
        }
      }
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
