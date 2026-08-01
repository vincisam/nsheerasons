# Backend Deployment: Railway (Complete Setup)

Your Spring Boot backend (`rates-proxy`) is deployed on **Railway**, which is the **best platform for Java/Spring Boot**.

## Current Status

✅ **Backend Service:** `nsheera-rates-proxy-production`  
✅ **Domain:** `https://nsheera-rates-proxy-production.up.railway.app`  
✅ **Endpoints:**
- `/api/health` — Health check
- `/api/rates` — Live gold/silver rates (proxied from metals.dev)
- `/api/design/generate` — AI design concepts (proxied from Anthropic)
- `/api/astro/suggest-stone` — Astrological suggestions (proxied from Anthropic)

## Why Railway (Not Vercel)

| Feature | Vercel | Railway |
|---------|--------|---------|
| **Runtime** | Node.js, Serverless | **Any**: Java, Python, Go, Node, etc. |
| **Best for Spring Boot** | ❌ Difficult | ✅ **Native support** |
| **JVM Support** | ❌ Complex Docker | ✅ **Built-in** |
| **Persistent Process** | ❌ Serverless (cold starts) | ✅ **Always running** |
| **Pricing** | Pay per request | **$5/month base + usage** |
| **GitHub Integration** | ✅ Excellent | ✅ **Excellent** |

**Railway is optimized for backends like yours. Vercel is for static/serverless frontends.**

## Required Environment Variables on Railway

Your backend needs these to function:

| Variable | Value | Purpose |
|----------|-------|---------|
| `METALS_API_KEY` | `UWY1VV6WCDIKUEG1YNEP476G1YNEP` | Gold/silver rates API key |
| `ANTHROPIC_API_KEY` | *Your Anthropic API key* | AI design concepts |
| `FRONTEND_ORIGIN` | `https://<your-vercel-domain>.vercel.app` | CORS access control |

### Set These Environment Variables

1. Go to **Railway Dashboard → Your Project → rates-proxy service**
2. Click **Settings → Variables**
3. Add/verify these are set:

```
METALS_API_KEY = UWY1VV6WCDIKUEG1YNEP476G1YNEP
ANTHROPIC_API_KEY = (your actual key from console.anthropic.com)
FRONTEND_ORIGIN = https://<your-vercel-domain>.vercel.app
```

4. Railway auto-redeploys when variables change (wait ~2 min for green status)

## Verifying Backend Is Live

### Test 1: Health Check
```bash
curl https://nsheera-rates-proxy-production.up.railway.app/api/health
# Expected: {"status":"ok"}
```

### Test 2: Rates Endpoint
```bash
curl https://nsheera-rates-proxy-production.up.railway.app/api/rates
# Expected: {"goldPerGram": 8123.45, "silverPerGram": 96.2, ...}
```

### Test 3: Design Endpoint
```bash
curl -X POST https://nsheera-rates-proxy-production.up.railway.app/api/design/generate \
  -H "Content-Type: application/json" \
  -d '{"promptText":"A gold ring with a pearl"}'
  
# Expected: 200 with design JSON OR 503 if ANTHROPIC_API_KEY not set
```

## GitHub → Railway Auto-Deployment

Your `.github/workflows/deploy-backend.yml` automatically deploys when you push to `rates-proxy/` directory:

```yaml
# Triggers:
on:
  push:
    paths:
      - "rates-proxy/**"              # Pushes to rates-proxy/ folder
      - ".github/workflows/deploy-backend.yml"

# Does:
- Build JAR with Maven
- Deploy to Railway
- Set environment variables
```

**To trigger deployment:**
```bash
# Any commit that touches rates-proxy/
git add rates-proxy/
git commit -m "Update backend"
git push

# Check status: GitHub Actions tab → deploy-backend workflow
```

## Frontend Connection

Your **Vercel frontend** connects to this Railway backend via:

```javascript
// src/App.jsx
const DESIGN_BACKEND_URL = import.meta.env.VITE_DESIGN_BACKEND_URL 
  || 'https://nsheera-rates-proxy-production.up.railway.app/api/design/generate'
```

Set in **Vercel → Environment Variables:**
```
VITE_DESIGN_BACKEND_URL = https://nsheera-rates-proxy-production.up.railway.app/api/design/generate
VITE_RATES_BACKEND_URL = https://nsheera-rates-proxy-production.up.railway.app/api/rates
VITE_ASTRO_BACKEND_URL = https://nsheera-rates-proxy-production.up.railway.app/api/astro/suggest-stone
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│   Vercel (https://your-domain.vercel.app)          │
│   - React + Vite                                    │
│   - Static hosting                                  │
│   - Auto-deploys on push to main                    │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
                     │ /api/rates
                     │ /api/design/generate
                     ↓
┌─────────────────────────────────────────────────────┐
│                   BACKEND                           │
│   Railway (nsheera-rates-proxy-production)          │
│   - Spring Boot (Java 17)                           │
│   - Docker container                                │
│   - Auto-scales on demand                           │
│   - Auto-redeploys on github push to rates-proxy/   │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS (server-side keys)
                     ├─→ metals.dev (rates)
                     ├─→ Anthropic API (design)
                     └─→ Anthropic API (astro)
```

## Monitoring

### Check Backend Status
- **Railway Dashboard → rates-proxy service**
  - Green status = running
  - Click Deployments tab to see history
  - Click logs to see errors

### Check Logs
```bash
# If you have Railway CLI installed:
railway logs

# Or via dashboard: Deployments → select latest → View Logs
```

### Common Issues

| Issue | Fix |
|-------|-----|
| Returns 503 on design endpoint | `ANTHROPIC_API_KEY` not set (add to Railway variables) |
| Returns 504 timeout | Service is down or overloaded (check Railway dashboard) |
| 404 on `/api/design/generate` | Service didn't deploy (check logs) |
| CORS error from frontend | `FRONTEND_ORIGIN` not set correctly on Railway |

## Testing Full Stack

**Local dev:**
```bash
npm run dev           # Frontend http://localhost:5173
cd rates-proxy
mvn spring-boot:run  # Backend http://localhost:8080
```

**Production:**
1. Frontend: https://your-vercel-domain.vercel.app
2. Backend: https://nsheera-rates-proxy-production.up.railway.app
3. Test: Client Dashboard → AI Design Studio → Generate

## Next Steps

1. ✅ Backend is deployed on Railway
2. ⏳ **Verify `ANTHROPIC_API_KEY` is set in Railway variables**
3. ⏳ **Verify Vercel env vars are set with correct Scope**
4. ⏳ **Redeploy Vercel frontend** (Vercel Deployments → Redeploy)
5. ⏳ **Test:** Open client dashboard, try AI Design Studio

---

**Backend is ready on Railway. Just ensure all env vars are set correctly.**
