# Vercel + Railway Backend Integration — CORRECTED

## The Real Problem

The `vercel.json` configuration was **wrong**. It was trying to reference env vars as secrets (with `@` prefix) which doesn't work.

## The Fix

### What Was Changed

**`vercel.json`** is now simplified:
- Removed the incorrect `env` section
- Vercel automatically injects environment variables from the dashboard at build time
- No special configuration needed

### What You Must Do

**In Vercel Dashboard:**

1. Go to **Settings → Environment Variables**
2. **Add these three variables** (exactly as shown):

| Name | Value | Scope |
|---|---|---|
| `VITE_RATES_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/rates` | **Production** |
| `VITE_DESIGN_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/design/generate` | **Production** |
| `VITE_ASTRO_BACKEND_URL` | `https://nsheera-rates-proxy-production.up.railway.app/api/astro/suggest-stone` | **Production** |

**CRITICAL:** Make sure the **Scope dropdown shows "Production"** for ALL THREE variables.

3. After adding all three, go to **Deployments**
4. Click the latest deployment
5. Click **⋮ (three dots) → Redeploy**
6. Wait for deployment to finish (green checkmark)
7. **Hard refresh browser:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Verify It Worked

Open browser **DevTools (F12) → Console** and run:

```javascript
console.log('DESIGN:', import.meta.env.VITE_DESIGN_BACKEND_URL)
console.log('RATES:', import.meta.env.VITE_RATES_BACKEND_URL)
```

Should show:
```
DESIGN: https://nsheera-rates-proxy-production.up.railway.app/api/design/generate
RATES: https://nsheera-rates-proxy-production.up.railway.app/api/rates
```

If they show `undefined`, the env vars are NOT being injected.

### If Still Showing Undefined After Redeploy

1. Go back to Vercel **Environment Variables**
2. Check the **Scope** column for each variable
   - Must say **"Production"**
   - If it says "Preview" or "Development", delete and re-add with correct scope
3. Redeploy again
4. Hard refresh browser

### If Showing the URLs But Still Getting Error

Then the backend isn't responding. Check:

```bash
# Test backend is alive
curl https://nsheera-rates-proxy-production.up.railway.app/api/health

# Test design endpoint
curl -X POST https://nsheera-rates-proxy-production.up.railway.app/api/design/generate \
  -H "Content-Type: application/json" \
  -d '{"promptText":"test"}'
```

If second command returns HTTP 503, the `ANTHROPIC_API_KEY` is not set on Railway (see `AI_DESIGN_STUDIO_FIX.md`).

## Why This Happened

- Vercel has two ways to pass env vars:
  1. **Environment Variables section** (standard, what we're using)
  2. **Secrets in vercel.json** (for sensitive values)
  
- The old `vercel.json` was trying to use secrets syntax for regular env vars
- This prevented the variables from being injected
- **Solution:** Remove the `env` section and rely on Vercel's standard injection

## Summary

✅ Code is correct  
✅ Backend is deployed  
❌ Env vars weren't being injected properly (FIXED in vercel.json)

**Next:** Make sure env vars are set in Vercel dashboard with Scope="Production", redeploy, hard refresh.

---

See `ACTION_PLAN.md` for quick step-by-step guide.
