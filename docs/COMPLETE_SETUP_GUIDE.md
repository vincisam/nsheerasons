# Complete Setup Guide: From Start to AI Design Working

## Overview

You need to set up 3 things:
1. **GitHub Secrets** (for CI/CD automation)
2. **Vercel Environment Variables** (for frontend)
3. **Railway Environment Variables** (for backend)

Once done, everything auto-deploys and AI Design Studio works.

## STEP 1: Get Your API Keys (5 minutes)

### 1.1 Railway Token & Project ID

1. Go to https://railway.app/account/tokens
2. Click **Create**
3. Copy the token (save it somewhere safe)
4. Go to Railway Dashboard → Your Project
5. Click **Settings** (gear icon)
6. Copy the **Project ID**

**You now have:**
- `RAILWAY_TOKEN` = (the token)
- `RAILWAY_PROJECT_ID` = (the project ID)

### 1.2 Anthropic API Key

1. Go to https://console.anthropic.com/account/keys
2. Click **Create Key**
3. Copy the key (save it)

**You now have:**
- `ANTHROPIC_API_KEY` = (the key)

### 1.3 Vercel Domain

1. Go to Vercel Dashboard → Deployments
2. Look at the domain of the latest deployment
3. Copy it (should be like `xxx.vercel.app`)

**You now have:**
- `FRONTEND_URL` = `https://your-domain.vercel.app`

---

## STEP 2: Add GitHub Secrets (5 minutes)

1. Go to GitHub → Your Repository
2. Click **Settings** (top menu)
3. Left sidebar → **Secrets and variables** → **Actions**
4. Click **New repository secret**

**Add these 5 secrets one by one:**

### Secret 1
- Name: `RAILWAY_TOKEN`
- Value: (paste from step 1.1)
- Click **Add secret**

### Secret 2
- Name: `RAILWAY_PROJECT_ID`
- Value: (paste from step 1.1)
- Click **Add secret**

### Secret 3
- Name: `METALS_API_KEY`
- Value: `UWY1VV6WCDIKUEG1YNEP476G1YNEP`
- Click **Add secret**

### Secret 4
- Name: `ANTHROPIC_API_KEY`
- Value: (paste from step 1.2)
- Click **Add secret**

### Secret 5
- Name: `FRONTEND_URL`
- Value: (paste from step 1.3, e.g., `https://nsheera.vercel.app`)
- Click **Add secret**

**Verify:** Go to Secrets list → should see all 5 names listed

---

## STEP 3: Add Vercel Environment Variables (5 minutes)

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** (left sidebar)
3. Click **Environment Variables** (left menu)
4. **Delete any existing `VITE_*` variables** (if present)
5. Add these 3 variables:

### Variable 1
- Name: `VITE_RATES_BACKEND_URL`
- Value: `https://nsheera-rates-proxy-production.up.railway.app/api/rates`
- Scope: **Production** (must select from dropdown)
- Click **Add**

### Variable 2
- Name: `VITE_DESIGN_BACKEND_URL`
- Value: `https://nsheera-rates-proxy-production.up.railway.app/api/design/generate`
- Scope: **Production**
- Click **Add**

### Variable 3
- Name: `VITE_ASTRO_BACKEND_URL`
- Value: `https://nsheera-rates-proxy-production.up.railway.app/api/astro/suggest-stone`
- Scope: **Production**
- Click **Add**

**Verify:** All 3 should show in the list with Scope = "Production"

---

## STEP 4: Redeploy Vercel (3 minutes)

1. Go to **Deployments** tab
2. Click the **latest deployment** (top of list)
3. Click **⋮ (three dots)** → **Redeploy**
4. Wait for deployment to finish (green checkmark)

---

## STEP 5: Trigger Backend Deployment (2 minutes)

Pull latest code and push to trigger GitHub Actions:

```bash
git pull
git add .
git commit -m "Trigger CI/CD deployment"
git push
```

This triggers the `deploy-backend.yml` workflow which:
- Builds the Spring Boot JAR
- Deploys to Railway
- Sets environment variables on Railway

---

## STEP 6: Wait for Deployments to Complete (5-10 minutes)

### Check GitHub Actions
1. Go to **GitHub → Actions**
2. Click **Deploy Rates Proxy to Railway**
3. Watch the workflow run
4. Should turn **green** (success)
5. Check logs if it fails

### Check Railway Dashboard
1. Go to **Railway → Your Project → rates-proxy**
2. Click **Deployments**
3. Should see new deployment (green status)
4. Click it to verify no errors

### Check Vercel
1. Go to **Vercel Dashboard → Deployments**
2. Should see new deployment from your push
3. Should be **green** (success)

---

## STEP 7: Clear Browser & Test (2 minutes)

1. **Hard refresh browser:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear cache** (optional):
   - Ctrl+Shift+Delete → Clear browsing data
3. **Open your Vercel frontend**
4. **Go to Client Dashboard**
5. **Log in** (or create account if needed)
6. **Navigate to: Account → AI Design Studio** (or look in main nav)
7. **Enter a prompt:** "A gold ring with a pearl"
8. **Click: Generate Concept**

### Expected Result
✅ Should see design specs with:
- Title
- Description
- Suggested metal & purity
- Weight range
- Price estimate
- Design variations

### If Still Getting Error
- Check console (F12): `import.meta.env.VITE_DESIGN_BACKEND_URL` should NOT be undefined
- Check Network tab: should see POST request to `https://nsheera-rates-proxy-production.up.railway.app/api/design/generate`
- Run diagnostic in `QUICK_DIAGNOSTIC.md`

---

## Summary: What Each Secret/Var Does

### GitHub Secrets (Enable CI/CD)
- `RAILWAY_TOKEN` → Authenticates GitHub Actions to Railway
- `RAILWAY_PROJECT_ID` → Tells GitHub Actions which Railway project to deploy to
- `METALS_API_KEY` → Passed to backend (for live rate fetching)
- `ANTHROPIC_API_KEY` → Passed to backend (for AI design generation)
- `FRONTEND_URL` → Passed to backend (CORS access control)

### Vercel Env Vars (Tell Frontend Where Backend Is)
- `VITE_DESIGN_BACKEND_URL` → Frontend knows where to call for design generation
- `VITE_RATES_BACKEND_URL` → Frontend knows where to call for rates
- `VITE_ASTRO_BACKEND_URL` → Frontend knows where to call for astro suggestions

### Railway Env Vars (Backend Configuration)
- `METALS_API_KEY` → Backend uses this to call metals.dev API
- `ANTHROPIC_API_KEY` → Backend uses this to call Anthropic API
- `FRONTEND_ORIGIN` → Backend allows only this domain to call it (CORS)

---

## If Any Step Fails

### GitHub Actions Workflow Fails
1. Click the failed workflow in GitHub Actions
2. Check the error message in the logs
3. Most common: Missing secrets → go back to Step 2
4. Other issues: Check `QUICK_DIAGNOSTIC.md`

### Vercel Deployment Fails
1. Go to Vercel Deployments
2. Click failed deployment → View Logs
3. Look for error messages
4. Most common: Wrong env var scope → go back to Step 3

### Railway Deployment Fails
1. Go to Railway Dashboard → rates-proxy → Deployments
2. Click failed deployment → View Logs
3. Look for error messages
4. Most common: Missing ANTHROPIC_API_KEY → set it in Railway variables

### AI Design Still Not Working
1. Run tests in `QUICK_DIAGNOSTIC.md`
2. Check all 3 deployment statuses (GitHub, Vercel, Railway)
3. Hard refresh browser
4. Check browser console for actual error

---

## Expected Timeline

| Step | Time | Status |
|------|------|--------|
| Get API keys | 5 min | Manual |
| Add GitHub secrets | 5 min | Manual |
| Add Vercel env vars | 5 min | Manual |
| Redeploy Vercel | 3 min | Automatic |
| Push commit (trigger backend) | 2 min | Manual |
| GitHub Actions runs | 5 min | Automatic |
| Railway deploys | 3 min | Automatic |
| Vercel rebuilds | 2 min | Automatic |
| **TOTAL** | **~30 min** | |

---

## After Everything Works

You now have:
✅ **Frontend** auto-deploys on push to `main`
✅ **Backend** auto-deploys on push to `rates-proxy/`
✅ **CI/CD** fully automated
✅ **AI Design Studio** working end-to-end
✅ **Live rates** showing on storefront
✅ **Astrological suggestions** working

Every future commit automatically redeploys everything.

---

**Follow all 7 steps above. Should take ~30 minutes total. Then AI Design Studio will work!**
