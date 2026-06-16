# TenantRadar

AI-powered property management for landlords. An autonomous AI agent handles tenant messages, maintenance requests, and rent reminders.

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- MongoDB + Mongoose
- Tailwind CSS + shadcn/ui
- NextAuth.js (credentials)
- Google Gemini API
- Nodemailer + Gmail OAuth2

## Getting started

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Install dependencies:

```bash
npm install
```

3. Seed a landlord account (optional, or use `LANDLORD_EMAIL` / `LANDLORD_PASSWORD` in `.env.local`):

```bash
npx tsx scripts/seed-landlord.ts
```

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in at `/auth/signin`.

## Environment variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `NEXTAUTH_SECRET` | NextAuth session secret |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `GEMINI_API_KEY` | Google Gemini API key for the agent |
| `GMAIL_CLIENT_ID` | Gmail OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Gmail OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | Gmail OAuth refresh token |
| `LANDLORD_EMAIL` | Demo landlord email (credentials fallback) |
| `LANDLORD_PASSWORD` | Demo landlord password |
| `CRON_SECRET` | Optional bearer token for `/api/rent-reminder` |

## API routes

- `POST /api/agent` — Process a message through the AI agent
- `GET|POST /api/messages` — List / create messages
- `GET|POST|DELETE /api/tenants` — Tenant CRUD
- `GET|POST /api/properties` — Property CRUD
- `GET|POST|PATCH /api/tickets` — Maintenance tickets
- `POST /api/rent-reminder` — Cron endpoint for rent reminders
