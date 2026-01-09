import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!venueMember || !venueMember.canViewAnalytics) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get('timeframe') || 'month';
    const customStart = searchParams.get('customStart');
    const customEnd = searchParams.get('customEnd');

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    if (customStart && customEnd) {
      startDate = new Date(customStart);
      endDate = new Date(customEnd);
    } else {
      switch (timeframe) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(0); // Beginning of time
          break;
      }
    }

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = new Date(startDate.getTime());

    // Fetch events with performance data for current period
    // First get all events for the venue, then filter by performance date
    const allEvents = await prisma.event.findMany({
      where: {
        venueId: venueMember.venueId,
      },
      include: {
        performance: {
          include: {
            artist: true,
            ticketLevels: true,
            customExpenses: true,
            customRevenueStreams: true,
          },
        },
      },
    });

    // Filter events by performance date or fallback to event startDate
    const events = allEvents.filter((e) => {
      if (!e.performance) return false;
      try {
        const perfDate = e.performance.eventDate 
          ? new Date(e.performance.eventDate) 
          : new Date(e.startDate);
        return perfDate >= startDate && perfDate <= endDate;
      } catch (error) {
        console.error('Error parsing date for event:', e.id, error);
        return false;
      }
    });

    // Fetch events for previous period
    const previousEvents = allEvents.filter((e) => {
      if (!e.performance) return false;
      try {
        const perfDate = e.performance.eventDate 
          ? new Date(e.performance.eventDate) 
          : new Date(e.startDate);
        return perfDate >= previousStartDate && perfDate <= previousEndDate;
      } catch (error) {
        console.error('Error parsing date for previous event:', e.id, error);
        return false;
      }
    });

    const eventsWithPerformance = events.filter((e) => e.performance);
    const previousEventsWithPerformance = previousEvents.filter((e) => e.performance);

    // Calculate current period metrics (with safe fallbacks for fields that might not exist yet)
    const totalNetEventIncome = eventsWithPerformance.reduce(
      (sum, e) => {
        const perf = e.performance;
        return sum + (perf?.netEventIncome ?? perf?.grossProfit ?? 0);
      },
      0
    );
    const totalGrossRevenue = eventsWithPerformance.reduce(
      (sum, e) => {
        const perf = e.performance;
        return sum + (perf?.totalGrossRevenue ?? perf?.grossReceipts ?? 0);
      },
      0
    );
    const totalExpenses = eventsWithPerformance.reduce(
      (sum, e) => {
        const perf = e.performance;
        return sum + (perf?.totalExpenses ?? 0);
      },
      0
    );
    const totalArtistPayout = eventsWithPerformance.reduce(
      (sum, e) => sum + (e.performance?.artistPayout || 0),
      0
    );
    const totalNetTicketRevenue = eventsWithPerformance.reduce(
      (sum, e) => sum + (e.performance?.netTicketRevenue || 0),
      0
    );
    const totalFbSales = eventsWithPerformance.reduce(
      (sum, e) => {
        const perf = e.performance;
        if (!perf) return sum;
        return sum + (perf.fbsalesTotal || (perf.perCapFb ? (perf.perCapFb * (perf.ticketsSold || 0)) : 0));
      },
      0
    );
    const totalMerchVenuePortion = eventsWithPerformance.reduce(
      (sum, e) => sum + (e.performance?.merchVenuePortion || 0),
      0
    );
    const totalParkingRevenue = eventsWithPerformance.reduce(
      (sum, e) => sum + (e.performance?.parkingRevenue || 0),
      0
    );
    const totalOtherRevenue = eventsWithPerformance.reduce(
      (sum, e) => sum + (e.performance?.otherRevenue || 0),
      0
    );

    // Calculate previous period metrics for comparison
    const previousNetEventIncome = previousEventsWithPerformance.reduce(
      (sum, e) => {
        const perf = e.performance;
        return sum + (perf?.netEventIncome ?? perf?.grossProfit ?? 0);
      },
      0
    );
    const previousAvgNetMargin = previousEventsWithPerformance.length > 0
      ? previousEventsWithPerformance.reduce(
          (sum, e) => {
            const perf = e.performance;
            const revenue = perf?.totalGrossRevenue ?? perf?.grossReceipts ?? 0;
            const income = perf?.netEventIncome ?? perf?.grossProfit ?? 0;
            return sum + (revenue > 0 ? (income / revenue) * 100 : 0);
          },
          0
        ) / previousEventsWithPerformance.length
      : 0;

    // Average net margin
    const avgNetMargin = eventsWithPerformance.length > 0
      ? eventsWithPerformance.reduce(
          (sum, e) => {
            const perf = e.performance;
            const revenue = perf?.totalGrossRevenue ?? perf?.grossReceipts ?? 0;
            const income = perf?.netEventIncome ?? perf?.grossProfit ?? 0;
            return sum + (revenue > 0 ? (income / revenue) * 100 : 0);
          },
          0
        ) / eventsWithPerformance.length
      : 0;

    // Capacity metrics
    const totalCapacity = eventsWithPerformance.reduce(
      (sum, e) => sum + (e.performance?.capacity || 0),
      0
    );
    const totalTicketsSold = eventsWithPerformance.reduce(
      (sum, e) => sum + (e.performance?.ticketsSold || 0),
      0
    );
    const capacityUtilization = totalCapacity > 0 ? (totalTicketsSold / totalCapacity) * 100 : 0;

    // Group by date for time series
    const grossProfitOverTime = eventsWithPerformance
      .map((e) => {
        const perf = e.performance;
        const perfDate = perf?.eventDate ? new Date(perf.eventDate) : new Date(e.startDate);
        return {
          date: perfDate.toLocaleDateString(),
          profit: perf?.netEventIncome ?? perf?.grossProfit ?? 0,
          eventName: perf?.eventName || e.title || '',
          isProfitable: (perf?.netEventIncome ?? perf?.grossProfit ?? 0) > 0,
        };
      })
      .sort((a, b) => {
        try {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } catch {
          return 0;
        }
      });

    // Group events by time period for bar chart
    const eventsByPeriod = new Map<string, { count: number; totalProfit: number; avgProfit: number }>();
    eventsWithPerformance.forEach((e) => {
      try {
        const perf = e.performance;
        const date = perf?.eventDate ? new Date(perf.eventDate) : new Date(e.startDate);
        const periodKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (!eventsByPeriod.has(periodKey)) {
          eventsByPeriod.set(periodKey, { count: 0, totalProfit: 0, avgProfit: 0 });
        }
        
        const period = eventsByPeriod.get(periodKey)!;
        period.count++;
        period.totalProfit += perf?.netEventIncome ?? perf?.grossProfit ?? 0;
      } catch (error) {
        console.error('Error processing event for period grouping:', e.id, error);
      }
    });

    // Calculate average profit for each period
    eventsByPeriod.forEach((period) => {
      period.avgProfit = period.count > 0 ? period.totalProfit / period.count : 0;
    });

    const eventsOverTime = Array.from(eventsByPeriod.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      avgProfit: data.avgProfit,
    }));

    // Genre performance analysis
    const genreMap = new Map<string, any>();
    eventsWithPerformance.forEach((e) => {
      const genre = e.performance?.genre || 'Other';
      if (!genreMap.has(genre)) {
        genreMap.set(genre, {
          genre,
          showCount: 0,
          totalTicketsSold: 0,
          totalCapacity: 0,
          totalGrossRevenue: 0,
          totalNetProfit: 0,
        });
      }
      const genreData = genreMap.get(genre)!;
      genreData.showCount++;
      genreData.totalTicketsSold += e.performance?.ticketsSold || 0;
      genreData.totalCapacity += e.performance?.capacity || 0;
      const perf = e.performance;
      genreData.totalGrossRevenue += perf?.totalGrossRevenue ?? perf?.grossReceipts ?? 0;
      genreData.totalNetProfit += perf?.netEventIncome ?? perf?.grossProfit ?? 0;
    });

    const genrePerformance = Array.from(genreMap.values()).map((genreData) => ({
      genre: genreData.genre,
      showCount: genreData.showCount,
      avgAttendance: genreData.showCount > 0 ? genreData.totalTicketsSold / genreData.showCount : 0,
      avgCapacity: genreData.totalCapacity > 0 ? (genreData.totalTicketsSold / genreData.totalCapacity) * 100 : 0,
      avgGrossRevenue: genreData.showCount > 0 ? genreData.totalGrossRevenue / genreData.showCount : 0,
      avgNetProfit: genreData.showCount > 0 ? genreData.totalNetProfit / genreData.showCount : 0,
      avgMargin: genreData.totalGrossRevenue > 0 ? (genreData.totalNetProfit / genreData.totalGrossRevenue) * 100 : 0,
      totalNetProfit: genreData.totalNetProfit,
    }));

    // Artist performance (top 10 by net profit)
    const artistMap = new Map<string, any>();
    eventsWithPerformance.forEach((e) => {
      const artistName = e.performance?.artist?.name || e.performance?.eventName || e.artistName || 'Unknown';
      if (!artistMap.has(artistName)) {
        artistMap.set(artistName, {
          artistName,
          showCount: 0,
          totalTicketsSold: 0,
          totalCapacity: 0,
          totalNetProfit: 0,
          profits: [] as number[],
        });
      }
      const artistData = artistMap.get(artistName)!;
      artistData.showCount++;
      artistData.totalTicketsSold += e.performance?.ticketsSold || 0;
      artistData.totalCapacity += e.performance?.capacity || 0;
      const perf = e.performance;
      const profit = perf?.netEventIncome ?? perf?.grossProfit ?? 0;
      artistData.totalNetProfit += profit;
      artistData.profits.push(profit);
    });

    const artistPerformance = Array.from(artistMap.values())
      .map((artistData) => ({
        artistName: artistData.artistName,
        showCount: artistData.showCount,
        avgAttendance: artistData.showCount > 0 ? artistData.totalTicketsSold / artistData.showCount : 0,
        avgCapacity: artistData.totalCapacity > 0 ? (artistData.totalTicketsSold / artistData.totalCapacity) * 100 : 0,
        avgNetProfit: artistData.showCount > 0 ? artistData.totalNetProfit / artistData.showCount : 0,
        totalNetProfit: artistData.totalNetProfit,
        trend: artistData.profits.length > 1
          ? (artistData.profits[artistData.profits.length - 1] > artistData.profits[0] ? '↑' : 
             artistData.profits[artistData.profits.length - 1] < artistData.profits[0] ? '↓' : '→')
          : '→',
      }))
      .sort((a, b) => b.totalNetProfit - a.totalNetProfit)
      .slice(0, 10);

    // Aggregate custom revenue streams dynamically by name/category
    const customRevenueMap = new Map<string, number>();
    eventsWithPerformance.forEach((e) => {
      if (e.performance?.customRevenueStreams) {
        e.performance.customRevenueStreams.forEach((rs: any) => {
          // Use category if available, otherwise use streamName
          const key = rs.category || rs.streamName || 'Unnamed Revenue Stream';
          customRevenueMap.set(key, (customRevenueMap.get(key) || 0) + (rs.amount || 0));
        });
      }
    });

    // Calculate total from custom revenue streams (excluding those already counted in standard fields)
    const totalCustomRevenueStreams = Array.from(customRevenueMap.values()).reduce((sum, val) => sum + val, 0);

    // Revenue breakdown - start with standard categories
    const revenueBreakdown: Array<{ name: string; value: number; percentage: number }> = [
      { name: 'Tickets', value: totalNetTicketRevenue, percentage: totalGrossRevenue > 0 ? (totalNetTicketRevenue / totalGrossRevenue) * 100 : 0 },
      { name: 'F&B', value: totalFbSales, percentage: totalGrossRevenue > 0 ? (totalFbSales / totalGrossRevenue) * 100 : 0 },
      { name: 'Merch', value: totalMerchVenuePortion, percentage: totalGrossRevenue > 0 ? (totalMerchVenuePortion / totalGrossRevenue) * 100 : 0 },
      { name: 'Parking', value: totalParkingRevenue, percentage: totalGrossRevenue > 0 ? (totalParkingRevenue / totalGrossRevenue) * 100 : 0 },
    ];

    // Add individual custom revenue streams (only include those not already in standard categories)
    // Filter out streams that might have been mapped to F&B, Merch, Parking in the performance route
    customRevenueMap.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Skip if this looks like it was already counted in standard categories
      const isStandardCategory = 
        lowerKey.includes('f&b') || lowerKey.includes('food') || lowerKey.includes('beverage') ||
        lowerKey.includes('merch') || lowerKey.includes('parking');
      
      // Only add if it's a significant amount and not a standard category
      if (!isStandardCategory && value > 0) {
        revenueBreakdown.push({
          name: key,
          value: value,
          percentage: totalGrossRevenue > 0 ? (value / totalGrossRevenue) * 100 : 0,
        });
      }
    });

    // Add "Other" category for any remaining revenue not captured above
    const accountedRevenue = revenueBreakdown.reduce((sum, item) => sum + item.value, 0);
    const remainingRevenue = totalGrossRevenue - accountedRevenue;
    if (remainingRevenue > 0) {
      revenueBreakdown.push({
        name: 'Other',
        value: remainingRevenue,
        percentage: totalGrossRevenue > 0 ? (remainingRevenue / totalGrossRevenue) * 100 : 0,
      });
    }

    // Sort by value descending for better visualization
    revenueBreakdown.sort((a, b) => b.value - a.value);

    // Expense breakdown
    const totalLaborCost = eventsWithPerformance.reduce(
      (sum, e) => {
        const laborCosts = e.performance?.laborCosts;
        if (Array.isArray(laborCosts)) {
          return sum + laborCosts.reduce((s: number, l: any) => s + (l.total || 0), 0);
        }
        // Fallback to individual fields
        const bartenderCost = (e.performance?.bartenderHours || 0) * (e.performance?.bartenderRate || 0);
        const securityCost = (e.performance?.securityHours || 0) * (e.performance?.securityRate || 0);
        const doorCost = (e.performance?.doorBoxOfficeHours || 0) * (e.performance?.doorBoxOfficeRate || 0);
        return sum + bartenderCost + securityCost + (e.performance?.soundLightingTech || 0) + doorCost;
      },
      0
    );
    const totalFbCogs = eventsWithPerformance.reduce((sum, e) => sum + (e.performance?.fbcogsDollar || 0), 0);
    const totalFees = eventsWithPerformance.reduce(
      (sum, e) => sum + (e.performance?.creditCardFees || 0) + (e.performance?.ticketingPlatformFees || 0),
      0
    );

    // Aggregate custom expenses dynamically by name/category
    const customExpenseMap = new Map<string, number>();
    eventsWithPerformance.forEach((e) => {
      if (e.performance?.customExpenses) {
        e.performance.customExpenses.forEach((exp: any) => {
          // Use category if available, otherwise use expenseName
          const key = exp.category || exp.expenseName || 'Unnamed Expense';
          customExpenseMap.set(key, (customExpenseMap.get(key) || 0) + (exp.expenseAmount || 0));
        });
      }
    });

    // Calculate total from custom expenses
    const totalCustomExpenses = Array.from(customExpenseMap.values()).reduce((sum, val) => sum + val, 0);

    // Expense breakdown - start with standard categories
    const expenseBreakdown: Array<{ name: string; value: number; percentage: number }> = [
      { name: 'Artist Payout', value: totalArtistPayout, percentage: (totalExpenses + totalArtistPayout) > 0 ? (totalArtistPayout / (totalExpenses + totalArtistPayout)) * 100 : 0 },
      { name: 'Labor', value: totalLaborCost, percentage: totalExpenses > 0 ? (totalLaborCost / totalExpenses) * 100 : 0 },
      { name: 'F&B COGS', value: totalFbCogs, percentage: totalExpenses > 0 ? (totalFbCogs / totalExpenses) * 100 : 0 },
      { name: 'Fees', value: totalFees, percentage: totalExpenses > 0 ? (totalFees / totalExpenses) * 100 : 0 },
    ];

    // Add individual custom expenses
    customExpenseMap.forEach((value, key) => {
      if (value > 0) {
        expenseBreakdown.push({
          name: key,
          value: value,
          percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
        });
      }
    });

    // Add "Other" category if there are any unaccounted expenses
    const accountedExpenses = expenseBreakdown
      .filter(item => item.name !== 'Artist Payout')
      .reduce((sum, item) => sum + item.value, 0);
    const remainingExpenses = totalExpenses - accountedExpenses;
    if (remainingExpenses > 0) {
      expenseBreakdown.push({
        name: 'Other',
        value: remainingExpenses,
        percentage: totalExpenses > 0 ? (remainingExpenses / totalExpenses) * 100 : 0,
      });
    }

    // Sort by value descending for better visualization (but keep Artist Payout first if present)
    const artistPayoutItem = expenseBreakdown.find(item => item.name === 'Artist Payout');
    const otherItems = expenseBreakdown.filter(item => item.name !== 'Artist Payout').sort((a, b) => b.value - a.value);
    const finalExpenseBreakdown = artistPayoutItem ? [artistPayoutItem, ...otherItems] : otherItems;

    // Marketing efficiency
    const totalMarketingSpend = eventsWithPerformance.reduce(
      (sum, e) => sum + (e.performance?.marketingSpend || 0),
      0
    );
    const totalNewCustomers = eventsWithPerformance.reduce(
      (sum, e) => sum + (e.performance?.newCustomersAcquired || 0),
      0
    );
    const avgCostPerAttendee = totalTicketsSold > 0 ? totalMarketingSpend / totalTicketsSold : 0;
    const avgReturnOnAdSpend = totalMarketingSpend > 0 ? totalGrossRevenue / totalMarketingSpend : 0;

    // Calculate comparison percentages
    const netIncomeChange = previousNetEventIncome !== 0
      ? ((totalNetEventIncome - previousNetEventIncome) / Math.abs(previousNetEventIncome)) * 100
      : 0;
    const marginChange = previousAvgNetMargin !== 0
      ? avgNetMargin - previousAvgNetMargin
      : 0;

    return NextResponse.json({
      // Financial metrics
      totalNetEventIncome,
      totalGrossRevenue,
      totalExpenses,
      totalArtistPayout,
      avgNetMargin,
      
      // Comparisons
      netIncomeChange,
      marginChange,
      previousNetEventIncome,
      
      // Capacity metrics
      totalEvents: events.length,
      eventsWithPerformance: eventsWithPerformance.length,
      totalCapacity,
      totalTicketsSold,
      capacityUtilization,
      
      // Time series
      grossProfitOverTime,
      eventsOverTime,
      
      // Genre performance
      genrePerformance,
      
      // Artist performance
      artistPerformance,
      
      // Breakdowns
      revenueBreakdown,
      expenseBreakdown: finalExpenseBreakdown,
      
      // Marketing
      avgCostPerAttendee,
      avgReturnOnAdSpend,
      totalMarketingSpend,
      totalNewCustomers,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
