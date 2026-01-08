# VenueIQ (ViQ)

**VenueIQ** is a comprehensive web application designed specifically for independent live music venues. It streamlines booking management, opportunity tracking, performance analytics, and venue operations—all in one powerful platform.

## About VenueIQ

VenueIQ helps venue operators manage their entire booking pipeline from initial artist discovery to post-show performance analysis. The platform combines traditional CRM functionality with AI-powered insights, making it easier for venues to discover artists, track opportunities, manage events, and make data-driven decisions.

### Key Capabilities

- **AI-Powered Artist Discovery**: Search and research artists using Anthropic's Claude AI to get instant insights about touring patterns, pricing, and market fit
- **Pipeline Management**: Visual Kanban board to track booking opportunities through 8 distinct stages
- **Event Calendar**: Comprehensive calendar system for scheduling and managing shows with notes, comments, tags, and document management
- **Performance Analytics**: Track post-show metrics and generate insights to improve future bookings
- **Contact Management**: Organize artists and agents with tagging and relationship mapping
- **AI Assistant (Lola)**: Get venue-specific advice and insights powered by industry knowledge and your venue's historical data
- **Team Collaboration**: Multi-user support with role-based access control and analytics permissions

## Features

### 🔐 Authentication & User Management
- Secure email/password authentication with NextAuth.js
- Session management
- Multi-user support per venue
- Role-based access (Admin/Member)
- Admin-controlled analytics access permissions
- User invitation system

### 🏢 Venue Onboarding
- Streamlined setup process for new venues
- Captures essential venue information:
  - Venue name, location (city, state, zipcode)
  - Capacity
- Automatic admin role assignment for venue creator

### 📅 Calendar & Event Management
- Full-featured calendar view (day, week, month, list views)
- Event creation and editing
- Event details:
  - Title, artist name, dates, description
  - Support acts
  - Custom tags for organization
  - Notes and comments
  - Document attachments
- Link events to opportunities in the pipeline

### 🎤 AI-Powered Artist Search
- Intelligent artist research using Anthropic Claude AI
- Automatically extracts key information:
  - Homebase location
  - Recent and upcoming shows
  - Average ticket prices
  - Genre and description
  - Touring patterns
- One-click "Add Prospect" to create opportunities in the pipeline

### 📊 Pipeline (Kanban Board)
- Visual drag-and-drop opportunity management
- 8 pipeline stages:
  1. New Prospect
  2. Discovery
  3. Qualification
  4. Booking Stage
  5. Finalization
  6. Completed Shows
  7. Closed Lost
  8. Postpone
- Opportunity cards include:
  - Artist information
  - Custom labels/tags
  - Notes and comments
  - Performance metrics (post-show data)
  - Centralized documentation
  - Linked events

### 📈 Analytics Dashboard
- Admin-controlled access permissions
- Key performance metrics:
  - Gross profit over time
  - Average gross margin percentage
  - Total events count
  - Capacity utilization
  - Per-act analysis
- Interactive charts and visualizations
- Time-based filtering (month, quarter, year)
- Data-driven insights for booking decisions

### 📊 Performance Tracking
- Post-show performance data entry
- Track key metrics:
  - Attendance
  - Revenue
  - Costs
  - Profit margins
- Historical event analysis
- Edit past event performance data
- Feed data into analytics dashboard

### 📇 Contacts Management
- Two contact types: Artists and Agents
- Comprehensive contact details:
  - Name, email, phone
  - Notes and tags
  - Relationship mapping
- Tag system for organization
- Quick access from pipeline and events

### 🤖 AI Assistant (Lola)
- Chatbot interface for venue-specific questions
- Trained on:
  - Venue-specific data and context
  - Industry knowledge base
  - Historical performance data
- Context-aware responses
- Conversation history
- Get insights and recommendations

### ⚙️ Settings & Configuration
- Venue profile management
- User management (admin only)
- Analytics access control
- Team member invitations

## Tech Stack

- **Framework**: Next.js 16 (React 18)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: Anthropic Claude API
- **UI**: Tailwind CSS, Lucide React icons
- **Calendar**: FullCalendar
- **Charts**: Recharts
- **Drag & Drop**: @hello-pangea/dnd
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Anthropic API Key (for Lola AI assistant)

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Fill in your environment variables
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your app URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js (generate with `openssl rand -base64 32`)
- `ANTHROPIC_API_KEY` - Anthropic API key for Lola AI assistant

3. **Set up the database:**
```bash
npx prisma generate
npx prisma db push
```

4. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### First-Time Setup

1. Sign up for a new account
2. Complete the venue onboarding form
3. Start adding events, searching for artists, and building your pipeline!

## Database Schema

The application uses Prisma with PostgreSQL. Key models:

- **User**: Authentication and user accounts
- **Venue**: Venue information and settings
- **VenueMember**: User-venue relationships with roles and permissions
- **Event**: Calendar events and show information
- **EventPerformance**: Post-show metrics and analytics data
- **Opportunity**: Booking pipeline items
- **Contact**: Artists and agents
- **AIConversation**: Lola chat history

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Set up PostgreSQL database (Vercel Postgres or external)
5. Deploy!

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## Project Structure

```
ViQ/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── analytics/         # Analytics dashboard
│   ├── calendar/          # Calendar view
│   ├── contacts/          # Contacts management
│   ├── lola/              # AI assistant
│   ├── pipeline/          # Pipeline/Kanban board
│   ├── performance/       # Performance tracking
│   └── settings/          # Settings page
├── components/            # React components
│   ├── analytics/         # Analytics components
│   ├── calendar/          # Calendar components
│   ├── contacts/          # Contact components
│   ├── lola/              # AI assistant UI
│   ├── pipeline/          # Pipeline components
│   └── performance/       # Performance components
├── lib/                   # Utility functions
├── prisma/                # Database schema
└── types/                 # TypeScript types
```

## Contributing

This is a private project. For issues or questions, please refer to the codebase or contact the development team.

## License

Private - All rights reserved

