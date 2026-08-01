# CRITICAL FIX: Vite Env Var Injection

## The Real Problem

Vercel's environment variables were NOT being passed to Vite's `import.meta.env` object because:
1. Vercel sets env vars in Node's `process.env`
2. But Vite needs them explicitly defined in the build config
3. `import.meta.env.VITE_*` requires Vite's `define` config

## The Solution (JUST PUSHED)

**Updated `vite.config.js`** to explicitly inject env vars:

```javascript
define: {
  'import.meta.env.VITE_DESIGN_BACKEND_URL': JSON.stringify(
    process.env.VITE_DESIGN_BACKEND_URL || 'https://nsheera-rates-proxy-production.up.railway.app/api/design/generate'
  ),
  // ... same for RATES and ASTRO
}
```

This ensures:
- ✅ Vercel env vars are read from `process.env`
- ✅ Baked into the bundle as constants
- ✅ Fallback to Railway defaults if not set
- ✅ Available in `import.meta.env` at runtime

## What Changed

**`vite.config.js` now has:**
- `define` section that explicitly injects `VITE_*` variables
- Reads from `process.env` (what Vercel sets)
- Converts to JSON strings for bundling
- Provides sensible fallbacks to Railway URLs

## What To Do NOW

1. **Pull latest code:**
```bash
git pull
```

2. **In Vercel Dashboard, make sure these are set:**
   - `VITE_DESIGN_BACKEND_URL` = `https://nsheera-rates-proxy-production.up.railway.app/api/design/generate`
   - `VITE_RATES_BACKEND_URL` = `https://nsheera-rates-proxy-production.up.railway.app/api/rates`
   - `VITE_ASTRO_BACKEND_URL` = `https://nsheera-rates-proxy-production.up.railway.app/api/astro/suggest-stone`
   - All with Scope = **Production**

3. **Redeploy Vercel:**
   - Deployments → Latest → ⋮ → Redeploy
   - Wait for green checkmark

4. **Hard refresh browser:**
   - Ctrl+Shift+R (or Cmd+Shift+R on Mac)

5. **Test:**
   - Client Dashboard → AI Design Studio
   - Enter: "A gold ring with a pearl"
   - Click Generate
   - Should now work!

## Why This Works

Before:
```
Vercel sets: process.env.VITE_DESIGN_BACKEND_URL = "https://..."
Frontend reads: import.meta.env.VITE_DESIGN_BACKEND_URL = undefined ❌
```

After:
```
Vercel sets: process.env.VITE_DESIGN_BACKEND_URL = "https://..."
Vite reads process.env and injects: import.meta.env.VITE_DESIGN_BACKEND_URL = "https://..." ✅
```

## Fallback Logic

Even if env vars not set in Vercel:
```javascript
// vite.config.js
process.env.VITE_DESIGN_BACKEND_URL || 'https://nsheera-rates-proxy-production.up.railway.app/api/design/generate'
//                     ↓ if not set           ↓ default to Railway URL
```

So if someone forgets to set env vars, it still works with Railway backend!

## Next Steps

1. Pull latest (`git pull`)
2. Verify env vars in Vercel are set
3. Redeploy Vercel
4. Hard refresh and test

**This SHOULD fix the issue.** If it doesn't, run the commands in `QUICK_DIAGNOSTIC.md` to find the remaining problem.
