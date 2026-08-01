# Backend Deployment Summary

## Architecture Decision

**Chosen: Railway for Backend + Vercel for Frontend**

### Why This Architecture

| Component | Platform | Reason |
|-----------|----------|--------|
| **Frontend** | Vercel | Static/serverless, auto-deploys from GitHub, free tier, built for SPAs |
| **Backend** | Railway | Spring Boot native support, auto-scales, $5/mo base, auto-deploys from GitHub |

### Why NOT Vercel for Backend
- ❌ Vercel is optimized for Node.js/serverless
- ❌ Spring Boot needs persistent JVM
- ❌ Cold starts on serverless = slow API responses
- ❌ Docker on Vercel is complex and expensive

### Why Railway for Backend
- ✅ Native Java/Spring Boot support
- ✅ Always-on, no cold starts
- ✅ $5/month + usage (very affordable)
- ✅ Auto-deploys from GitHub
- ✅ Perfect for production APIs

## Current Deployment

```
┌────────────────────────────────────────────────┐
│ FRONTEND: Vercel                               │
│ https://your-domain.vercel.app                 │
│ - React (Vite)                                 │
│ - Auto-deploys on git push to main             │
│ - Env vars: VITE_RATES_BACKEND_URL, etc.      │
└────────────────────────┬───────────────────────┘
                         │
                    HTTPS (public)
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
    /api/rates    /api/design/      /api/astro/
                   generate          suggest-stone
         │               │               │
         └───────────────┼───────────────┘
                         │
┌────────────────────────┴───────────────────────┐
│ BACKEND: Railway                               │
│ nsheera-rates-proxy-production.up.railway.app  │
│ - Spring Boot (Java 17)                        │
│ - Docker container                             │
│ - Auto-deploys on git push to rates-proxy/    │
│ - Env vars: ANTHROPIC_API_KEY, METALS_API_KEY │
└────────────────────────────────────────────────┘
```

## What You Just Got

### Code Changes
✅ Fixed `vercel.json` (removed incorrect env var syntax)  
✅ `src/App.jsx` reads backend URLs from env vars  
✅ GitHub Actions auto-deploys backend on changes to `rates-proxy/`  
✅ GitHub Actions auto-deploys frontend on changes to `main`

### Documentation
✅ `COMPLETE_SETUP_CHECKLIST.md` — Step-by-step setup  
✅ `RAILWAY_BACKEND_SETUP.md` — Backend details  
✅ `VERCEL_FINAL_FIX.md` — Vercel env var fix  
✅ `ACTION_PLAN.md` — Quick troubleshooting  
✅ `VERCEL_DEBUG_GUIDE.md` — Deep debugging

## To Get Everything Working

**Follow `COMPLETE_SETUP_CHECKLIST.md`** (in repo root)

Key steps:
1. Set `ANTHROPIC_API_KEY` on Railway
2. Add three `VITE_*` env vars to Vercel (Scope = "Production")
3. Redeploy Vercel
4. Hard refresh browser
5. Test AI Design Studio

## Architecture Benefits

### Separation of Concerns
- Frontend team can deploy independently of backend
- Backend team can scale separately
- Different technologies optimized for each layer

### Auto-Deployment
Both frontend and backend auto-deploy from GitHub:
```bash
# Deploy frontend
git push origin main
# Vercel auto-deploys to https://your-domain.vercel.app

# Deploy backend
git add rates-proxy/
git commit -m "Update backend"
git push
# Railway auto-deploys to railway.app
```

### Scalability
- **Frontend:** Vercel handles traffic spikes (CDN, auto-scaling)
- **Backend:** Railway auto-scales based on CPU/memory (containers)
- **Rates caching:** Backend caches for 2 min to reduce API calls
- **Fallback logic:** Frontend falls back to direct APIs if backend down

### Security
- **API keys server-side:** METALS_API_KEY, ANTHROPIC_API_KEY never exposed to browser
- **CORS controlled:** FRONTEND_ORIGIN env var restricts which domains can call backend
- **HTTPS everywhere:** All communication encrypted

## Monitoring

### Frontend (Vercel)
- Deployments tab → see all versions
- Build logs → debug build failures
- Analytics → see traffic/performance

### Backend (Railway)
- Deployments tab → see service versions
- Logs → debug runtime errors
- Metrics → CPU, memory, network usage
- Auto-restart on crash (configured in railway.json)

## Cost Estimate

| Service | Cost | Notes |
|---------|------|-------|
| **Vercel** | Free | Static hosting (up to 100GB bandwidth) |
| **Railway** | $5-20/mo | $5 base + usage (typically $5-10 for low traffic) |
| **Anthropic API** | Pay-per-use | ~$0.003 per 1K tokens (very cheap for design requests) |
| **metals.dev API** | Free | 1000 calls/month free tier |
| **Total** | ~$10-30/mo | Very affordable for production |

## Next Steps

✅ Backend deployed (Railway)  
✅ Frontend deployed (Vercel)  
⏳ **Follow COMPLETE_SETUP_CHECKLIST.md to wire them together**

Once everything is set:
- AI Design Studio will work end-to-end
- Live rates will display on storefront
- Users can design custom jewellery
- Everything auto-scales and auto-deploys

---

**Backend is ready. Just complete the setup checklist.**
