# FINAL COMPREHENSIVE SETUP CHECKLIST

## The Issue: AI Design Service Error on Vercel

**Root cause:** Combination of configuration issues:
1. ❌ `vercel.json` had wrong env var syntax (FIXED in latest push)
2. ❌ Vercel env vars may not be set with correct scope
3. ❌ `ANTHROPIC_API_KEY` may not be set on Railway

## Complete Setup (Do Everything Below)

### PART 1: Backend Setup (Railway)

**Goal:** Ensure backend is live and has all required keys

#### Step 1.1: Get API Keys
- [ ] Anthropic API Key: Go to https://console.anthropic.com → API Keys → Create new key
  - Copy the key (won't be shown again)

#### Step 1.2: Set Backend Environment Variables
- [ ] Go to **Railway Dashboard → Your Project → rates-proxy service**
- [ ] Click **Settings → Variables**
- [ ] Add/Update these three:

```
METALS_API_KEY = UWY1VV6WCDIKUEG1YNEP476G1YNEP
ANTHROPIC_API_KEY = (your Anthropic key from step 1.1)
FRONTEND_ORIGIN = https://your-vercel-domain.vercel.app
```

(Replace `your-vercel-domain` with your actual Vercel domain)

- [ ] Click **Save** (Railway auto-redeploys)
- [ ] Wait for green status in **Deployments** tab (~2 min)

#### Step 1.3: Verify Backend Is Live
```bash
curl https://nsheera-rates-proxy-production.up.railway.app/api/health
# Should return: {"status":"ok"}
```

### PART 2: Frontend Setup (Vercel)

**Goal:** Inject backend URLs into Vercel build

#### Step 2.1: Pull Latest Code
```bash
git pull
```
(This gets the fixed `vercel.json`)

#### Step 2.2: Set Vercel Environment Variables
- [ ] Go to **Vercel Dashboard → Your Project → Settings**
- [ ] Click **Environment Variables** (left sidebar)
- [ ] **Delete all existing VITE_* variables** (if any)
- [ ] **Add three NEW variables** (one at a time):

**Variable 1:**
- Name: `VITE_RATES_BACKEND_URL`
- Value: `https://nsheera-rates-proxy-production.up.railway.app/api/rates`
- Scope: **Production** (IMPORTANT - must select from dropdown)
- Click **Save** ✓

**Variable 2:**
- Name: `VITE_DESIGN_BACKEND_URL`
- Value: `https://nsheera-rates-proxy-production.up.railway.app/api/design/generate`
- Scope: **Production**
- Click **Save** ✓

**Variable 3:**
- Name: `VITE_ASTRO_BACKEND_URL`
- Value: `https://nsheera-rates-proxy-production.up.railway.app/api/astro/suggest-stone`
- Scope: **Production**
- Click **Save** ✓

#### Step 2.3: Verify Variables Are Set
- [ ] Go back to **Environment Variables**
- [ ] Check the **Scope** column for all three variables
  - Should all say **"Production"**
  - If any say "Preview" or "Development", delete and re-add

#### Step 2.4: Redeploy Frontend
- [ ] Go to **Deployments** tab
- [ ] Click the latest deployment (top of list)
- [ ] Click **⋮ (three dots)** → **Redeploy**
- [ ] Wait for green checkmark (deployment complete)

#### Step 2.5: Verify Env Vars Were Injected
- [ ] Open your Vercel frontend
- [ ] Press **F12** → **Console**
- [ ] Paste this:
```javascript
console.log('DESIGN:', import.meta.env.VITE_DESIGN_BACKEND_URL)
console.log('RATES:', import.meta.env.VITE_RATES_BACKEND_URL)
```
- [ ] Should show:
```
DESIGN: https://nsheera-rates-proxy-production.up.railway.app/api/design/generate
RATES: https://nsheera-rates-proxy-production.up.railway.app/api/rates
```
- [ ] **If undefined**, go back to Step 2.2 (env vars not injected, check scope)

#### Step 2.6: Clear Browser Cache
- [ ] Hard refresh: **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac)
- [ ] Or clear cache: **Ctrl+Shift+Delete** → Clear browsing data

### PART 3: Test AI Design Service

**Goal:** Verify everything is wired together

#### Step 3.1: Test Frontend
- [ ] Open your Vercel frontend
- [ ] Navigate to **Client Dashboard**
- [ ] Log in (or create account)
- [ ] Go to **Account tab → AI Design Studio** (or look for it in main nav)

#### Step 3.2: Generate a Design Concept
- [ ] Enter a prompt: `"A simple gold ring with a pearl"`
- [ ] Click **Generate Concept**
- [ ] **Success:** Should see design specs (title, metal, purity, weight, variations)
- [ ] **Error:** "Could not reach the AI design service" → Go to Step 3.3

#### Step 3.3: Debugging (If Still Getting Error)

**Check 1: Backend is alive**
```bash
curl https://nsheera-rates-proxy-production.up.railway.app/api/health
# Expected: {"status":"ok"}
```

**Check 2: Design endpoint responds**
```bash
curl -X POST https://nsheera-rates-proxy-production.up.railway.app/api/design/generate \
  -H "Content-Type: application/json" \
  -d '{"promptText":"test"}'
  
# If returns 503: ANTHROPIC_API_KEY not set (go to Step 1.2)
# If returns 200 with JSON: Backend working, check frontend env vars (Step 2.5)
```

**Check 3: Frontend console**
- Press F12 → Console
- Run:
```javascript
import.meta.env.VITE_DESIGN_BACKEND_URL
```
- Should NOT be undefined
- If undefined, env vars didn't inject (check Vercel variables scope = "Production")

## Checklist Summary

- [ ] GitHub code pulled (latest `vercel.json`)
- [ ] `ANTHROPIC_API_KEY` set on Railway
- [ ] `FRONTEND_ORIGIN` set on Railway
- [ ] `METALS_API_KEY` set on Railway
- [ ] Three `VITE_*` variables added to Vercel
- [ ] All three Vercel variables have Scope = "Production"
- [ ] Vercel redeployed (green checkmark in Deployments)
- [ ] Browser hard-refreshed (Ctrl+Shift+R)
- [ ] Console shows `VITE_DESIGN_BACKEND_URL` = the full URL (not undefined)
- [ ] AI Design Studio generates a concept successfully

## If Any Step Fails

**For Railway issues:**
- Check Dashboard → rates-proxy → Deployments → Latest → View Logs
- Verify variables are actually saved (Settin gs → Variables)
- Manually trigger redeploy: Deployments → ⋮ → Redeploy

**For Vercel issues:**
- Check Dashboard → Deployments → Latest → View Logs
- Verify Scope = "Production" for all three variables
- Try deleting and re-adding variables

**For connection issues:**
- Make sure `FRONTEND_ORIGIN` on Railway matches your Vercel domain
- Test curl commands to verify backend responds
- Check browser Network tab while generating design

---

**Complete all steps above, then report if any errors remain.**
