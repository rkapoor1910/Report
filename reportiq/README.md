# ReportIQ

Universal reporting intelligence layer — connects to any data source and delivers plain-English alerts, red flags, and stats to your phone via WhatsApp, SMS, email, or Slack.

## Architecture

```
apps/
  web/        → Next.js 14 + TypeScript + Tailwind (user dashboard)
  api/        → Node.js + Fastify (REST API + connector orchestration)
  workers/    → Python + FastAPI (data parsing, AI analysis, delivery)

packages/
  shared-types/  → TypeScript types shared across web + api
  db/            → PostgreSQL schema + Drizzle ORM queries
  queue/         → BullMQ job definitions
  vault/         → Credential encryption utilities

infra/
  docker/     → Docker Compose for local dev
  nginx/      → Reverse proxy config
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| API | Node.js, Fastify, Drizzle ORM |
| Workers | Python, FastAPI, Celery |
| Database | PostgreSQL 16 + TimescaleDB, Redis |
| Queue | BullMQ (Node), Celery (Python) |
| Auth | Clerk |
| AI | Claude API (Anthropic) |
| Storage | AWS S3 / Cloudflare R2 |
| Delivery | Twilio (WhatsApp/SMS), SendGrid, Slack |
| Infra | Docker, GitHub Actions, Railway |

## Build roadmap

- [ ] Step 1 — Connector setup (source picker, auth, test, preview)
- [ ] Step 2 — Report configuration
- [ ] Step 3 — AI analysis engine
- [ ] Step 4 — Alert & delivery layer
- [ ] Step 5 — User config dashboard
- [ ] Step 6 — Packaging & monetisation

## Getting started

```bash
# 1. Clone
git clone https://github.com/rkapoor1910/Report.git
cd Report

# 2. Install dependencies
pnpm install

# 3. Copy env
cp .env.example .env
# Fill in your keys

# 4. Start local stack
cd infra/docker && docker-compose up -d

# 5. Run migrations
pnpm db:migrate

# 6. Start dev servers
pnpm dev
```
