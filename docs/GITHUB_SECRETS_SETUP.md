# GitHub Secrets Setup for Railway Deployment

Your Railway backend is live at: **`https://nsheera-rates-proxy-production.up.railway.app`**

To connect GitHub Actions CI/CD to Railway and enable the AI Design Studio, add these **6 repository secrets** to your GitHub repo.

## Where to Add Secrets

1. Go to: **GitHub repo → Settings → Secrets and variables → Actions**
2. Click **New repository secret** for each one below

## Required Secrets

| Secret Name | Value | Source |
|---|---|---|
| `RAILWAY_TOKEN` | Your Railway API token | [Railway Account Settings → API Tokens](https://railway.app/account/tokens) |
| `RAILWAY_PROJECT_ID` | Your Railway project ID | Railway dashboard → Project Settings → copy ID |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | [Anthropic Console → API Keys](https://console.anthropic.com/account/keys) |
| `METALS_API_KEY` | `UWY1VV6WCDIKUEG1YNEP476G1YNEP` | metals.dev API key (keep private) |
| `FRONTEND_URL` | `https://vincisam.github.io/nsheera/` | Your GitHub Pages domain |
| `RATES_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/rates` | The live backend URL |

## Getting Each Secret

### 1. Railway API Token
1. Go to [railway.app](https://railway.app)
2. Click your profile (top-right) → **Account** → **API Tokens**
3. Click **Create** and copy the token immediately (it won't be shown again)
4. In GitHub: create secret `RAILWAY_TOKEN` with this value

### 2. Railway Project ID
1. In Railway dashboard, open your project
2. Click **Settings** (gear icon, top-right)
3. Copy the **Project ID** field
4. In GitHub: create secret `RAILWAY_PROJECT_ID` with this value

### 3. Anthropic API Key ← **NEW for AI Design Studio**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Log in or sign up (free tier available)
3. Go to **API keys** section
4. Click **Create new key**
5. Copy the key immediately (won't be shown again)
6. In GitHub: create secret `ANTHROPIC_API_KEY` with this value

### 4-6. Other Secrets
Copy these exactly as shown:

- `METALS_API_KEY` = `UWY1VV6WCDIKUEG1YNEP476G1YNEP`
- `FRONTEND_URL` = `https://vincisam.github.io/nsheera/`
- `RATES_BACKEND_URL` = `https://nsheera-rates-proxy-production.up.railway.app/api/rates`

## After Adding Secrets

1. Push to `main` or manually trigger workflows in GitHub Actions tab
2. **Frontend workflow** rebuilds with backend URL → GitHub Pages (1-2 min)
3. **Backend workflow** redeploys with all env vars → Railway (3-5 min)
4. Verify deployment:
   - **Frontend:** Visit https://vincisam.github.io/nsheera/ → should load
   - **Backend:** Visit https://nsheera-rates-proxy-production.up.railway.app/api/health → should return `{"status": "ok"}`
   - **AI Design:** Log into Client Dashboard → AI Design Studio tab → Generate a concept

## Testing the AI Design Studio

1. Open https://vincisam.github.io/nsheera/ in your browser
2. Scroll down to **AI Design Your Jewellery** section OR
3. Log in → Account → **AI Design Studio** tab
4. Enter a prompt: "A modern gold pendant with a pearl center stone"
5. Click **Generate Concept**
6. Should see a detailed design brief (title, specs, variations, etc.)

If you get "Could not reach the AI design service":
- Check that `ANTHROPIC_API_KEY` secret is set correctly
- Backend deployment may still be in progress (wait 5 min and retry)
- Check GitHub Actions logs for errors

## What Each Secret Controls

| Secret | Enables | What It Does |
|--------|---------|-------------|
| `RAILWAY_TOKEN` | Automated backend deployment | GitHub Actions can deploy JAR to Railway |
| `RAILWAY_PROJECT_ID` | Deployment targeting | Actions know which Railway project to deploy to |
| `ANTHROPIC_API_KEY` | AI Design Studio | Backend calls Anthropic API to generate design concepts |
| `METALS_API_KEY` | Live rate fetching | Backend proxies metals.dev calls (server-side key) |
| `FRONTEND_URL` | CORS security | Backend allows requests only from your frontend domain |
| `RATES_BACKEND_URL` | Frontend knows backend | Frontend knows where to call the backend from |

## Troubleshooting

- **Workflow fails with "RAILWAY_TOKEN not found":** Check secret name spelling (case-sensitive)
- **Backend deployment fails:** Check GitHub Actions logs for specific error
- **AI Design returns 503:** `ANTHROPIC_API_KEY` may be missing or incorrect. Re-deploy and verify in Railway dashboard that the env var is set
- **Frontend still can't reach AI Design:** Verify `RATES_BACKEND_URL` secret is set and frontend was rebuilt after adding secrets
- **Anthropic key rejected:** Get a new key from console.anthropic.com, don't reuse old ones

## Getting Help

- Railway docs: https://docs.railway.app/
- Anthropic docs: https://docs.anthropic.com/
- GitHub Actions secrets: https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions

---

**See also:**
- `QUICKSTART.md` — 5-minute setup summary
- `DEPLOYMENT_SUMMARY.md` — Complete overview
- `ARCHITECTURE_FLOW.md` — Technical flow diagrams
