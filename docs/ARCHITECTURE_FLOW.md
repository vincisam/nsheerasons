# Architecture: Frontend ↔ Backend Flow

## Production Flow (After GitHub Secrets Added)

```
┌─────────────────────────────────────────────────────────────────┐
│                    GITHUB REPOSITORY                             │
│                   vincisam/nsheera                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ .github/workflows/                                       │   │
│  │                                                           │   │
│  │  deploy.yml (Frontend)                                  │   │
│  │  ├─ Trigger: push to main                               │   │
│  │  ├─ Build: npm run build                                │   │
│  │  ├─ Inject env: VITE_RATES_BACKEND_URL                 │   │
│  │  └─ Deploy: dist/ → GitHub Pages                        │   │
│  │                                                           │   │
│  │  deploy-backend.yml (Backend)                           │   │
│  │  ├─ Trigger: push to rates-proxy/                       │   │
│  │  ├─ Build: mvn package                                  │   │
│  │  ├─ Deploy: jar → Railway                               │   │
│  │  └─ Env: METALS_API_KEY, FRONTEND_ORIGIN               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ GitHub Secrets (encrypted)                               │   │
│  │ ├─ RAILWAY_TOKEN                                         │   │
│  │ ├─ RAILWAY_PROJECT_ID                                   │   │
│  │ ├─ METALS_API_KEY                                       │   │
│  │ ├─ FRONTEND_URL                                         │   │
│  │ └─ RATES_BACKEND_URL                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────────┐
        │      DEPLOYMENT TARGETS                 │
        │                                         │
        │  ┌──────────────────────────────────┐  │
        │  │  GITHUB PAGES                    │  │
        │  │  https://vincisam.github.io/    │  │
        │  │  nsheera/                        │  │
        │  │                                  │  │
        │  │  Frontend (React + Vite)        │  │
        │  │  - JavaScript bundle (97 KB)    │  │
        │  │  - Assets (images, etc.)        │  │
        │  │  - With backend URL baked in    │  │
        │  └──────────────────────────────────┘  │
        │                                         │
        │  ┌──────────────────────────────────┐  │
        │  │  RAILWAY                         │  │
        │  │  nsheera-rates-proxy-production  │  │
        │  │  .up.railway.app                 │  │
        │  │                                  │  │
        │  │  Backend (Spring Boot)          │  │
        │  │  - rates-proxy JAR              │  │
        │  │  - /api/rates endpoint          │  │
        │  │  - /api/health endpoint         │  │
        │  │  - METALS_API_KEY (server-side) │  │
        │  └──────────────────────────────────┘  │
        └─────────────────────────────────────────┘
```

## Runtime Flow (User Opens App)

```
User visits: https://vincisam.github.io/nsheera/

┌──────────────────────────────────────────────────────────────┐
│ Browser loads index.html + compiled JavaScript               │
│                                                               │
│ App.jsx initializes:                                         │
│  RATES_BACKEND_URL = import.meta.env.VITE_RATES_BACKEND_URL │
│                   || '/api/rates'                            │
└──────────────────────────────────────────────────────────────┘
                              ↓
User clicks "Refresh Live Rate" in Admin → Rates Panel
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend calls: zt() (fetchLiveRates)                        │
│                                                               │
│ Tries sources in order:                                      │
│                                                               │
│ 1. fetch(RATES_BACKEND_URL)                                  │
│    └─→ https://nsheera-rates-proxy-production.up.railway.app/
│        api/rates                                             │
│        ↓                                                     │
│        Backend receives request                              │
│        ↓                                                     │
│        Backend calls metals.dev with METALS_API_KEY          │
│        (key is server-side, never exposed to browser)        │
│        ↓                                                     │
│        Backend returns: {goldPerGram, silverPerGram, ...}   │
│        ↓                                                     │
│        Frontend displays rates                               │
│        ✓ Diagnostics show: "backend (metals.dev)"           │
│                                                               │
│ IF backend fails:                                            │
│                                                               │
│ 2. fetch('https://api.metalpriceapi.com/...')              │
│ 3. fetch('https://api.metals.dev/...')                      │
│ 4. fetch('https://api.gold-api.com/...')                    │
│ 5. ... and so on ...                                        │
│                                                               │
│ ✓ All successful, displays best available rate              │
│ ✓ Diagnostics show which source(s) worked                   │
└──────────────────────────────────────────────────────────────┘
```

## Local Development Flow

```
Developer runs: npm run dev

┌───────────────────────────────────────────────────────────┐
│ Vite dev server starts: http://localhost:5173             │
│                                                            │
│ Vite config (vite.config.js):                             │
│   proxy: {                                                │
│     '/api': {                                             │
│       target: 'http://localhost:8080',                   │
│       changeOrigin: true                                 │
│     }                                                     │
│   }                                                       │
│                                                            │
│ RATES_BACKEND_URL = undefined                            │
│                   → fallback to '/api/rates'              │
└───────────────────────────────────────────────────────────┘
                              ↓
Developer runs: cd rates-proxy && mvn spring-boot:run

Backend starts: http://localhost:8080
  • /api/rates → metals.dev (with server-side key)
  • /api/health → status check
  • METALS_API_KEY = $env
  • FRONTEND_ORIGIN = http://localhost:3000
                              ↓
┌───────────────────────────────────────────────────────────┐
│ User clicks "Refresh Live Rate"                           │
│                                                            │
│ Frontend: fetch('/api/rates')                             │
│           ↓ (Vite proxy)                                  │
│ Backend: http://localhost:8080/api/rates                 │
│          ↓                                                │
│ Response: {goldPerGram, silverPerGram, ...}             │
│          ↓                                                │
│ Frontend displays rates                                  │
│ ✓ Works exactly like production!                         │
└───────────────────────────────────────────────────────────┘
```

## Request/Response Example

### Request (Frontend → Backend)
```
GET https://nsheera-rates-proxy-production.up.railway.app/api/rates
Headers:
  Host: nsheera-rates-proxy-production.up.railway.app
  Origin: https://vincisam.github.io
  Referer: https://vincisam.github.io/nsheera/
```

### Response (Backend → Frontend)
```json
{
  "goldPerGram": 8123.45,
  "silverPerGram": 96.2,
  "source": "metals.dev",
  "lastUpdated": "2025-01-17T10:15:00Z"
}
```

Frontend then:
- Calculates selling prices with markup
- Displays in Admin → Rates tab
- Shows diagnostics log

## Health Check Flow

### Monitoring (Optional)
```
curl https://nsheera-rates-proxy-production.up.railway.app/api/health

Response:
{"status": "ok"}

Use case:
  • GitHub Actions can verify backend is live before promoting frontend
  • Uptime monitoring services
  • Admin dashboard status indicator
```

## Error Handling

If backend is down:

```
Frontend: fetch('https://nsheera-rates-proxy-production.up.railway.app/api/rates')
          ↓ [Connection refused / timeout]
          ✗ Failed

Frontend: Try next source...

Frontend: fetch('https://api.metalpriceapi.com/...')
          ↓ [Success]
          ✓ Returns rates from direct API

Admin panel diagnostics shows:
  ✗ [backend] — Connection refused
  ✓ [metalpriceapi.com] — Success
  Source: metalpriceapi.com
```

This ensures the storefront always has rates, even if the backend is temporarily down.

---

## Summary

✅ **Frontend is fully connected to backend**
✅ **Fallback logic prevents service disruption**
✅ **Secure API keys kept server-side**
✅ **Both auto-deploy on commit**
✅ **Ready for production**

Next: Add GitHub secrets to activate automated deployments.
