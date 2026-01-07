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

    const eventsContext = recentEvents.length > 0
      ? `\nRecent Events:\n${recentEvents.map(e => `- ${e.artistName || e.title} on ${new Date(e.startDate).toLocaleDateString()}`).join('\n')}`
      : '';

    const opportunitiesContext = recentOpportunities.length > 0
      ? `\nRecent Opportunities:\n${recentOpportunities.map(o => `- ${o.artistName} (${o.stage})`).join('\n')}`
      : '';

    // Build system prompt
    const systemPrompt = `You are Lola, an AI research assistant specializing in live music venue operations, booking, and the music industry. You are knowledgeable about:

- Artist booking processes and negotiations
- Venue operations and management
- Music industry trends and best practices
- Financial aspects of live music events (guarantees, deals, ticket pricing)
- Venue capacity and utilization
- Artist-agent relationships
- Event promotion and marketing

You are helping a venue operator at ${venue.name} (${venue.city}, ${venue.state}) with a capacity of ${venue.capacity}.

${venueContext}${eventsContext}${opportunitiesContext}

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

Provide helpful, accurate, and actionable advice based on available data. If specific information isn't available, acknowledge the gap and suggest alternative approaches or data sources. Be conversational, realistic about the booking business, and focused on helping make informed booking decisions that balance artistic merit with financial viability.`;

    // Convert history to Anthropic format
    const conversationHistory = (history || []).slice(-10).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929', // Using Claude Sonnet 4.5 model
      max_tokens: 2000,
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

