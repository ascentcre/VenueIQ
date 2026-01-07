# ViQ Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database
3. **Anthropic API Key** for Lola AI assistant

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/viq?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Anthropic API
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features Implemented

### ✅ Authentication
- Email/password sign up and sign in
- Session management with NextAuth.js

### ✅ Venue Onboarding
- New users complete venue setup form
- Captures: Venue Name, City, State, Zipcode, Capacity
- User becomes admin automatically

### ✅ Calendar
- Full calendar view with event booking
- Event modals with:
  - Event details (title, artist, dates, description)
  - Notes
  - Comments
  - Custom tags
  - Documents (structure ready)

### ✅ Artist Search
- AI-powered artist search using Anthropic Claude
- Extracts key information:
  - Homebase
  - Recent and upcoming shows
  - Average ticket price
  - Genre and description
- "Add Prospect" button creates opportunity in Pipeline

### ✅ Pipeline (Kanban Board)
- 8 stages: New Prospect, Discovery, Qualification, Booking Stage, Finalization, Completed Shows, Closed Lost, Postpone
- Drag-and-drop functionality
- Opportunity cards with:
  - Artist information
  - Custom labels/tags
  - Notes and comments
  - Performance metrics (post-show data)
  - Centralized documentation

### ✅ Analytics Dashboard
- Access control (admin grants access)
- Key metrics:
  - Gross profit over time
  - Average gross margin percentage
  - Total events
  - Capacity utilization
  - Per-act analysis
- Charts and visualizations
- Time-based filtering (month, quarter, year)

### ✅ Contacts Management
- Two types: Artists and Agents
- Contact details: name, email, phone, notes
- Tag system for organization
- Relationship mapping (structure ready)

### ✅ User Management
- Admin can invite users by email
- Admin can manage user roles
- Analytics access control
- User deletion (non-admins only)

### ✅ AI Assistant (Lola)
- Chatbot interface
- Trained on venue-specific data
- Industry knowledge base
- Context-aware responses

## Database Schema

The application uses Prisma with PostgreSQL. Key models:

- **User**: Authentication and user accounts
- **Venue**: Venue information
- **VenueMember**: User-venue relationships with roles
- **Event**: Calendar events
- **EventPerformance**: Post-show metrics
- **Opportunity**: Booking pipeline items
- **Contact**: Artists and agents
- **AIConversation**: Lola chat history

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Set up PostgreSQL database (Vercel Postgres or external)
5. Deploy!

## Next Steps / Enhancements

1. **Email Integration**: Set up email service (SendGrid, Resend, etc.) for user invitations
2. **File Upload**: Implement document upload for events and opportunities
3. **Contact Relationships**: Complete artist-agent mapping functionality
4. **Advanced Analytics**: Add more metrics (per cap, ROI, event yield, etc.)
5. **Notifications**: Add real-time notifications for important events
6. **Mobile Responsiveness**: Enhance mobile experience
7. **Export Features**: Add CSV/PDF export for analytics

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check database permissions

### Authentication Issues
- Verify NEXTAUTH_SECRET is set
- Ensure NEXTAUTH_URL matches your app URL
- Check that user passwords are properly hashed in the database

### AI Assistant Not Working
- Verify ANTHROPIC_API_KEY is set correctly
- Check API quota/limits
- Review API logs for errors

## Support

For issues or questions, please refer to the codebase or create an issue in your repository.

