# Frontend + Backend CI/CD Setup Complete

Your N.S. Heera & Sons Jewellers storefront is now ready for automated deployments.

## Current Status

✅ **Backend (Spring Boot rates-proxy):** Live on Railway  
📍 **Service URL:** `https://nsheera-rates-proxy-production.up.railway.app`  
📍 **API Endpoint:** `https://nsheera-rates-proxy-production.up.railway.app/api/rates`

✅ **Frontend (React + Vite):** Deploying to GitHub Pages  
📍 **Domain:** `https://vincisam.github.io/nsheera/`

## What Was Set Up

### GitHub Workflows Created/Updated

1. **`.github/workflows/deploy-backend.yml`** (NEW)
   - Builds Spring Boot rates-proxy JAR with Maven
   - Deploys to Railway via CLI
   - Triggers on: push to `rates-proxy/` directory or the workflow file itself
   - Automatically injects `METALS_API_KEY` and `FRONTEND_ORIGIN` as environment variables

2. **`.github/workflows/deploy.yml`** (UPDATED)
   - Builds React app with Vite
   - Injects `VITE_RATES_BACKEND_URL` from GitHub secrets
   - Publishes to GitHub Pages
   - Triggers on: every push to `main`

### Code Updates

- **`src/App.jsx` (line 406):** Changed from hardcoded `/api/rates` to `import.meta.env.VITE_RATES_BACKEND_URL`
- **`rates-proxy/railway.json`:** Already configured with Docker build, health checks, and restart policy

## Next Steps: Add GitHub Secrets

You need to add **5 repository secrets** to your GitHub repo to activate the workflows.

### Secrets to Add

Go to: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|-------|
| `RAILWAY_TOKEN` | From [Railway Account Settings → API Tokens](https://railway.app/account/tokens) — Create one if needed |
| `RAILWAY_PROJECT_ID` | From Railway dashboard → Project Settings |
| `METALS_API_KEY` | `UWY1VV6WCDIKUEG1YNEP476G1YNEP` |
| `FRONTEND_URL` | `https://vincisam.github.io/nsheera/` |
| `RATES_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/rates` |

**See `GITHUB_SECRETS_SETUP.md` for detailed instructions.**

## How It Works

```
Push to main
    ↓
GitHub Actions: Build React + inject VITE_RATES_BACKEND_URL
    ↓
Deploy to GitHub Pages (1-2 min)
    ↓
Front-end calls backend at nsheera-rates-proxy-production.up.railway.app/api/rates
    ↓
Backend keeps METALS_API_KEY server-side, calls metals.dev, caches for 2 min
    ↓
Frontend displays live gold/silver rates (or falls back to direct APIs if backend is down)

---

Push to rates-proxy/
    ↓
GitHub Actions: Build JAR, deploy to Railway
    ↓
Railway restarts service (auto health-check)
    ↓
Backend is live ~2 min later
```

## Testing After Setup

1. **Add all 5 secrets** to GitHub
2. **Push to `main`** to trigger workflows (or manually trigger them in Actions tab)
3. **Verify backend:**
   - Go to Railway dashboard → rates-proxy service → Deployments → check green status
   - Visit `https://nsheera-rates-proxy-production.up.railway.app/api/rates` → should return JSON with gold/silver rates
4. **Verify frontend:**
   - Visit `https://vincisam.github.io/nsheera/`
   - Log in to Admin Panel (password in App.jsx)
   - Go to **Rates tab** → Click **Refresh Live Rate**
   - Diagnostics should show "backend" as the source
5. **Done!** Both are now auto-deploying on every commit

## Files Created/Modified

- ✏️ `.github/workflows/deploy.yml` — Updated frontend workflow
- ✨ `.github/workflows/deploy-backend.yml` — New backend workflow
- ✏️ `src/App.jsx` — Updated to use env var for backend URL
- 📄 `GITHUB_SECRETS_SETUP.md` — Detailed secrets setup guide
- 📄 `DEPLOYMENT_SUMMARY.md` — This file

## Key Features

- **Auto-deploy frontend** on every push to `main`
- **Auto-deploy backend** on every push to `rates-proxy/`
- **Secure API keys** — kept in GitHub secrets, never committed to repo
- **Fallback logic** — frontend falls back to public APIs if backend is down
- **Health checks** — Railway auto-restarts the backend if it crashes
- **Rate caching** — backend caches rates for 2 minutes to save API quota

## Troubleshooting

See `GITHUB_SECRETS_SETUP.md` for detailed troubleshooting. Common issues:

- Workflows not triggering? Check that you've added all secrets
- Backend not responding? Wait 2-3 minutes after Railway deploys
- Frontend calling direct APIs? Verify `RATES_BACKEND_URL` secret is set correctly

## Questions?

Check the detailed guides:
- `GITHUB_SECRETS_SETUP.md` — How to add GitHub secrets
- `GITHUB_DEPLOYMENT_SETUP.md` — Full setup walkthrough
- `.github/workflows/deploy.yml` & `deploy-backend.yml` — The automation itself
