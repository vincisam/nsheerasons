# AI Design Studio Fix

## Problem
Client dashboard showed: **"Could not reach the AI design service — check your connection and try again."**

## Root Cause
✅ Backend endpoint `/api/design/generate` was **fully implemented**  
✅ Spring Boot controller `DesignController.java` was **fully implemented**  
❌ Environment variable `ANTHROPIC_API_KEY` was **NOT set** on Railway

Result: Backend returned HTTP 503 with message "AI Design Studio is not configured on this server (missing ANTHROPIC_API_KEY)"

## Solution

### What Was Done
1. **Added `ANTHROPIC_API_KEY` to GitHub Actions workflow**
   - File: `.github/workflows/deploy-backend.yml`
   - Now passes `ANTHROPIC_API_KEY` from GitHub secrets to Railway deployment
   - Railway environment now includes: `METALS_API_KEY`, `ANTHROPIC_API_KEY`, `FRONTEND_ORIGIN`

2. **Updated documentation**
   - Added step to get Anthropic API key from console.anthropic.com
   - Updated `QUICKSTART.md` with new secret
   - Updated `GITHUB_SECRETS_SETUP.md` with detailed Anthropic key instructions

### What You Need to Do

**Add one more GitHub secret:**

Go to **GitHub → Settings → Secrets and variables → Actions** and add:

| Secret Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Get from [console.anthropic.com](https://console.anthropic.com) → API Keys → Create |

Then push to `main` to trigger the backend workflow redeploy.

## How It Works (After Setup)

```
User enters design prompt in Client Dashboard
                ↓
Frontend calls: POST https://nsheera-rates-proxy-production.up.railway.app/api/design/generate
                ↓
Backend (Spring Boot):
  1. Receives prompt and optional file block
  2. Reads ANTHROPIC_API_KEY from environment
  3. Calls Anthropic API (claude-sonnet-5)
  4. Gets back design specs JSON
  5. Optionally generates an image (if OPENAI_API_KEY set)
  6. Returns to frontend
                ↓
Frontend displays design concept with:
  • Title, description
  • Suggested metal, purity, weight
  • Estimated price range
  • Design variations (different budgets/options)
  • Optional image
```

## Backend Features Already Implemented

✅ **DesignController.java** — Receives POST requests at `/api/design/generate`  
✅ **DesignService.java** — Calls Anthropic API with system prompt for jewellery design  
✅ **Image generation** — Can optionally call OpenAI to create a visual concept (if `OPENAI_API_KEY` set)  
✅ **Error handling** — Falls back gracefully if Anthropic key is missing  
✅ **CORS configured** — Allows frontend domain via `FRONTEND_ORIGIN` env var  

The only thing missing was the **env var**. Now fixed.

## Testing

1. **Add `ANTHROPIC_API_KEY` secret to GitHub**
2. **Push to main** (or manually trigger deploy-backend.yml workflow)
3. **Wait ~5 minutes** for Railway redeploy
4. **Open Client Dashboard:** https://vincisam.github.io/nsheera/
5. **Test AI Design Studio:**
   - Log in
   - Go to Account → AI Design Studio tab
   - Enter: "A simple gold ring with a pearl"
   - Click Generate Concept
   - Should see design specs (title, materials, variations, etc.)

## If Still Getting 503

1. Check GitHub Actions log: did deploy-backend.yml run?
2. Check Railway dashboard: is the service green/live?
3. Check Railway logs: `railway logs` or dashboard Deployments tab
4. Verify env var was set: Railway → Service → Settings → Variables

## Optional: Image Generation

The backend can also generate a visual concept image. To enable:

1. Get OpenAI API key from https://platform.openai.com/account/api-keys
2. Add GitHub secret: `OPENAI_API_KEY` = (your key)
3. Update `.github/workflows/deploy-backend.yml` to include it
4. Design concepts will now include both text specs + image

This is optional — without it, design generation still works, just no image.

---

**Status:** ✅ AI Design endpoint is implemented. Just needs the Anthropic API key secret.
