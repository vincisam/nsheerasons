# 🚀 Add MongoDB URI to Railway - READY TO DEPLOY

## Your MongoDB Connection String

**Username:** `amarjeet1111_db_user`  
**Password:** `y6oQRO5he22Apicz`  
**Cluster:** `cluster0.wtem0dc.mongodb.net`

### Complete URI (Ready to Use):

```
mongodb+srv://amarjeet1111_db_user:y6oQRO5he22Apicz@cluster0.wtem0dc.mongodb.net/nsheera?appName=Cluster0&retryWrites=true&w=majority
```

---

## ADD TO RAILWAY NOW (60 SECONDS)

### Step 1: Go to Railway Dashboard

https://railway.app/dashboard

### Step 2: Select Your Project

Click **Your Project** → **rates-proxy** service

### Step 3: Open Settings → Variables

Click **Settings** (left menu or gear icon) → **Variables**

### Step 4: Add MongoDB Variables

**Variable 1 - MONGODB_URI:**
- Name: `MONGODB_URI`
- Value: 
```
mongodb+srv://amarjeet1111_db_user:y6oQRO5he22Apicz@cluster0.wtem0dc.mongodb.net/nsheera?appName=Cluster0&retryWrites=true&w=majority
```
- Click **Add**

**Variable 2 - MONGODB_DB:**
- Name: `MONGODB_DB`
- Value: `nsheera`
- Click **Add**

### Step 5: Save & Deploy

Click **Save** button → Railway auto-redeploys (~3-5 minutes)

---

## VERIFY IT WORKS

### Check Deployment Status

Go to **Deployments** tab on rates-proxy:
- 🟡 YELLOW = Building (wait 3-5 min)
- 🟢 GREEN = Ready ✅
- 🔴 RED = Failed (check logs)

### Test Backend Health

Once deployment is GREEN, run:

```powershell
Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/health" `
  -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Content
```

**Expected:** `{"status":"ok"}`

### Test Design Endpoint

```powershell
$body = '{"promptText":"A simple gold ring"}'
$response = Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/design/generate" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -ErrorAction SilentlyContinue

$response.Content
```

**Expected:** Design JSON with title, description, price, etc.

---

## THEN TEST FRONTEND

1. Hard refresh Vercel: **Ctrl+Shift+R**
2. Log in or sign up
3. Go to **Account → AI Design Studio**
4. Enter: "A gold ring with a pearl"
5. Click **Generate Concept**

Should see: ✅ Design specs with metal, weight, price, variations!

---

## All Variables Set on Railway

After this, you'll have:

| Variable | Value |
|----------|-------|
| MONGODB_URI | `mongodb+srv://amarjeet1111_db_user:y6oQRO5he22Apicz@...` |
| MONGODB_DB | `nsheera` |
| ANTHROPIC_API_KEY | (should already be set) |
| METALS_API_KEY | `UWY1VV6WCDIKUEG1YNEP476G1YNEP` |
| FRONTEND_ORIGIN | (your Vercel domain) |

---

**Do this RIGHT NOW and tell me when Railway deployment turns GREEN!** 🎯
