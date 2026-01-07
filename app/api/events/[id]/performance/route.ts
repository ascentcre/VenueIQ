import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateAllFields } from '@/lib/calculations';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both sync and async params (Next.js 15+ compatibility)
    const resolvedParams = await Promise.resolve(params);
    const eventId = resolvedParams.id;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const performance = await prisma.eventPerformance.findUnique({
      where: { eventId: eventId },
      include: {
        ticketLevels: true,
        customExpenses: true,
        artist: true,
        agent: true,
      },
    });

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Error fetching performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both sync and async params (Next.js 15+ compatibility)
    const resolvedParams = await Promise.resolve(params);
    const eventId = resolvedParams.id;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const body = await req.json();
    console.log('Received performance data:', JSON.stringify(body, null, 2));
    
    // Extract ticket levels and custom expenses from body
    const { ticketLevels, customExpenses, eventDate, ...performanceData } = body;
    
    // Calculate gross ticket sales from ticket levels if provided
    if (ticketLevels && Array.isArray(ticketLevels) && ticketLevels.length > 0) {
      const grossTicketSales = ticketLevels.reduce(
        (sum: number, level: any) => sum + ((level.price || 0) * (level.quantitySold || 0)),
        0
      );
      performanceData.grossTicketSales = grossTicketSales;
    }
    
    // Prepare data for calculations
    const calculationData = {
      ...performanceData,
      customExpenses: customExpenses || [],
      venueCapacity: performanceData.capacity || performanceData.venueCapacity,
    };
    
    // Calculate all derived fields
    const calculatedFields = calculateAllFields(calculationData);
    
    // Map form fields to database schema fields
    const finalPerformanceData: any = {
      // Event basics - handle both ISO string and Date object
      eventDate: eventDate ? (typeof eventDate === 'string' ? new Date(eventDate) : eventDate) : null,
      eventTime: performanceData.eventTime || null,
      eventName: performanceData.eventName || null,
      artistId: performanceData.artistId || null,
      agentId: performanceData.agentId || null,
      genre: performanceData.genre || null,
      
      // Capacity & Attendance
      capacity: performanceData.capacity || performanceData.venueCapacity || 0,
      ticketsSold: performanceData.ticketsSold || 0,
      compTickets: performanceData.compTickets || null,
      
      // Advance Sales
      advanceSales30Plus: performanceData.advanceSales30Plus || null,
      advanceSales7to30: performanceData.advanceSales7to30 || null,
      advanceSalesWeekOf: performanceData.advanceSalesWeekOf || null,
      advanceSalesDayOf: performanceData.advanceSalesDayOf || null,
      doorSales: performanceData.doorSales || null,
      
      // Deal Structure
      dealType: performanceData.dealType || null,
      artistGuarantee: performanceData.artistGuarantee || null,
      percentageSplit: performanceData.percentageSplit || null,
      doorPriceSplitPoint: performanceData.hybridDoorSplitPoint || null,
      merchCommission: performanceData.merchSplitValue || null,
      merchCommissionType: performanceData.merchSplitType?.toLowerCase() || null,
      productionCosts: performanceData.productionCosts || null,
      
      // Revenue
      grossTicketSales: performanceData.grossTicketSales || null,
      facilityFeesKept: performanceData.facilityFeesKept || null,
      ticketingFeesPaidToPlatform: performanceData.ticketingFeesPaidToPlatform || null,
      taxes: performanceData.taxes || null,
      fbsalesTotal: performanceData.fbSales || null,
      merchSalesTotal: performanceData.totalMerchSales || null,
      parkingRevenue: performanceData.parkingRevenue || null,
      otherRevenue: performanceData.otherRevenue || null,
      
      // Expenses
      bartenderHours: performanceData.bartenderHours || null,
      bartenderRate: performanceData.bartenderRate || null,
      securityHours: performanceData.securityHours || null,
      securityRate: performanceData.securityRate || null,
      soundLightingTech: performanceData.soundLightingTech || null,
      doorBoxOfficeHours: performanceData.doorBoxOfficeHours || null,
      doorBoxOfficeRate: performanceData.doorBoxOfficeRate || null,
      fbcogsDollar: performanceData.fbCostOfGoods || null,
      creditCardFees: performanceData.creditCardFees || null,
      ticketPlatformFeesTotal: performanceData.ticketPlatformFees || null,
      
      // Marketing
      marketingSpend: performanceData.marketingSpend || null,
      socialMediaAds: performanceData.socialMediaAds || null,
      emailMarketing: performanceData.emailMarketing || null,
      printRadioOther: performanceData.printRadioOther || null,
      estimatedReach: performanceData.estimatedReach || null,
      newCustomersAcquired: performanceData.newCustomersAcquired || null,
      
      // Post-Event Notes
      whatWorkedWell: performanceData.whatWorkedWell || null,
      whatDidntWork: performanceData.whatDidntWork || null,
      bookAgain: performanceData.bookAgain?.toLowerCase() || null,
      bookAgainNotes: performanceData.bookAgainNotes || null,
      promoterRating: performanceData.agentRating || null,
      audienceBehaviorNotes: performanceData.audienceNotes || null,
      
      // Calculated fields
      netTicketRevenue: calculatedFields.netTicketRevenue,
      merchVenuePortion: calculatedFields.venueMerchPortion,
      merchArtistPortion: calculatedFields.artistMerchPortion,
      totalGrossRevenue: calculatedFields.totalGrossRevenue,
      totalExpenses: calculatedFields.totalExpenses,
      artistPayout: calculatedFields.artistPayout,
      grossProfit: calculatedFields.grossProfit,
      netEventIncome: calculatedFields.netEventIncome,
      profitMargin: calculatedFields.profitMargin,
      capacityUtilization: calculatedFields.capacityUtilization,
      revenuePerAvailableCapacity: calculatedFields.revenuePerAvailableCapacity,
      revenuePerAttendee: calculatedFields.revenuePerAttendee,
      costPerAttendee: calculatedFields.costPerAttendee,
      fbRevenuePerCap: calculatedFields.fbPerCap,
      merchRevenuePerCap: calculatedFields.merchPerCap,
      totalPerCap: calculatedFields.totalPerCap,
      // Legacy fields
      perCapFb: calculatedFields.fbPerCap,
      perCapMerch: calculatedFields.merchPerCap,
      grossPerCap: calculatedFields.totalPerCap,
    };
    
    // Remove undefined values to avoid Prisma errors
    Object.keys(finalPerformanceData).forEach(key => {
      if (finalPerformanceData[key] === undefined) {
        delete finalPerformanceData[key];
      }
    });
    
    console.log('Final performance data to save:', JSON.stringify(finalPerformanceData, null, 2));
    
    // Create or update performance
    const performance = await prisma.eventPerformance.upsert({
      where: { eventId: eventId },
      update: finalPerformanceData,
      create: {
        eventId: eventId,
        ...finalPerformanceData,
      },
    });
    
    // Handle ticket levels
    if (ticketLevels && Array.isArray(ticketLevels)) {
      // Delete existing ticket levels
      await prisma.ticketLevel.deleteMany({
        where: { eventPerformanceId: performance.id },
      });
      
      // Create new ticket levels
      if (ticketLevels.length > 0) {
        await prisma.ticketLevel.createMany({
          data: ticketLevels.map((level: any) => ({
            eventPerformanceId: performance.id,
            tierName: level.tierName || level.tier || 'GA',
            price: level.price || 0,
            quantityAvailable: level.quantityAvailable || 0,
            quantitySold: level.quantitySold || 0,
            marketingChannel: level.marketingChannel || null,
          })),
        });
      }
    }
    
    // Handle custom expenses
    if (customExpenses && Array.isArray(customExpenses)) {
      // Delete existing custom expenses
      await prisma.customExpense.deleteMany({
        where: { eventPerformanceId: performance.id },
      });
      
      // Create new custom expenses
      if (customExpenses.length > 0) {
        await prisma.customExpense.createMany({
          data: customExpenses.map((exp: any) => ({
            eventPerformanceId: performance.id,
            expenseName: exp.expenseName || exp.name || 'Custom Expense',
            expenseAmount: exp.expenseAmount || exp.amount || 0,
            category: exp.category || null,
          })),
        });
      }
    }
    
    // Fetch the complete performance with relations
    const completePerformance = await prisma.eventPerformance.findUnique({
      where: { id: performance.id },
      include: {
        ticketLevels: true,
        customExpenses: true,
        artist: true,
        agent: true,
      },
    });

    return NextResponse.json(completePerformance);
  } catch (error: any) {
    console.error('Error saving performance:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // Check if it's a Prisma schema error (field doesn't exist)
    const isSchemaError = error?.code === 'P2009' || 
                         error?.message?.includes('Unknown argument') ||
                         error?.message?.includes('does not exist');
    
    const errorMessage = isSchemaError 
      ? 'Database schema needs to be updated. Please run: npx prisma db push'
      : error?.message || 'Internal server error';
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
      } : undefined
    }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both sync and async params (Next.js 15+ compatibility)
    const resolvedParams = await Promise.resolve(params);
    const eventId = resolvedParams.id;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.venueId !== venueMember.venueId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete performance (cascade will handle ticket levels and custom expenses)
    await prisma.eventPerformance.delete({
      where: { eventId: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
