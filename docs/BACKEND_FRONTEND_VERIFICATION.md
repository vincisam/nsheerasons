# Backend ↔ Frontend Integration Verification

## ✅ Code Connection Verified

### 1. Frontend Build Status
- ✅ `npm run build` — SUCCESS (358.60 kB → 97.46 kB gzip)
- ✅ Frontend compiled with no errors

### 2. Backend URL Configuration

**File:** `src/App.jsx` (Line 406)
```javascript
const RATES_BACKEND_URL = import.meta.env.VITE_RATES_BACKEND_URL || '/api/rates';
```

**How it works:**
- In **GitHub Actions (production):** `VITE_RATES_BACKEND_URL` is injected from secrets → `https://nsheera-rates-proxy-production.up.railway.app/api/rates`
- In **Local dev**: Vite proxy (`localhost:5173` → `localhost:8080`) uses fallback `/api/rates`
- In **GitHub Pages (no secrets)**: Falls back to `/api/rates` (won't work without backend, but tries direct APIs as fallback)

### 3. Frontend Rate Fetching Logic

**File:** `src/App.jsx` (zt() function, line 421+)

The frontend tries rates sources in this order:

```
1. RATES_BACKEND_URL (/api/rates or injected URL)
   ↓ On success: Returns {spotGold24k, spotSilver, sourceName: "backend"}
   ↓ On failure: Try next...

2. metalpriceapi.com (direct API call)
   ↓ On failure: Try next...

3. metals.dev (direct API call)
   ↓ On failure: Try next...

4. gold-api.com (direct API call)
   ↓ On failure: Try next...

5. goldprice.org (direct API call)
   ↓ On failure: Try next...

6-8. Additional fallback APIs...

9. Hardcoded placeholder: {spotGold24k: 7500, spotSilver: 95}
```

### 4. Backend API Endpoint

**URL:** `https://nsheera-rates-proxy-production.up.railway.app/api/rates`

**Expected Response:**
```json
{
  "goldPerGram": 8123.45,
  "silverPerGram": 96.2,
  "source": "metals.dev",
  "lastUpdated": "2025-01-17T10:15:00Z"
}
```

**Health Check:** `https://nsheera-rates-proxy-production.up.railway.app/api/health`

### 5. Workflow Integration

**File:** `.github/workflows/deploy.yml`
```yaml
- name: Build
  run: npm run build
  env:
    VITE_RATES_BACKEND_URL: ${{ secrets.RATES_BACKEND_URL }}
```

✅ When `RATES_BACKEND_URL` secret is set, the frontend build bakes in the production backend URL.

## Testing Checklist

### Local Testing (Dev Server)
```bash
npm run dev
# Frontend: http://localhost:5173
# Vite proxies /api/* → http://localhost:8080 (your local backend)
```

### Production Testing (GitHub Pages + Railway)
1. **Frontend deployed:** https://vincisam.github.io/nsheera/
2. **Open Admin Panel** (password in App.jsx)
3. **Go to Rates tab** → **Refresh Live Rate**
4. **Check Diagnostics:**
   - Should show "backend" as the source (if RATES_BACKEND_URL is set)
   - Or show one of the direct APIs (metals.dev, gold-api.com, etc.)
   - Log shows all attempted sources and their status (✓ or ✗)

### Current Status Without GitHub Secrets

Since secrets aren't set yet:
- ✅ Frontend **builds successfully**
- ❌ Backend URL **not injected** (uses fallback `/api/rates`)
- ✅ Frontend **falls back to direct APIs** (metals.dev, gold-api.com, etc.)
- 🟡 Direct APIs **work** but API keys visible in page source

### After Adding GitHub Secrets

Once you add all 5 secrets to GitHub:
1. Push to `main` → frontend rebuilds with `VITE_RATES_BACKEND_URL` injected
2. Frontend will try `https://nsheera-rates-proxy-production.up.railway.app/api/rates` first
3. Backend keeps `METALS_API_KEY` server-side (secure)
4. Admin panel diagnostics show "backend" as the source

## Files Modified

| File | Change |
|------|--------|
| `src/App.jsx` | Line 406: Read `VITE_RATES_BACKEND_URL` env var |
| `.github/workflows/deploy.yml` | Inject `VITE_RATES_BACKEND_URL` during build |
| `.github/workflows/deploy-backend.yml` | NEW: Deploy backend to Railway |

## Next Steps

✅ Code integration complete
⏳ Waiting for GitHub secrets to be added

Once secrets are set:
1. Both workflows will auto-trigger
2. Frontend rebuilds with backend URL → GitHub Pages
3. Backend redeploys if changes pushed to `rates-proxy/` → Railway
4. Test: Admin Panel → Rates tab → Refresh → Check diagnostics

See `QUICKSTART.md` for exact steps to add secrets.
