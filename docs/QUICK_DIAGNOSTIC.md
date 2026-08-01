# Quick Diagnostic: AI Design Service Not Working

Run these commands in your terminal to diagnose the issue:

## Test 1: Is Backend Alive?
```bash
curl https://nsheera-rates-proxy-production.up.railway.app/api/health
```
**Expected:** `{"status":"ok"}`  
**If fails:** Backend is down → Check Railway dashboard

## Test 2: Does Design Endpoint Exist?
```bash
curl -X POST https://nsheera-rates-proxy-production.up.railway.app/api/design/generate \
  -H "Content-Type: application/json" \
  -d '{"promptText":"test"}'
```
**Expected:** 
- HTTP 200 with JSON = Backend working ✓
- HTTP 503 = ANTHROPIC_API_KEY not set on Railway ✗
- HTTP 404 = Endpoint missing ✗

## Test 3: Check Vercel Build Logs
1. Go to **Vercel Dashboard → Deployments**
2. Click latest deployment
3. Click **View Logs** (or Logs tab)
4. Search for: `VITE_DESIGN_BACKEND_URL`
5. **Should see it listed** with the full Railway URL
6. If NOT shown → Env vars not injected

## Test 4: Check Frontend Env Vars
1. Open your Vercel frontend
2. Press **F12** → **Console**
3. Paste:
```javascript
console.log('Design URL:', import.meta.env.VITE_DESIGN_BACKEND_URL)
console.log('Rates URL:', import.meta.env.VITE_RATES_BACKEND_URL)
```
**Expected:** Shows full Railway URLs  
**If undefined:** Env vars not being injected to build

## Test 5: Check Vercel Environment Variables
1. Go to **Vercel Dashboard → Settings → Environment Variables**
2. Look at **Scope** column for each `VITE_*` variable
3. **Should all say "Production"**
4. If any say "Preview" or "Development" → Delete and re-add

---

## Most Likely Issues (In Order)

### Issue 1: Env Vars Have Wrong Scope
**Symptom:** Console shows `undefined` for VITE_* vars

**Fix:**
1. Vercel → Settings → Environment Variables
2. Delete all three `VITE_*` variables
3. Re-add them one by one with **Scope = Production**
4. Redeploy
5. Hard refresh browser (Ctrl+Shift+R)

### Issue 2: ANTHROPIC_API_KEY Not Set on Railway
**Symptom:** Console shows URLs, but still getting error

**Fix:**
1. Railway Dashboard → rates-proxy service → Settings → Variables
2. Add `ANTHROPIC_API_KEY` = (your key from console.anthropic.com)
3. Wait for Railway to redeploy (green status)
4. Test backend: `curl` command above
5. Refresh Vercel frontend

### Issue 3: Backend Not Redeployed After Env Vars Set
**Symptom:** Everything set but backend still returns 503

**Fix:**
1. Railway Dashboard → rates-proxy → Deployments
2. Click latest deployment → **⋮ → Redeploy**
3. Wait for green status
4. Test again

### Issue 4: Vercel Not Redeployed After Env Vars Added
**Symptom:** Env vars set but frontend still shows undefined

**Fix:**
1. Vercel Dashboard → Deployments
2. Click latest deployment → **⋮ → Redeploy**
3. Wait for green status
4. Hard refresh browser (Ctrl+Shift+R)

---

## Do This Now (In Order)

1. [ ] Run the 5 curl/console tests above
2. [ ] Check what each test returns
3. [ ] Based on results, apply the fix from "Most Likely Issues" above
4. [ ] Re-test
5. [ ] Report results

**Send me the output from the curl commands and console logs**
