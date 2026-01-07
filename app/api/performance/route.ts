import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateAllFields } from '@/lib/calculations';

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
    console.log('Received standalone performance data:', JSON.stringify(body, null, 2));
    
    // Extract ticket levels and custom expenses from body
    const { ticketLevels, customExpenses, eventDate, eventTime, eventName, selectedEventId, ...performanceData } = body;
    
    // Determine which calendar event to use
    let eventId: string;
    
    // If a specific event was selected, use it
    if (selectedEventId) {
      // Verify the event exists and belongs to this venue
      const existingEvent = await prisma.event.findUnique({
        where: { id: selectedEventId },
      });
      
      if (!existingEvent || existingEvent.venueId !== venueMember.venueId) {
        return NextResponse.json({ 
          error: 'Selected event not found or does not belong to your venue' 
        }, { status: 404 });
      }
      
      // Check if this event already has performance data
      const existingPerformance = await prisma.eventPerformance.findUnique({
        where: { eventId: selectedEventId },
      });
      
      if (existingPerformance) {
        return NextResponse.json({ 
          error: 'This event already has performance data. Please edit the existing performance record instead.' 
        }, { status: 400 });
      }
      
      eventId = selectedEventId;
    } else if (eventDate && eventName) {
      // No event selected, check for existing calendar event before creating new one
      // Parse the event date and time
      const eventDateTime = eventDate ? (typeof eventDate === 'string' ? new Date(eventDate) : eventDate) : new Date();
      
      // If eventTime is provided, combine with eventDate
      let startDate = eventDateTime;
      let endDate = new Date(eventDateTime);
      
      if (eventTime) {
        const [hours, minutes] = eventTime.split(':').map(Number);
        startDate.setHours(hours || 0, minutes || 0, 0, 0);
        endDate.setHours((hours || 0) + 3, minutes || 0, 0, 0); // Default 3 hour event
      }
      
      // Check for existing calendar event on the same date with similar name
      // Look for events on the same day (within 24 hours) with matching name
      const dayStart = new Date(startDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(startDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const existingEvent = await prisma.event.findFirst({
        where: {
          venueId: venueMember.venueId,
          startDate: {
            gte: dayStart,
            lte: dayEnd,
          },
          OR: [
            { title: { contains: eventName, mode: 'insensitive' } },
            { artistName: { contains: eventName, mode: 'insensitive' } },
          ],
          // Don't include events that already have performance data
          performance: null,
        },
      });
      
      if (existingEvent) {
        // Use existing calendar event
        eventId = existingEvent.id;
        console.log(`Found existing calendar event: ${existingEvent.id} for ${eventName}`);
      } else {
        // Create new calendar event
        const calendarEvent = await prisma.event.create({
          data: {
            venueId: venueMember.venueId,
            title: eventName,
            artistName: eventName,
            startDate: startDate,
            endDate: endDate,
            description: `Performance tracking for ${eventName}`,
          },
        });
        
        eventId = calendarEvent.id;
        console.log(`Created new calendar event: ${calendarEvent.id} for ${eventName}`);
      }
    } else {
      return NextResponse.json({ 
        error: 'Either select an existing calendar event or provide event date and event name to create a performance event' 
      }, { status: 400 });
    }
    
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
      eventId: eventId,
      // Event basics - handle both ISO string and Date object
      eventDate: eventDate ? (typeof eventDate === 'string' ? new Date(eventDate) : eventDate) : null,
      eventTime: performanceData.eventTime || eventTime || null,
      eventName: performanceData.eventName || eventName || null,
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
    
    // Create performance
    const performance = await prisma.eventPerformance.create({
      data: finalPerformanceData,
    });
    
    // Handle ticket levels
    if (ticketLevels && Array.isArray(ticketLevels)) {
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

