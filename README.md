# JobStream Frontend

Production-grade Next.js frontend wired for:
- Supabase auth (OTP email login)
- JWT forwarding to backend APIs
- WebSocket token auth to pipeline channel
- Rate-limit/credit headers UX
- Health/readiness surfacing
- Graceful handling for `401/402/403/429`
- Product workspace UX with feature placements for Jobs, Resume, Cover Letter, Company, Interview, Tracker, Network, Career, Analytics, and Live Applier
- Live Applier panel with screenshot streaming and HITL response controls

## Run

```bash
cd frontend
npm install
npm run dev
```

## Required env

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Docker (separate frontend deploy)

```bash
cd frontend
cp .env.production.example .env
# set NEXT_PUBLIC_* values for your deployed backend/frontend URLs
docker compose -f docker-compose.frontend.yml up --build -d
```
