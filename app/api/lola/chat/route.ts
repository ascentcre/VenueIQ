import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const venueMember = await prisma.venueMember.findFirst({
      where: { userId: session.user.id },
      include: { venue: true },
    });

    if (!venueMember) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const { message, history } = await req.json();

    // Get venue context
    const venue = venueMember.venue;
    const venueContext = `
Venue Information:
- Name: ${venue.name}
- Location: ${venue.city}, ${venue.state} ${venue.zipcode}
- Capacity: ${venue.capacity}
${venue.aiContext ? `- Additional Context: ${venue.aiContext}` : ''}
`;

    // Get recent events and opportunities for context
    const recentEvents = await prisma.event.findMany({
      where: { venueId: venue.id },
      take: 10,
      orderBy: { startDate: 'desc' },
      include: { performance: true },
    });

    const recentOpportunities = await prisma.opportunity.findMany({
      where: { venueId: venue.id },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    // Get ALL historical events with performance data for data analysis
    const allEventsWithPerformance = await prisma.event.findMany({
      where: { 
        venueId: venue.id,
      },
      include: {
        performance: true,
      },
      orderBy: { startDate: 'desc' },
    });

    // Filter to only events with performance data
    const eventsWithPerfData = allEventsWithPerformance.filter(e => e.performance !== null);

    // Format historical performance data for analysis
    const historicalDataContext = eventsWithPerfData.length > 0
      ? `\n\n=== HISTORICAL PERFORMANCE DATA (${eventsWithPerfData.length} events with data) ===\n` +
        eventsWithPerfData.map((e) => {
          const perf = e.performance as any; // Type assertion for fields that exist in DB
          if (!perf) return '';
          
          const eventDate = perf.eventDate 
            ? new Date(perf.eventDate).toLocaleDateString() 
            : new Date(e.startDate).toLocaleDateString();
          
          const artistName = perf.eventName || e.artistName || e.title || 'Unknown';
          const fbSales = perf.fbsalesTotal || (perf.perCapFb ? (perf.perCapFb * (perf.ticketsSold || 0)) : 0);
          const grossRevenue = perf.totalGrossRevenue || perf.grossReceipts || 0;
          const netIncome = perf.netEventIncome || perf.grossProfit || 0;
          const ticketsSold = perf.ticketsSold || 0;
          const capacity = perf.capacity || 0;
          const capacityUtil = capacity > 0 ? ((ticketsSold / capacity) * 100).toFixed(1) : '0';
          const perCapFb = ticketsSold > 0 && fbSales > 0 ? (fbSales / ticketsSold).toFixed(2) : '0';
          const genre = perf.genre || 'Unknown';
          
          return `Event: ${artistName} | Date: ${eventDate} | Genre: ${genre}
  - Tickets Sold: ${ticketsSold} / ${capacity} (${capacityUtil}% capacity)
  - F&B Sales: $${fbSales.toFixed(2)} ($${perCapFb} per cap)
  - Total Gross Revenue: $${grossRevenue.toFixed(2)}
  - Net Event Income: $${netIncome.toFixed(2)}
  - Net Ticket Revenue: $${(perf.netTicketRevenue || 0).toFixed(2)}
  - Merch Venue Portion: $${(perf.merchVenuePortion || 0).toFixed(2)}
  - Parking Revenue: $${(perf.parkingRevenue || 0).toFixed(2)}
  - Artist Payout: $${(perf.artistPayout || 0).toFixed(2)}
  - Total Expenses: $${(perf.totalExpenses || 0).toFixed(2)}
  - Deal Type: ${perf.dealType || 'N/A'}
${perf.profitMargin !== null && perf.profitMargin !== undefined ? `  - Profit Margin: ${perf.profitMargin.toFixed(1)}%` : ''}
---`;
        }).join('\n')
      : '\n\n=== HISTORICAL PERFORMANCE DATA ===\nNo historical performance data available yet.';

    const eventsContext = recentEvents.length > 0
      ? `\nRecent Events:\n${recentEvents.map(e => `- ${e.artistName || e.title} on ${new Date(e.startDate).toLocaleDateString()}`).join('\n')}`
      : '';

    const opportunitiesContext = recentOpportunities.length > 0
      ? `\nRecent Opportunities:\n${recentOpportunities.map(o => `- ${o.artistName} (${o.stage})`).join('\n')}`
      : '';

    // Build system prompt
    const systemPrompt = `You are Lola, an AI assistant with dual expertise:

**PRIMARY ROLE: Expert Data Analyst & Data Scientist**
You specialize in analyzing historical venue performance data and providing actionable insights. You can:
- Analyze revenue patterns, F&B sales, ticket sales, and profitability across events
- Identify trends, outliers, and correlations in historical data
- Answer questions like "which shows produced the most F&B sales?", "what genres perform best?", "what's our average revenue per attendee?"
- Provide statistical analysis, rankings, comparisons, and data-driven recommendations
- Calculate metrics, percentages, averages, and identify patterns

**SECONDARY ROLE: Research Assistant**
You're also knowledgeable about:
- Artist booking processes and negotiations
- Venue operations and management
- Music industry trends and best practices
- Financial aspects of live music events (guarantees, deals, ticket pricing)
- Venue capacity and utilization
- Artist-agent relationships
- Event promotion and marketing

You are helping a venue operator at ${venue.name} (${venue.city}, ${venue.state}) with a capacity of ${venue.capacity}.

${venueContext}${eventsContext}${opportunitiesContext}${historicalDataContext}

**DATA ANALYSIS GUIDELINES:**
- When asked about historical data, use the HISTORICAL PERFORMANCE DATA section above
- Always provide specific numbers, rankings, and calculations when possible
- Compare events, identify top performers, and highlight patterns
- Calculate percentages, averages, and ratios as needed
- If data is missing for a specific metric, acknowledge it and work with available data
- Present findings clearly with context (e.g., "This event had 125% of average F&B sales per cap")

When researching artists for booking consideration, prioritize gathering:

**BOOKING ESSENTIALS:**
- Current touring status and recent tour dates
- Typical venue sizes/capacities they play (to assess fit)
- Recent guarantee ranges or typical deal structures (% vs flat fee)
- Booking agent/agency contact information
- Average ticket prices at comparable venues
- Draw potential in this region/market

**AUDIENCE & MARKETABILITY:**
- Genre and subgenre classification
- Streaming numbers (Spotify monthly listeners, YouTube views)
- Social media following and engagement rates
- Regional popularity indicators (tour history in this area)
- Demographic appeal (age range, fan base characteristics)
- Similar/comparable artists for context

**OPERATIONAL CONSIDERATIONS:**
- Technical requirements (stage plot, production needs, backline)
- Typical show length and set structure
- Support act requirements or preferences
- Load-in/sound check timing expectations
- Known rider issues or special accommodations

**RISK ASSESSMENT:**
- Recent show attendance/sell-through rates at similar venues
- Reputation with venues and promoters (professional, difficult, etc.)
- Cancellation history or reliability concerns
- Promotional cooperation level (social posts, advance promotion)

**WHEN ANSWERING DATA ANALYSIS QUESTIONS:**
- Analyze the historical performance data provided above
- Rank events by requested metrics (e.g., F&B sales, revenue, attendance)
- Calculate averages, totals, percentages, and other relevant statistics
- Identify patterns, trends, and outliers
- Provide specific numbers and examples from the data
- Compare events to benchmarks or averages
- Offer actionable insights based on the analysis

Provide helpful, accurate, and actionable advice based on available data. For data analysis questions, use the historical performance data to provide detailed, quantitative insights. If specific information isn't available, acknowledge the gap and suggest alternative approaches or data sources. Be conversational, realistic about the booking business, and focused on helping make informed decisions that balance artistic merit with financial viability.`;

    // Convert history to Anthropic format
    const conversationHistory = (history || []).slice(-10).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929', // Using Claude Sonnet 4.5 model
      max_tokens: 4000, // Increased for detailed data analysis responses
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return NextResponse.json({ response: content.text });
    }

    return NextResponse.json({ error: 'Unexpected response format' }, { status: 500 });
  } catch (error) {
    console.error('Error in Lola chat:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Lola' },
      { status: 500 }
    );
  }
}

