# CRITICAL: Backend 405 Error - Likely Not Redeployed

## What the 405 Error Means

HTTP 405 = "Method Not Allowed" — The backend IS responding, but either:
1. Backend didn't redeploy after you added ANTHROPIC_API_KEY
2. Different endpoint version is deployed
3. CORS preflight failing

## What to Do NOW

### Step 1: Check Railway Deployment Status

1. Go to **Railway Dashboard → Your Project → rates-proxy**
2. Click **Deployments** tab
3. Check the latest deployment:
   - **Green** = running
   - **Yellow/Red** = still deploying or failed
4. If still deploying, **WAIT** for it to turn green (2-3 more minutes)

### Step 2: If Still Red/Yellow After 5 Minutes

1. Click the failed deployment
2. Click **View Logs**
3. Look for error messages
4. Common issues:
   - `ANTHROPIC_API_KEY not found` → env var not saved
   - `Build failed` → Java/Maven error
   - `Port already in use` → restart needed

### Step 3: Force Redeploy If Needed

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **⋮ (three dots)** → **Rerun Deployment**
4. Wait for green status

### Step 4: Test Again

Once deployment is green:
```powershell
# Simple health check
Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/health"

# If that works, try design endpoint
$body = '{"promptText":"test"}'
Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/design/generate" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

## Why You Got 405

Most likely: **Backend is still an OLD version** that doesn't have the design endpoint properly configured, OR the environment variable change hasn't been picked up yet.

---

**Check Railway Deployments tab RIGHT NOW. Is the latest deployment green or red/yellow?**
