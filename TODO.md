# TODO - Fix AI Design & Astro, Reorganize Frontend, Build Backend

## Phase 1: Fix AI Design & Astro (root cause: request/auth/response shape mismatch) — COMPLETE
- [x] Merge App_7.jsx into src/App.jsx (verified byte-identical, 0 differences)
- [x] Backend: Update `jewelleryDesignService.js` to accept frontend `{promptText, fileBlock}` format and return the frontend's expected JSON shape
- [x] Backend: Update `astroStoneService.js` to accept frontend `{dateOfBirth, timeOfBirth, placeOfBirth, concern}` format and return frontend's expected shape
- [x] Backend: Update `designController.js` to accept `{promptText, fileBlock}` and return raw concept
- [x] Backend: Update `astroController.js` to accept frontend fields and return raw suggestion
- [x] Backend: Make AI endpoints public (remove `protect` middleware from designRoutes & astroRoutes)
- [x] Backend: Update `DesignRequest.js` and `StoneSuggestion.js` models to match new shapes (user optional)
- [x] Verify all 8 backend files pass Node syntax check
- [x] Verify frontend build passes (1492 modules, 2.81s)

## Phase 2: Reorganize frontend with category/subcategory pages & professional functionality
- [ ] (pending)

## Phase 3: Backend for categories/subcategories
- [ ] (pending)
