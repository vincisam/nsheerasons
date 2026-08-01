# Full-Stack Deployment Plan

## N.S. Heera & Sons Jewellers — Frontend + Backend

### Architecture
```
┌─────────────────────────────────────────────────────┐
│                   Vercel (Frontend)                  │
│  React + Vite SPA                                   │
│  https://nsheera.vercel.app                          │
│         │                                            │
│         │  CORS / API calls                          │
│         ▼                                            │
│  Railway (Backend - Spring Boot)                     │
│  rates-proxy (Docker)                                │
│  https://nsheera-rates-proxy.railway.app/api/rates   │
│         │                                            │
│         ▼                                            │
│  Metals.dev / RapidAPI Delhi / Gold-API (Sources)    │
└─────────────────────────────────────────────────────┘
```

### Deployment Steps

#### Phase 1: GitHub Setup
- [ ] Commit current changes and push to `main` branch
- [ ] Verify GitHub repo: `vincisam/nsheera`

#### Phase 2: Backend (Railway)
- [ ] Deploy `rates-proxy/` as a Docker container on Railway
- [ ] Set environment variables:
  - `METALS_API_KEY` (new, rotated key)
  - `RAPIDAPI_KEY` (required for RapidAPI fallback tier in backend)
  - `FRONTEND_ORIGIN` = `https://nsheera.vercel.app`
- [ ] Verify backend: `GET /api/health` → `{ "status": "ok" }`
- [ ] Verify backend: `GET /api/rates` returns 200 with `goldPerGram`, `silverPerGram`, `source`, `lastUpdated`
- [ ] Confirm Delhi live source attachment (RapidAPI):
  - Host: `gold-silver-live-price-india.p.rapidapi.com`
  - Gold endpoint: `/gold_historical_price_india_city_value/`
  - Silver endpoint: `/silver_historical_price_india_city_value/`
  - Required headers:
    - `city: Delhi`
    - `required-date-yyyy-mm-dd: <YYYY-MM-DD>`
    - `x-rapidapi-host: gold-silver-live-price-india.p.rapidapi.com`
    - `x-rapidapi-key: <RAPIDAPI_KEY>`

#### Phase 3: Frontend Configuration
- [ ] Set `RATES_BACKEND_URL` in `App.jsx` to Railway backend URL
- [ ] Add Vite proxy for local development in `vite.config.js`
- [ ] Deploy to Vercel (connected to GitHub repo)

#### Phase 4: Verification
- [ ] Confirm live rates load via backend proxy (not browser API keys)
- [ ] Confirm site works end-to-end

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (for frontend)
- Java 17+ and Maven (for backend, optional - or use Docker)

### Frontend
```bash
cd nsheera-deploy
npm install
npm run dev        # http://localhost:5173
```

### Backend (via Docker)
```bash
cd rates-proxy
docker build -t nsheera-rates-proxy .
docker run -p 8080:8080 \
  -e METALS_API_KEY=your_key_here \
  -e RAPIDAPI_KEY=your_rapidapi_key_here \
  -e FRONTEND_ORIGIN=http://localhost:5173 \
  nsheera-rates-proxy
```

### Backend (via Maven, requires Java 17+)
```bash
cd rates-proxy
export METALS_API_KEY=your_key_here
export RAPIDAPI_KEY=your_rapidapi_key_here
export FRONTEND_ORIGIN=http://localhost:5173
mvn spring-boot:run
```

