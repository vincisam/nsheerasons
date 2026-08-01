# Deployment TODO

## Phase 1: Local Dev Proxy Setup ✅
- [x] Add Vite proxy config in `vite.config.js` for `/api` → `http://localhost:8080`
- [x] Set `RATES_BACKEND_URL` in `App.jsx` to `/api/rates` (Vite proxy handles it)

## Phase 2: Git Push ✅
- [x] Initialize git repo (if not already)
- [x] Commit all changes
- [x] Push to `blackboxai/fix-syntax-error` branch → ready for PR or merge to main for Vercel auto-deploy

## Phase 3: Backend Deploy (Railway)
- [ ] Deploy `rates-proxy/` Docker container to Railway
- [ ] Set env vars: `METALS_API_KEY`, `FRONTEND_ORIGIN`, `PORT`
- [ ] Verify `/api/health` and `/api/rates` endpoints

## Phase 4: Production Config
- [ ] Update `RATES_BACKEND_URL` to Railway production URL
- [ ] Remove Vite proxy (dev-only)
- [ ] Final verification
