# Frontend ↔ Backend wiring — what changed

These files replace the same paths in your `nsheera-deploy/` repo. Copy them
over (or apply as a patch) and commit as usual.

## What's now real (backed by MongoDB via nsheera-backend)

- **Sign up / log in** — `AccountAuth` now calls `POST /api/auth/signup` and
  `POST /api/auth/login`. Passwords are hashed server-side; a JWT is returned
  and saved in `localStorage` (`nsheera_auth_token`).
- **Session persistence** — on page load, App.jsx checks for a saved token and
  calls `GET /api/auth/me` + `GET /api/client/profile` to restore the session,
  instead of the old `window.storage` "session" key.
- **Profile & change password** — `ProfileTab` now saves via
  `PUT /api/client/profile` and `PUT /api/auth/change-password` (new endpoint).
- **AI Design Studio / Astro Stone Advisor** — now send the JWT (when logged
  in) so `DesignRequest`/`StoneSuggestion` records are tied to the real
  account and show up in `GET /api/client/dashboard`'s recent history,
  instead of always being anonymous.
- **Jewellery catalog browsing** — `GET /api/jewellery` and `/:id` are now
  public (no login required), so a real storefront can list products for
  signed-out visitors.

## Backend changes made to support the above

- `middleware/auth.js` — added `protectOptional` (attaches `req.user` if a
  valid token is present, but never rejects the request).
- `routes/designRoutes.js`, `routes/astroRoutes.js` — now use
  `protectOptional` instead of no auth at all.
- `routes/jewelleryRoutes.js` — `GET /` and `GET /:id` no longer require
  `protect`.
- `models/ClientProfile.js` — added `type` (`Retail`/`Shopkeeper`),
  `businessName`, `gstNumber`, `anniversary` — fields your Settings form
  already collects but the schema didn't have.
- `controllers/clientController.js` — `upsertProfile` now saves those new
  fields and can also update the User's `name`/`phone`.
- `controllers/authController.js` + `routes/authRoutes.js` — added
  `PUT /api/auth/change-password`.

## Still local / not wired (and why)

- **Product catalog & categories (admin Products/Categories tabs)** — the
  backend's `Jewellery` schema uses a fixed category enum and doesn't match
  your fully dynamic, admin-configurable categories/subcategories. This is
  exactly the "Phase 3: backend for categories/subcategories" item already
  in your TODO.md — worth doing as its own pass.
- **Cart checkout / Orders / Payments / Invoices** — the backend's `Order`
  model requires real MongoDB `Jewellery` IDs for each line item. Since the
  catalog above isn't backend-driven yet, there's nothing valid to order
  against — wiring this now would either break or need fake IDs. Do this
  right after the catalog work.
- **Admin "Clients" CRM tab** — the backend's admin client list only shows
  people with real accounts (`User` + `role: client`); it has no concept of
  manually-added walk-in contacts the way your local CRM does. Left as-is to
  avoid losing that functionality.
- **Homepage hero slides, rate overrides, inquiries, shortlists/recently
  viewed** — no backend models exist for these; still `window.storage`.
- **Facebook/Apple/Google social login** — backend has no OAuth
  verification endpoint yet, so these still use the local-only demo flow
  (`socialLogin`). Real Google sign-in (verifying the ID token server-side)
  would be the easiest of the three to add next.

## Local setup

```bash
cd nsheera-backend
npm install
cp .env.example .env   # set MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev             # runs on :5000 by default

# separate terminal
cd ..
npm install
npm run dev              # Vite dev server proxies /api -> localhost:5000
```

In production (Vercel), this same backend already runs as the
`api/index.js` serverless function per your `vercel.json` — no extra config
needed there, `src/api.js` defaults to same-origin `/api`.

Verified: `npm run build` succeeds (1493 modules, no errors) and every
touched backend file passes `node --check`.
