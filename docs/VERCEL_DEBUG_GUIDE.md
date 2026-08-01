# Vercel AI Design Service Error — Debugging Guide

## Symptom
Even after adding env vars to Vercel and redeploying, client dashboard shows:
**"Could not reach the AI design service — check your connection and try again."**

## Debugging Checklist

### Step 1: Verify Env Vars Were Injected Into Build

**Check if the build actually embedded the backend URLs:**

1. Open your Vercel frontend in browser
2. Open **DevTools → Console**
3. Run this command:
```javascript
console.log(import.meta.env.VITE_DESIGN_BACKEND_URL)
```
4. **Expected:** Should show `https://nsheera-rates-proxy-production.up.railway.app/api/design/generate`
5. **If empty or undefined:** Env vars didn't inject. See "Fix" below.

### Step 2: Check Network Requests

1. Open **DevTools → Network tab**
2. Go to AI Design Studio and try to generate a concept
3. Look for requests to:
   - `/api/design/generate` (local/dev)
   - `https://nsheera-rates-proxy...` (production with env var)
   - `https://api.anthropic.com` (fallback)

**What to look for:**
- ✅ If `nsheera-rates-proxy...` shows **200 OK** → backend working
- ❌ If `nsheera-rates-proxy...` shows **503** → backend not configured (ANTHROPIC_API_KEY missing)
- ❌ If `/api/design/generate` shows **404** → env var not injected
- ❌ If `api.anthropic.com` shows **CORS error** → fallback is breaking (normal, expected)

### Step 3: Test Backend Directly

**Verify the backend is actually alive and has the key:**

```bash
# In your terminal:
curl https://nsheera-rates-proxy-production.up.railway.app/api/health

# Expected response:
{"status":"ok"}
```

If that works, try:
```bash
curl -X POST https://nsheera-rates-proxy-production.up.railway.app/api/design/generate \
  -H "Content-Type: application/json" \
  -d '{"promptText":"A gold ring with a pearl"}'

# Expected: Either a design concept JSON or HTTP 503 (key not set)
# NOT expected: 404, 502, timeout
```

### Step 4: Check Vercel Build Logs

1. Go to **Vercel Dashboard → Deployments**
2. Click the latest deployment
3. Click **View Logs** (or Logs tab)
4. Search for `VITE_DESIGN_BACKEND_URL` or `Environment Variables`
5. **Should show** the three VITE_* env vars being set at build time

**If NOT shown:**
- Env vars may not be saved properly in Vercel Settings
- Go back and re-add them

### Step 5: Check Railway Backend Status

1. Go to **Railway Dashboard → Your Project → rates-proxy service**
2. Click **Deployments**
3. Check the latest deployment:
   - Should be **green** (running)
   - Click it and check **logs** for errors

4. Go to **Settings → Variables**
5. Verify **ANTHROPIC_API_KEY** is set (it will show as masked)
   - If blank or missing, see "Common Causes" below

## Common Causes & Fixes

### Cause 1: Env Vars Not Saved in Vercel

**Symptom:** DevTools shows `VITE_DESIGN_BACKEND_URL = undefined`

**Fix:**
1. Vercel Dashboard → Your project → **Settings**
2. Click **Environment Variables** (left sidebar)
3. Delete the three `VITE_*` variables
4. **Re-add them one by one:**
   - Name: `VITE_RATES_BACKEND_URL`
   - Value: `https://nsheera-rates-proxy-production.up.railway.app/api/rates`
   - Scope: **Production** (select explicitly)
   - Click **Save**
   
   (Repeat for `VITE_DESIGN_BACKEND_URL` and `VITE_ASTRO_BACKEND_URL`)

5. Go to **Deployments** → **Redeploy** latest commit
6. Wait for new deployment to finish (green checkmark)
7. Hard refresh browser: **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac)
8. Test again

### Cause 2: ANTHROPIC_API_KEY Not Set on Railway

**Symptom:** Backend responds with HTTP 503: "AI Design Studio is not configured"

**Fix:**
1. Go to **Railway Dashboard → Your Project → rates-proxy service**
2. Click **Settings → Variables**
3. Look for `ANTHROPIC_API_KEY`
4. If missing or empty:
   - Get your key from [console.anthropic.com](https://console.anthropic.com) → API Keys → Create
   - Add to Railway:
     - Name: `ANTHROPIC_API_KEY`
     - Value: (your actual key from Anthropic)
   - Click **Save** and let Railway redeploy (~2 min)
5. Test backend health:
```bash
curl https://nsheera-rates-proxy-production.up.railway.app/api/health
# Should show: {"status":"ok"}
```

### Cause 3: Vercel Cached Old Build

**Symptom:** Env vars are set but console still shows undefined

**Fix:**
1. Go to **Vercel Dashboard → Deployments**
2. Click the problematic deployment
3. Click **⋮ (more)** → **Redeploy**
4. Wait for new deployment (green checkmark)
5. **Clear browser cache:**
   - **Chrome:** Ctrl+Shift+Delete → Clear browsing data
   - **Safari:** Cmd+Y → Clear History
   - Or just hard refresh: **Ctrl+Shift+R**
6. Visit frontend and test again

### Cause 4: Vercel Env Var Scope Wrong

**Symptom:** Env vars exist but only in Preview scope, not Production

**Fix:**
1. Vercel → Your project → **Settings → Environment Variables**
2. For each `VITE_*` variable:
   - Click the variable
   - Change **Scope** to **Production** (if showing Preview)
   - Click **Save**
3. Redeploy

### Cause 5: Frontend Still Has Fallback Logic

**Symptom:** Frontend tries backend, gets error, falls back to direct Anthropic API (which fails due to CORS)

**Expected behavior:** If backend is down, frontend falls back gracefully without crashing the whole page. But the error message shown is the fallback error.

**This is actually OK** — the frontend is working as designed. But if you want AI Design to work, you need the backend to be live.

**Check:**
```javascript
// In browser console:
import.meta.env.VITE_DESIGN_BACKEND_URL
// Should return the Railway URL, not undefined
```

## Full Diagnostic Command (Do All These)

```bash
# 1. Test backend is reachable
curl https://nsheera-rates-proxy-production.up.railway.app/api/health

# 2. Test design endpoint exists and rejects (gives 503, not 404)
curl -X POST https://nsheera-rates-proxy-production.up.railway.app/api/design/generate \
  -H "Content-Type: application/json" \
  -d '{"promptText":"test"}' -v

# 3. Check if returns 503 (key missing) or 200 (key present) or 500 (error)
# 503 = key not set on Railway
# 200 = working!
# 500 = Anthropic API error (key exists but invalid or quota exceeded)
# 404 = endpoint doesn't exist
```

## If All Else Fails: Reset Everything

1. **Vercel:**
   - Remove all three `VITE_*` env vars
   - Redeploy
   - Add them back one by one
   - Redeploy again
   - Clear browser cache

2. **Railway:**
   - Verify `ANTHROPIC_API_KEY` is set
   - Check service is running (green status)
   - View logs for errors
   - Manually redeploy if needed (Deployments → ⋮ → Redeploy)

3. **Browser:**
   - Clear all cache: Ctrl+Shift+Delete
   - Close all tabs with your site
   - Reopen in private/incognito window
   - Test again

## Getting Help

If still stuck, provide:
1. Output of: `console.log(import.meta.env.VITE_DESIGN_BACKEND_URL)` from browser
2. Network tab showing the actual request (screenshot)
3. Vercel build logs (screenshot)
4. Output of: `curl https://nsheera-rates-proxy-production.up.railway.app/api/health`
5. Railway service status (green or red?)
6. Railway variables showing `ANTHROPIC_API_KEY` is set (masked is fine)

---

**Most common fix:** Re-add the three env vars to Vercel, make sure Scope is "Production", redeploy, hard refresh browser.
