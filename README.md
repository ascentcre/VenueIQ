# ViQ (VenueIQ)

Booking, Opportunity Management, and Analytics for Independent Live Music Venues

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Fill in your environment variables
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your app URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `ANTHROPIC_API_KEY` - Anthropic API key for Lola AI assistant

