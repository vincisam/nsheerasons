# Immediate Action Plan: Fix AI Design Service Error

## Your Next Steps (In This Order)

### Step 1: Check Browser Console (2 minutes)

1. Open your Vercel frontend in **Chrome/Safari/Firefox**
2. Press **F12** to open DevTools
3. Click **Console** tab
4. Paste this:
```javascript
console.log('VITE_DESIGN_BACKEND_URL:', import.meta.env.VITE_DESIGN_BACKEND_URL)
console.log('VITE_RATES_BACKEND_URL:', import.meta.env.VITE_RATES_BACKEND_URL)
```
5. Press Enter

**What to look for:**
- ✅ If you see `https://nsheera-rates-proxy-production.up.railway.app/...` → Env vars are injected correctly
- ❌ If you see `undefined` → Env vars NOT injected (fix: re-add to Vercel)
- ❌ If you see `/api/design/generate` → Using fallback (env vars not injected)

### Step 2: If Both Show Undefined: Re-Add Env Vars to Vercel

1. Go to **Vercel Dashboard** → Your project → **Settings**
2. Left sidebar → **Environment Variables**
3. **DELETE** all three `VITE_*` variables
4. **ADD them back one by one:**

   **First variable:**
   - Name: `VITE_RATES_BACKEND_URL`
   - Value: `https://nsheera-rates-proxy-production.up.railway.app/api/rates`
   - Scope: **Production** (IMPORTANT - make sure this is selected, not Preview)
   - Click **Save**

   **Second variable:**
   - Name: `VITE_DESIGN_BACKEND_URL`
   - Value: `https://nsheera-rates-proxy-production.up.railway.app/api/design/generate`
   - Scope: **Production**
   - Click **Save**

   **Third variable:**
   - Name: `VITE_ASTRO_BACKEND_URL`
   - Value: `https://nsheera-rates-proxy-production.up.railway.app/api/astro/suggest-stone`
   - Scope: **Production**
   - Click **Save**

5. Go to **Deployments** tab
6. Find the latest deployment (top of list)
7. Click the **⋮ (three dots)** → **Redeploy**
8. Wait for it to turn **green** (deployment complete)
9. **Hard refresh** your browser: **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac)
10. Repeat Step 1 (check console) — now should show the URLs

### Step 3: If URLs Show Correctly But Still Getting Error

**Verify backend is alive:**

Open terminal/command prompt and run:
```bash
curl https://nsheera-rates-proxy-production.up.railway.app/api/health
```

**Expected output:**
```json
{"status":"ok"}
```

If you get that, then run:
```bash
curl -X POST https://nsheera-rates-proxy-production.up.railway.app/api/design/generate \
  -H "Content-Type: application/json" \
  -d '{"promptText":"test"}'
```

**What to look for:**
- ✅ If you see `{"title": ...` → Backend working perfectly
- ❌ If you see `"AI Design Studio is not configured"` → `ANTHROPIC_API_KEY` not set on Railway
- ❌ If you see error message → Check Railway backend

### Step 4: If Backend Says "Not Configured"

**ANTHROPIC_API_KEY is missing on Railway:**

1. Go to **Railway Dashboard** → Your project
2. Click **rates-proxy** service
3. Click **Settings** → **Variables**
4. **ADD:**
   - Name: `ANTHROPIC_API_KEY`
   - Value: (Get from [console.anthropic.com](https://console.anthropic.com) → API Keys → Create new key, copy it)
   - Click **Save**
5. Railway will auto-redeploy (~2 minutes)
6. Wait for green status
7. Test frontend again

### Step 5: Clear Everything and Redeploy (If Still Stuck)

```bash
# In terminal:

# 1. Clear Vercel cache
# (Just go to Vercel Deployments and manually Redeploy the latest)

# 2. Test everything again
curl https://nsheera-rates-proxy-production.up.railway.app/api/health

# 3. In browser:
# F12 → Console → Check VITE_* vars again
# Hard refresh: Ctrl+Shift+R
# Try AI Design Studio
```

## Flowchart

```
Error: "Could not reach AI design service"
│
├─→ Check console: VITE_DESIGN_BACKEND_URL
│   │
│   ├─→ Shows undefined
│   │   └─→ Re-add env vars to Vercel (Step 2)
│   │       └─→ Make sure Scope is "Production"
│   │           └─→ Redeploy
│   │
│   └─→ Shows https://nsheera...
│       └─→ Test backend curl command
│           │
│           ├─→ curl /api/health → OK
│           │   └─→ curl /api/design/generate returns 503
│           │       └─→ Set ANTHROPIC_API_KEY on Railway (Step 4)
│           │
│           ├─→ curl /api/health → FAILS
│           │   └─→ Backend is down
│           │       └─→ Check Railway dashboard
│           │
│           └─→ curl /api/design/generate returns 200
│               └─→ Everything working!
│                   └─→ Check browser network tab for actual error
```

## Most Common Fix

**90% of the time, the issue is:**
1. Env vars have Scope = "Preview" instead of "Production"
2. Or env vars weren't actually saved

**Quick fix:**
1. Delete all three `VITE_*` variables from Vercel
2. Re-add them one by one
3. **Make absolutely sure Scope = "Production" before clicking Save**
4. Redeploy
5. Hard refresh browser

---

**Do this now → report back with:**
- What console shows for VITE_DESIGN_BACKEND_URL
- What curl commands return
- Whether error goes away

See `VERCEL_DEBUG_GUIDE.md` for more detailed troubleshooting.
