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

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const genre = searchParams.get('genre');
    const search = searchParams.get('search');
    const profitFilter = searchParams.get('profitFilter'); // 'all' | 'profitable' | 'break-even' | 'loss'

    // Build where clause
    const where: any = {
      venueId: venueMember.venueId,
      performance: {
        isNot: null,
      },
    };

    // Date range filter
    if (startDate || endDate) {
      where.performance = {
        ...where.performance,
        eventDate: {},
      };
      if (startDate) {
        where.performance.eventDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.performance.eventDate.lte = new Date(endDate);
      }
    }

    // Genre filter
    if (genre) {
      where.performance = {
        ...where.performance,
        genre: genre,
      };
    }

    // Search filter (event name or artist name)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { artistName: { contains: search, mode: 'insensitive' } },
        { performance: { eventName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Fetch events with performance
    let events = await prisma.event.findMany({
      where,
      include: {
        performance: {
          include: {
            artist: true,
            agent: true,
            ticketLevels: true,
            customExpenses: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    // Apply profit filter
    if (profitFilter && profitFilter !== 'all') {
      events = events.filter((event) => {
        const netIncome = event.performance?.netEventIncome || 0;
        switch (profitFilter) {
          case 'profitable':
            return netIncome > 0;
          case 'break-even':
            return netIncome === 0;
          case 'loss':
            return netIncome < 0;
          default:
            return true;
        }
      });
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events with performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

