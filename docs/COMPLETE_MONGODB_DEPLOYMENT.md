# 🚀 Complete MongoDB + Backend Deployment Guide

## Overview

You now have:
- ✅ Spring Boot backend with MongoDB integration
- ✅ MongoDB Atlas cluster ready
- ❌ MONGODB_URI not set on Railway yet

## Complete Setup (5 Steps)

### Step 1: Get MongoDB Password

1. Go to https://cloud.mongodb.com → Sign in
2. Left menu → **Database Access**
3. Find user `amarjeet1111_db_user`
4. Click **Edit** (pencil icon)
5. Click **Show** next to password
6. Copy the password (or reset if needed)

### Step 2: Build Complete Connection String

Your base string:
```
mongodb+srv://amarjeet1111_db_user:<PASSWORD>@cluster0.wtem0dc.mongodb.net/?appName=Cluster0
```

Replace `<PASSWORD>` with your actual password, then add database:
```
mongodb+srv://amarjeet1111_db_user:<PASSWORD>@cluster0.wtem0dc.mongodb.net/nsheera?appName=Cluster0&retryWrites=true&w=majority
```

Example: `mongodb+srv://amarjeet1111_db_user:MyPassword123!@cluster0.wtem0dc.mongodb.net/nsheera?appName=Cluster0&retryWrites=true&w=majority`

### Step 3: Add to Railway Variables

1. Go to **https://railway.app/dashboard**
2. Your Project → **rates-proxy** service
3. Click **Settings** tab
4. Click **Variables**
5. Add these:

| Name | Value |
|------|-------|
| `MONGODB_URI` | (your complete connection string with password) |
| `MONGODB_DB` | `nsheera` |
| `ANTHROPIC_API_KEY` | (your Anthropic key) |
| `METALS_API_KEY` | `UWY1VV6WCDIKUEG1YNEP476G1YNEP` |
| `FRONTEND_ORIGIN` | (your Vercel domain) |

6. Click **Save** → Railway auto-redeploys

### Step 4: Wait for Deployment

Check **Deployments tab**:
- 🟡 YELLOW = Building (2-3 min)
- 🟢 GREEN = Ready
- 🔴 RED = Failed

If RED, click deployment to see logs.

### Step 5: Verify Everything Works

```powershell
# Test 1: Health check
Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/health" `
  -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Content

# Expected: {"status":"ok"}

# Test 2: Try design endpoint
$body = '{"promptText":"A gold ring"}'
Invoke-WebRequest -Uri "https://nsheera-rates-proxy-production.up.railway.app/api/design/generate" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Content

# Should return design JSON (or valid error message)
```

## Frontend Test

Once backend is working:

1. Hard refresh Vercel: **Ctrl+Shift+R**
2. Log in → Account → **AI Design Studio**
3. Enter: "A gold ring with a pearl"
4. Click **Generate Concept**

Should see design specs! ✅

## MongoDB Collections Created Automatically

Spring Data MongoDB will create these collections on first use:
- `products` — Jewellery items
- `orders` — Customer orders
- `inquiries` — Customer inquiries
- `rates` — Gold/silver prices

## Troubleshooting

### MongoDB Connection Error
**Error:** "Cannot connect to MongoDB"
- Check MONGODB_URI is correct (with password)
- Verify MongoDB Atlas cluster is running
- Check Network Access in MongoDB Atlas (should allow 0.0.0.0/0)

### Backend Returns 503
**Error:** "AI Design Studio is not configured"
- ANTHROPIC_API_KEY is not set on Railway
- Solution: Add ANTHROPIC_API_KEY to Railway variables

### Connection Timeout
- MongoDB Atlas cluster might be paused
- Solution: Go to MongoDB Atlas → Clusters → Resume cluster

---

## What's Next After Deploy

Once everything is GREEN and working:

1. ✅ Frontend working on Vercel
2. ✅ Backend working on Railway with MongoDB
3. ✅ AI Design Studio generating designs
4. ✅ All data stored in MongoDB Atlas

From here you can:
- Add more API endpoints
- Create admin dashboard to manage products
- Store orders/inquiries in MongoDB
- Add customer authentication

---

**Do all 5 steps above and let me know when you've added MONGODB_URI to Railway!**
