# Nsheera Backend

Node.js + Express + MongoDB backend for Nsheera:

1. **AI Jewellery Designing** (Google Gemini) — generates a structured design
   concept (title, metal, stones, styling notes, an image-gen-ready prompt)
   from a client brief, optionally analyzing an uploaded reference image.
2. **AI Stone Suggestion by Astro** (Google Gemini) — generates a
   Vedic-astrology-based gemstone recommendation from birth details.
3. **Jewellery detailing** — full product catalog: metal/purity/weight,
   stone breakdown, making charges, wastage, tax, images, stock,
   certification, auto-computed pricing.
4. **Payment gateway** — Razorpay order creation, checkout signature
   verification, webhook handling, and refunds.
5. **Client detailing** — admin/staff CRM view of clients (profile,
   order history, spend, AI design/stone-suggestion history).
6. **Invoicing** — auto-generated on successful payment: sequential invoice
   numbers, line-item snapshot, tax breakdown, and a rendered PDF.

## Key design decision: client profile is never forced at login

`POST /api/auth/login` returns the user + token only — it does **not**
require or return a profile. `GET /api/client/dashboard` returns dashboard
data plus a simple `isProfileComplete: boolean` flag and a soft
`profileNudge` message (or `null` if complete). The frontend should use that
flag to show a small, dismissible "complete your profile" banner/card on the
dashboard — **not** a blocking modal or forced form. The actual profile form
should only appear when the client explicitly opens **Settings → Profile**
and calls `GET/PUT /api/client/profile`.

## Setup

```bash
cd nsheera-backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev
```

Get a Gemini API key from Google AI Studio (https://aistudio.google.com/apikey).
Default model is `gemini-2.0-flash` — change `GEMINI_MODEL` /
`GEMINI_VISION_MODEL` in `.env` if you want a different one (e.g. a newer
`gemini-2.5-flash` once available on your account).

## Project structure

```
src/
  config/db.js              MongoDB connection
  models/                   User, ClientProfile, DesignRequest, StoneSuggestion
  middleware/                auth (JWT), upload (multer), errorHandler
  services/
    geminiService.js         low-level Gemini REST client (text + vision, JSON mode)
    jewelleryDesignService.js  prompt builder for design concepts
    astroStoneService.js       prompt builder for astro stone suggestions
  controllers/               auth, client, design, astro
  routes/                    auth, client, design (ai), astro (ai)
  app.js / server.js
```

## API Reference

### Auth
| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/signup` | `{ name, email, phone?, password }` | Creates account only — no profile created |
| POST | `/api/auth/login` | `{ email, password }` | Returns token; **no profile form triggered** |
| GET | `/api/auth/me` | — | Requires `Authorization: Bearer <token>` |

### Client
| Method | Route | Notes |
|---|---|---|
| GET | `/api/client/dashboard` | Returns `{ user, isProfileComplete, profileNudge, recentDesigns, recentStoneSuggestions }` |
| GET | `/api/client/profile` | Returns `null` if not yet created |
| PUT | `/api/client/profile` | Upserts `{ address?, birthDetails?, preferences?, avatarUrl? }` |

### AI — Jewellery Design
| Method | Route | Notes |
|---|---|---|
| POST | `/api/ai/jewellery-design` | multipart/form-data: `jewelleryType, occasion, metal, gemstones, style, budgetRange, notes` + optional file field `referenceImage` |
| GET | `/api/ai/jewellery-design` | List past designs for the logged-in client |
| GET | `/api/ai/jewellery-design/:id` | Single design |

Example response `result`:
```json
{
  "title": "Kundan Bloom Ring",
  "concept": "...",
  "metalRecommendation": "22k yellow gold — traditional warmth for kundan work",
  "stoneRecommendation": ["Ruby", "Polki diamond"],
  "styleNotes": "...",
  "estimatedWeightRange": "6-8 grams",
  "imageGenPrompt": "A close-up product photo of a 22k gold kundan ring...",
  "alternatives": ["Same design in rose gold with emeralds"]
}
```

### AI — Stone Suggestion by Astro
| Method | Route | Notes |
|---|---|---|
| POST | `/api/ai/stone-suggestion` | `{ dob, timeOfBirth?, placeOfBirth?, knownRashi?, knownNakshatra?, focusArea? }`. If `dob` omitted, falls back to the client's saved profile birth details. |
| GET | `/api/ai/stone-suggestion` | List past suggestions |

Example response `result`:
```json
{
  "primaryStone": "Ruby (Manik)",
  "alternateStones": ["Red Garnet", "Red Spinel"],
  "metalPairing": "Gold",
  "wearingFinger": "Ring finger",
  "wearingDay": "Sunday morning",
  "reasoning": "...",
  "cautions": "...",
  "disclaimer": "For informational purposes only; consult a qualified astrologer before permanent wear."
}
```

### Jewellery catalog (detailing)
| Method | Route | Notes |
|---|---|---|
| GET | `/api/jewellery` | List/filter catalog (`category, metal, style, occasion, minPrice, maxPrice, q, page, limit`) |
| GET | `/api/jewellery/:id` | Single item, full pricing breakdown |
| POST | `/api/jewellery` | Admin/designer — create item; pricing is auto-computed from weights/rates/making%/wastage%/tax% |
| PUT | `/api/jewellery/:id` | Admin/designer — update; pricing recomputed on save |
| DELETE | `/api/jewellery/:id` | Admin only |
| POST | `/api/jewellery/:id/images` | Admin/designer — multipart field `images` (up to 6), served from `/uploads/jewellery/...` |

### Orders
| Method | Route | Notes |
|---|---|---|
| POST | `/api/orders` | `{ items: [{ jewelleryId, quantity, size?, customization? }], shippingAddress?, discount?, shippingCharge? }` — server prices everything from the live catalog |
| GET | `/api/orders` | Own orders; admin can pass `?all=true` |
| GET | `/api/orders/:id` | Single order |
| PUT | `/api/orders/:id/status` | Admin only — `placed / confirmed / in_production / shipped / delivered / cancelled` |

### Payments (Razorpay)
| Method | Route | Notes |
|---|---|---|
| POST | `/api/payments/create-order` | `{ orderId }` → creates a Razorpay order, returns `{ razorpayOrderId, amount, currency, keyId }` for Razorpay Checkout |
| POST | `/api/payments/verify` | `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }` — verifies signature, marks order paid, **auto-generates the invoice** |
| POST | `/api/payments/webhook` | Server-to-server Razorpay webhook (no auth — verified via `x-razorpay-signature`); handles `payment.captured` / `payment.failed` as a backup path to `/verify` |
| POST | `/api/payments/:paymentId/refund` | Admin only — `{ amount? }` (omit for full refund) |

Frontend flow: `POST /api/orders` → `POST /api/payments/create-order` → open
Razorpay Checkout with the returned `keyId`/`razorpayOrderId`/`amount` →
on success, call `POST /api/payments/verify` with the three values Razorpay
Checkout returns.

### Invoices
| Method | Route | Notes |
|---|---|---|
| GET | `/api/invoices` | Own invoices; admin can pass `?all=true` |
| GET | `/api/invoices/:id` | Invoice detail (JSON) |
| GET | `/api/invoices/:id/pdf` | Downloads the rendered PDF |

Invoices are created automatically the moment a payment is verified
(`invoiceService.createInvoiceForOrder` + `markInvoicePaid`), with a
sequential number like `NSH-INV-2026-0001` and a PDF written to
`uploads/invoices/`.

### Admin — client detailing (CRM)
| Method | Route | Notes |
|---|---|---|
| GET | `/api/admin/clients` | List clients with profile completeness, order count, total spend, last order date (`?q=` search, pagination) |
| GET | `/api/admin/clients/:userId` | Full detail: profile, orders, recent AI designs, recent stone suggestions |
| PUT | `/api/admin/clients/:userId/status` | Activate/deactivate a client account |

## Payment gateway setup

1. Create a Razorpay account, grab the **Key ID** / **Key Secret** (Settings
   → API Keys), and set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in `.env`.
2. In the Razorpay dashboard, add a webhook pointing at
   `https://<your-domain>/api/payments/webhook`, subscribe to
   `payment.captured` and `payment.failed`, and copy the webhook secret into
   `RAZORPAY_WEBHOOK_SECRET`.
3. Amounts are always handled in rupees inside this backend and converted to
   paise only at the Razorpay API boundary (`razorpayService.js`).

## Notes / next steps

- `imageGenPrompt` in the design response is meant to be handed to an
  image-generation model (e.g. Imagen) in a follow-up call — Gemini text
  models don't generate images directly. Wire that up as a separate step if
  you want actual rendered images.
- AI endpoints are rate-limited (30 requests / 15 min per IP by default) —
  adjust in `app.js`.
- All AI calls and their raw responses are persisted (`DesignRequest`,
  `StoneSuggestion`) for audit/history and to power the dashboard's
  "recent" lists.
