# GitHub Secrets Setup — REQUIRED FOR CI/CD

Your GitHub Actions workflows are failing because **GitHub Secrets are not set**.

## What Secrets Are Needed

The `.github/workflows/deploy-backend.yml` workflow needs these 5 secrets to deploy to Railway:

| Secret | Value | Where to Get |
|--------|-------|-------------|
| `RAILWAY_TOKEN` | Your Railway API token | [Railway Dashboard → Account → API Tokens](https://railway.app/account/tokens) |
| `RAILWAY_PROJECT_ID` | Your Railway project ID | Railway Dashboard → Project Settings |
| `METALS_API_KEY` | `UWY1VV6WCDIKUEG1YNEP476G1YNEP` | (provided) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | [console.anthropic.com → API Keys](https://console.anthropic.com/account/keys) |
| `FRONTEND_URL` | `https://your-vercel-domain.vercel.app` | Your Vercel frontend URL |

## How to Add GitHub Secrets

1. Go to your **GitHub repo → Settings**
2. Left sidebar → **Secrets and variables → Actions**
3. Click **New repository secret**
4. Add each secret one by one:

### Secret 1: RAILWAY_TOKEN
- Name: `RAILWAY_TOKEN`
- Value: (from Railway Account → API Tokens → Create)
- Click **Add secret**

### Secret 2: RAILWAY_PROJECT_ID
- Name: `RAILWAY_PROJECT_ID`
- Value: (from Railway Project Settings)
- Click **Add secret**

### Secret 3: METALS_API_KEY
- Name: `METALS_API_KEY`
- Value: `UWY1VV6WCDIKUEG1YNEP476G1YNEP`
- Click **Add secret**

### Secret 4: ANTHROPIC_API_KEY
- Name: `ANTHROPIC_API_KEY`
- Value: (from console.anthropic.com → API Keys → Create)
- Click **Add secret**

### Secret 5: FRONTEND_URL
- Name: `FRONTEND_URL`
- Value: `https://your-vercel-domain.vercel.app` (replace with your actual Vercel domain)
- Click **Add secret**

## Verify Secrets Are Set

After adding all 5 secrets:
1. Go to **Secrets and variables → Actions**
2. Should see all 5 secrets listed
3. They won't show values (masked for security)
4. Just need to see the names

## Also Add Vercel Environment Variables

**Don't forget!** You also need to set the same variables in **Vercel → Settings → Environment Variables**:

| Name | Value | Scope |
|------|-------|-------|
| `VITE_RATES_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/rates` | Production |
| `VITE_DESIGN_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/design/generate` | Production |
| `VITE_ASTRO_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/astro/suggest-stone` | Production |

## After Adding All Secrets

1. **GitHub secrets added** (5 secrets for backend deployment)
2. **Vercel env vars added** (3 VITE_* variables for frontend)
3. **Redeploy:**
   - Vercel: Deployments → Latest → ⋮ → Redeploy
   - Backend: Just push any commit to `rates-proxy/` and GitHub Actions will auto-deploy

## Test the Workflows

After adding secrets:
1. Go to **GitHub → Actions → Deploy Rates Proxy to Railway**
2. Click **Run workflow** button
3. Wait for it to turn green (success)
4. Check Railway dashboard to confirm service updated

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Workflow still failing | Check all 5 secrets are set (GitHub → Secrets) |
| Railway deploy fails | Check RAILWAY_TOKEN and RAILWAY_PROJECT_ID are correct |
| "Service not found" error | Check RAILWAY_PROJECT_ID matches your project |
| Vercel still showing error | Check Vercel env vars have Scope = "Production" |

---

**Add all 5 GitHub secrets, then backend deployment will work automatically.**
