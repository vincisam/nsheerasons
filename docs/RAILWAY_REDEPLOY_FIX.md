# Railway Deployment Failed - Recovery Steps

## Why It Failed (Most Likely)

When you added `ANTHROPIC_API_KEY` to Railway variables, it may have triggered a rebuild that failed because:
1. ANTHROPIC_API_KEY format wrong
2. Build system couldn't restart properly
3. Previous deployment state corrupted

## How to Fix

### Option 1: Manual Redeploy (Recommended)

1. Go to **Railway Dashboard → rates-proxy**
2. Click **Deployments** tab
3. Find the RED deployment
4. Click **⋮ (three dots)** on the right
5. Click **Rerun Deployment**
6. Wait for it to turn GREEN (~5 min)

### Option 2: Restart the Service

1. Go to **rates-proxy service**
2. Click **Settings**
3. Scroll down to **Danger Zone**
4. Click **Redeploy**
5. Wait for GREEN

### Option 3: Check Variables Are Set Correctly

1. Go to **rates-proxy → Settings → Variables**
2. Verify these are set:
   - `ANTHROPIC_API_KEY` = your key (should start with `sk-` or similar)
   - `METALS_API_KEY` = `UWY1VV6WCDIKUEG1YNEP476G1YNEP`
   - `FRONTEND_ORIGIN` = your Vercel domain
3. If any are missing or wrong, fix them
4. Click **Save** (auto-triggers redeploy)

### Option 4: Full Reset

If Redeploy keeps failing:

1. Delete the failed deployment (if option exists)
2. Go to **rates-proxy → Settings → Danger Zone → Delete Service**
3. In GitHub, push a new commit to `rates-proxy/`:
   ```bash
   git add rates-proxy/
   git commit -m "Trigger fresh Railway deploy"
   git push
   ```
4. Railway auto-redeploys from GitHub

## What to Do

**Pick ONE:**
1. Try **Rerun Deployment** first (easiest)
2. If that fails, try **Redeploy** from Settings
3. If both fail, send me the error message from the logs

Once it's GREEN, test:
```powershell
Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/health"
```

Should return: `{"status":"ok"}`

---

**Try Rerun Deployment first. Then let me know if it turns GREEN.**
