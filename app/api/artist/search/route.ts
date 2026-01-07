import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if API key is configured
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    // Log API key status (without exposing the key)
    console.log('API Key configured:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'No');

    // Get model name from environment or use default
    const modelName = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
    console.log('Using model:', modelName);

    // Initialize Anthropic client with validated API key
    let anthropic;
    try {
      anthropic = new Anthropic({
        apiKey: apiKey,
      });
    } catch (initError) {
      console.error('Failed to initialize Anthropic client:', initError);
      return NextResponse.json(
        { error: 'Failed to initialize AI service client.' },
        { status: 500 }
      );
    }

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Use Anthropic API to extract artist information
    const prompt = `You are a live music industry expert assistant specializing in artist research for venue booking decisions. A venue operator is searching for information about an artist. Extract and provide comprehensive information about the artist based on the search query: "${query}"

When researching this artist, prioritize gathering information across these key areas:

**BOOKING ESSENTIALS:**
- Current touring status and recent tour dates
- Typical venue sizes/capacities they play (to assess fit)
- Recent guarantee ranges or typical deal structures (% vs flat fee)
- Booking agent/agency contact information
- Average ticket prices at comparable venues
- Draw potential indicators

**AUDIENCE & MARKETABILITY:**
- Genre and subgenre classification
- Streaming numbers (Spotify monthly listeners, YouTube views)
- Social media following and engagement rates
- Regional popularity indicators (tour history)
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

Please provide a JSON object with the following structure:
{
  "name": "Artist name",
  "homebase": "City, State or location",
  "genre": "Music genre(s) and subgenre(s)",
  "description": "Brief description of the artist",
  "bookingEssentials": {
    "touringStatus": "Current touring status (active, on tour, inactive, etc.)",
    "recentTourDates": ["Recent tour dates if available"],
    "typicalVenueSizes": "Typical venue capacities they play (e.g., 200-500, 1000-2000)",
    "guaranteeRange": "Typical guarantee range or deal structure if known",
    "bookingAgent": "Booking agent/agency name and contact if available",
    "bookingAgency": "Booking agency name if available",
    "averageTicketPrice": number (in USD),
    "drawPotential": "Assessment of draw potential based on available data"
  },
  "audienceMarketability": {
    "spotifyListeners": number (monthly listeners if available),
    "youtubeViews": "Total or recent video views if available",
    "socialMedia": {
      "website": "URL if available",
      "instagram": "handle if available",
      "facebook": "URL if available",
      "twitter": "handle if available",
      "tiktok": "handle if available"
    },
    "socialFollowing": {
      "instagram": number (followers if available),
      "facebook": number (followers if available),
      "twitter": number (followers if available),
      "tiktok": number (followers if available)
    },
    "regionalPopularity": "Tour history and regional popularity indicators",
    "demographics": "Age range and fan base characteristics if known",
    "comparableArtists": ["List of similar/comparable artists"]
  },
  "operationalConsiderations": {
    "technicalRequirements": "Stage plot, production needs, backline requirements if known",
    "showLength": "Typical show length and set structure",
    "supportActRequirements": "Support act requirements or preferences",
    "loadInTiming": "Load-in/sound check timing expectations if known",
    "riderNotes": "Known rider issues or special accommodations"
  },
  "riskAssessment": {
    "attendanceRates": "Recent show attendance/sell-through rates at similar venues if known",
    "reputation": "Reputation with venues and promoters (professional, difficult, etc.)",
    "cancellationHistory": "Cancellation history or reliability concerns if known",
    "promotionalCooperation": "Promotional cooperation level (social posts, advance promotion)"
  },
  "recentShows": [
    {"date": "MM/DD/YYYY", "location": "Venue name, City, State", "venueCapacity": number if known}
  ],
  "upcomingShows": [
    {"date": "MM/DD/YYYY", "location": "Venue name, City, State", "venueCapacity": number if known}
  ],
  "additionalInfo": "Any other relevant information that doesn't fit in the above categories"
}

If you cannot find specific information, use null for that field. Be as accurate as possible based on publicly available information. Focus on actionable data that helps venue operators make informed booking decisions.`;

    const message = await anthropic.messages.create({
      model: modelName,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Check if content array is empty
    if (!message.content || message.content.length === 0) {
      return NextResponse.json(
        { error: 'No response from AI service' },
        { status: 500 }
      );
    }

    const content = message.content[0];
    let artistInfo;

    if (content.type === 'text') {
      // Extract JSON from the response, handling markdown code blocks
      const text = content.text.trim();
      
      // First, try to extract JSON from markdown code blocks (```json ... ``` or ``` ... ```)
      let jsonString = null;
      
      // Try markdown code block with json language tag
      const markdownJsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownJsonMatch && markdownJsonMatch[1]) {
        jsonString = markdownJsonMatch[1].trim();
      } else {
        // If no markdown, try to find JSON object directly
        // Use a more precise regex that finds the outermost JSON object
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch && jsonMatch[0]) {
          jsonString = jsonMatch[0].trim();
        }
      }
      
      if (jsonString) {
        try {
          artistInfo = JSON.parse(jsonString);
          
          // Validate that we got a proper object
          if (typeof artistInfo !== 'object' || artistInfo === null) {
            throw new Error('Parsed JSON is not an object');
          }
          
          // Clean up all string fields to remove any accidental JSON or markdown
          const cleanStringField = (value: any): string | null => {
            if (typeof value !== 'string') return value;
            if (!value.includes('```') && !value.includes('{')) return value;
            
            const cleaned = value
              .replace(/```json[\s\S]*?```/g, '')
              .replace(/```[\s\S]*?```/g, '')
              .replace(/\{[\s\S]*\}/g, '')
              .trim();
            
            return cleaned.length > 0 ? cleaned : null;
          };
          
          // Clean description field
          if (artistInfo.description) {
            const cleaned = cleanStringField(artistInfo.description);
            artistInfo.description = cleaned || `Information about ${artistInfo.name || query}`;
          }
          
          // Clean nested string fields recursively
          const cleanObject = (obj: any): any => {
            if (typeof obj === 'string') {
              return cleanStringField(obj);
            }
            if (Array.isArray(obj)) {
              return obj.map(cleanObject).filter(item => item !== null);
            }
            if (obj && typeof obj === 'object') {
              const cleaned: any = {};
              for (const [key, value] of Object.entries(obj)) {
                const cleanedValue = cleanObject(value);
                if (cleanedValue !== null && cleanedValue !== undefined) {
                  cleaned[key] = cleanedValue;
                }
              }
              return cleaned;
            }
            return obj;
          };
          
          // Clean all nested objects
          if (artistInfo.bookingEssentials) {
            artistInfo.bookingEssentials = cleanObject(artistInfo.bookingEssentials);
          }
          if (artistInfo.audienceMarketability) {
            artistInfo.audienceMarketability = cleanObject(artistInfo.audienceMarketability);
          }
          if (artistInfo.operationalConsiderations) {
            artistInfo.operationalConsiderations = cleanObject(artistInfo.operationalConsiderations);
          }
          if (artistInfo.riskAssessment) {
            artistInfo.riskAssessment = cleanObject(artistInfo.riskAssessment);
          }
          
        } catch (e) {
          console.error('JSON parsing error:', e);
          console.error('Attempted to parse:', jsonString?.substring(0, 200));
          // If JSON parsing fails, try to extract information manually
          artistInfo = {
            name: query,
            description: text.replace(/```json[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').replace(/\{[\s\S]*\}/g, '').trim() || `Information about ${query}`,
          };
        }
      } else {
        artistInfo = {
          name: query,
          description: text.replace(/```json[\s\S]*?```/g, '').replace(/```[\s\S]*?```/g, '').replace(/\{[\s\S]*\}/g, '').trim() || `Information about ${query}`,
        };
      }
    } else {
      return NextResponse.json(
        { error: 'Unexpected response format from AI service' },
        { status: 500 }
      );
    }

    return NextResponse.json(artistInfo);
  } catch (error) {
    console.error('Error searching for artist:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to search for artist. Please try again.';
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Check for specific error types
      if (error.message.includes('API key')) {
        errorMessage = 'API key is invalid or missing. Please check your configuration.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}

