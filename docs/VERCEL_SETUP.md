# Vercel Deployment Setup for Frontend + Railway Backend

You're hosting the frontend on **Vercel**. To connect it to your Railway backend (rates, design, astro endpoints), add environment variables to Vercel during the build.

## Problem

The frontend was calling `/api/design/generate`, but on Vercel:
- Vercel only hosts static files (React bundle)
- There's no backend to handle `/api/*` routes
- Requests fail with "Could not reach the AI design service"

## Solution

**Configure Vercel environment variables** to inject the backend URLs at build time, so the frontend knows where to call the backend.

## Steps

### 1. Update Vercel Project Settings

1. Go to **Vercel dashboard** → Your project → **Settings**
2. Click **Environment Variables** (left sidebar)
3. Add these environment variables:

| Name | Value | Scope |
|------|-------|-------|
| `VITE_RATES_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/rates` | Production |
| `VITE_DESIGN_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/design/generate` | Production |
| `VITE_ASTRO_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/astro/suggest-stone` | Production |

(Optional: add same for Preview/Development if you want them set during previews)

### 2. Redeploy

Vercel will automatically detect the env var changes. Either:
- **Manual:** Go to Deployments → Redeploy latest commit
- **Automatic:** Push any commit to `main` to trigger a new build

During build, Vite will see these env vars and embed them in the bundle:
```javascript
const RATES_BACKEND_URL = 'https://nsheera-rates-proxy-production.up.railway.app/api/rates'
const DESIGN_BACKEND_URL = 'https://nsheera-rates-proxy-production.up.railway.app/api/design/generate'
```

### 3. Test

1. Visit your Vercel frontend
2. Open Client Dashboard → Log in
3. Go to **AI Design Studio** tab
4. Enter a prompt and click Generate
5. Should now successfully call the backend and show design specs

If it still fails:
- Check Vercel deployment logs (Deployments → select latest → View logs)
- Confirm env vars are set in Vercel Settings
- Verify backend is live (visit the backend URLs in browser)

## How It Works

```
Build-time (Vercel):
  VITE_RATES_BACKEND_URL = "https://...railway.app/api/rates"
    ↓ (Vite embeds this into dist/index.js)
  
Runtime (Browser):
  import.meta.env.VITE_RATES_BACKEND_URL = "https://...railway.app/api/rates"
    ↓ (App.jsx reads it)
  
  const RATES_BACKEND_URL = "https://...railway.app/api/rates"
    ↓ (Frontend calls it)
  
  POST https://nsheera-rates-proxy-production.up.railway.app/api/rates
    ↓ (Backend responds with gold/silver rates)
```

## Environment Variables Explained

| Variable | Endpoint | Purpose |
|----------|----------|---------|
| `VITE_RATES_BACKEND_URL` | `/api/rates` | GET live gold/silver rates (proxied from metals.dev) |
| `VITE_DESIGN_BACKEND_URL` | `/api/design/generate` | POST design concept with Anthropic (proxied from Anthropic API) |
| `VITE_ASTRO_BACKEND_URL` | `/api/astro/suggest-stone` | POST astrological stone suggestions (proxied from Anthropic API) |

All endpoints need `ANTHROPIC_API_KEY` set in Railway (see `AI_DESIGN_STUDIO_FIX.md`).

## What's Changed in Code

- `src/App.jsx`:
  - Line 325: `DESIGN_BACKEND_URL` now reads from `VITE_DESIGN_BACKEND_URL`
  - Line 389: `ASTRO_BACKEND_URL` now reads from `VITE_ASTRO_BACKEND_URL`
  - Line 463: `RATES_BACKEND_URL` now reads from `VITE_RATES_BACKEND_URL`

- `vercel.json`:
  - Added `env` section to map env vars at build time

## Testing Locally

```bash
# Local dev (no env vars, uses fallback /api/*)
npm run dev
# Frontend: http://localhost:5173
# Vite proxy routes /api/* → http://localhost:8080

# With env vars set:
VITE_RATES_BACKEND_URL=https://nsheera-rates-proxy-production.up.railway.app/api/rates npm run dev
# Frontend calls production backend instead of local
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| AI Design returns 503 | Ensure `ANTHROPIC_API_KEY` is set in Railway (see AI_DESIGN_STUDIO_FIX.md) |
| Environment vars not applied | Redeploy on Vercel (wait for new deployment to finish) |
| Frontend still calling direct APIs | Check browser DevTools Network tab to see if calls hit backend or go direct |
| Vercel deploy fails | Check build logs: `Deployments → Select latest → View logs` |

---

**Next:** Set the three environment variables in Vercel, redeploy, and test AI Design Studio.
