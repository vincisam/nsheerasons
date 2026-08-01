# AI Design Service Error on Vercel — FIXED

## Problem
Client dashboard on Vercel showed: **"Could not reach the AI design service — check your connection and try again."**

## Root Cause
The frontend was hardcoded to call `/api/design/generate`, but:
- Vercel only hosts static files (no backend)
- `/api/*` routes go nowhere (Vercel doesn't know where to route them)
- Frontend couldn't reach the backend, so it failed

## Solution Implemented

### 1. Made Backend URLs Environment-Configurable

**Updated `src/App.jsx`:**

```javascript
// Before (hardcoded):
const DESIGN_BACKEND_URL = '/api/design/generate';
const RATES_BACKEND_URL = '/api/rates';
const ASTRO_BACKEND_URL = '/api/astro/suggest-stone';

// After (reads from env):
const DESIGN_BACKEND_URL = import.meta.env.VITE_DESIGN_BACKEND_URL || '/api/design/generate';
const RATES_BACKEND_URL = import.meta.env.VITE_RATES_BACKEND_URL || '/api/rates';
const ASTRO_BACKEND_URL = import.meta.env.VITE_ASTRO_BACKEND_URL || '/api/astro/suggest-stone';
```

- In **local dev**: Uses fallback `/api/*` (Vite proxy → `localhost:8080`)
- In **Vercel production**: Uses injected env var pointing to Railway backend

### 2. Updated Vercel Configuration

**`vercel.json`** now includes:

```json
"env": {
  "VITE_RATES_BACKEND_URL": "@VITE_RATES_BACKEND_URL",
  "VITE_DESIGN_BACKEND_URL": "@VITE_DESIGN_BACKEND_URL",
  "VITE_ASTRO_BACKEND_URL": "@VITE_ASTRO_BACKEND_URL"
}
```

This tells Vercel to inject these env vars into the Vite build.

### 3. Created Setup Guide

**`VERCEL_SETUP.md`** with complete instructions.

## What You Need to Do

**Add 3 environment variables to your Vercel project:**

1. Go to **Vercel dashboard → Your project → Settings → Environment Variables**
2. Add:

| Name | Value |
|------|-------|
| `VITE_RATES_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/rates` |
| `VITE_DESIGN_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/design/generate` |
| `VITE_ASTRO_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/astro/suggest-stone` |

3. **Redeploy** (Vercel will auto-detect changes or manually redeploy the latest commit)

## How It Works

### Local Development (npm run dev)
```
Frontend: http://localhost:5173
  ↓
Calls: fetch('/api/design/generate')
  ↓ (Vite proxy in vite.config.js)
Backend: http://localhost:8080/api/design/generate
```

### Vercel Production (After env var setup)
```
Frontend: https://your-vercel-domain.vercel.app
  ↓
Env var injected at build time: VITE_DESIGN_BACKEND_URL = "https://nsheera-rates...railway.app/api/design/generate"
  ↓
Calls: fetch('https://nsheera-rates-proxy-production.up.railway.app/api/design/generate')
  ↓
Backend: Returns design concept JSON
```

## Testing After Setup

1. Add the 3 env vars to Vercel
2. Redeploy (Vercel will rebuild and embed the URLs)
3. Wait for deployment to finish (check Vercel Deployments tab)
4. Open your Vercel frontend
5. Client Dashboard → AI Design Studio tab
6. Enter a prompt and click Generate
7. Should now work!

## Files Modified

| File | Change |
|------|--------|
| `src/App.jsx` | Lines 325, 389, 463 — Now read from env vars |
| `vercel.json` | Added `env` section to inject variables at build |
| `VERCEL_SETUP.md` | NEW — Complete Vercel setup guide |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Still getting "Could not reach" after redeploy | Check Vercel env vars are set correctly in Settings |
| Vercel build logs show missing env | Env var names must start with `VITE_` for Vite to inject them |
| Backend returns 503 on design request | Make sure `ANTHROPIC_API_KEY` is set on Railway (see AI_DESIGN_STUDIO_FIX.md) |
| Still calling direct APIs instead of backend | Redeploy Vercel — old cached code may still be live |

## Architecture Now

```
Vercel (Frontend)                Railway (Backend)
https://your-site              https://nsheera-rates-proxy...
  ├─ VITE_RATES_BACKEND_URL ────→ /api/rates
  ├─ VITE_DESIGN_BACKEND_URL ───→ /api/design/generate  
  └─ VITE_ASTRO_BACKEND_URL ────→ /api/astro/suggest-stone
```

Everything is decoupled:
- Frontend can be hosted anywhere (Vercel, GitHub Pages, Netlify, etc.)
- Backend can be hosted anywhere (Railway, Heroku, AWS, etc.)
- They communicate via HTTPS (no CORS issues, ANTHROPIC key stays server-side)

---

**Status: ✅ Code is ready. Just add the 3 env vars to Vercel and redeploy.**

See `VERCEL_SETUP.md` for detailed step-by-step instructions.
