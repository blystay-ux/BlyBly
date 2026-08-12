# Bly. — South Africa's travel platform

> Find. Book. Bly waar dit saak maak.

South African OTA (~6% commission) built on React/Vite, Supabase, and Vercel, with live hotel inventory sourced from **HyperGuest** (connectivity partner) rather than manual property onboarding.

---

## Current status (as of Aug 2026)

- ✅ Live search: city → real HyperGuest properties, rooms, and rates, with ZAR currency conversion
- ✅ Property detail page with room/rate selection and live **pre-book** price confirmation
- ⏳ Full booking completion — built and code-complete, but blocked pending HyperGuest granting booking permission on the certification account (in progress with their account team)
- ⏳ PCI-compliant payment gateway (PayFast / Yoco / Peach Payments) — not yet integrated; booking completion is gated on this
- 🔜 BLY Trade — closed discount channel for travel-industry staff (schema exists: `industry_memberships`, `rate_plans.audience = 'industry'`)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Database | Supabase (Postgres) |
| Backend logic | Supabase Edge Functions (Deno) |
| Inventory | HyperGuest API (search, pre-book, book, cancel) |
| Hosting | Vercel |
| Fonts | Plus Jakarta Sans |
| Styling | CSS custom properties + Tailwind utilities |

---

## Project structure

```
BlyBly/
├── src/
│   ├── lib/
│   │   └── supabase.js          # Supabase client
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── SearchBar.jsx        # City/date/guest search, calls hg_cities view
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Search.jsx           # Calls hyperguest-city-search Edge Function
│   │   ├── HotelDetail.jsx      # Room/rate selection + hyperguest-prebook
│   │   ├── Auth.jsx / Admin.jsx / Extranet.jsx / Industry.jsx /
│   │   │   ListHotel.jsx / ManageHotel.jsx / MyBookings.jsx
│   │   └── ComingSoon.jsx       # Now only used at /partners, not the homepage
│   ├── contexts/AuthContext.jsx
│   ├── App.jsx                  # Routes
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles + CSS vars
├── supabase/
│   └── schema.sql               # REFERENCE snapshot of the live DB schema
├── index.html                   # Vite entry (mounts src/main.jsx)
├── vite.config.js
├── vercel.json
├── package.json
└── .gitignore
```

**Edge Functions** (deployed directly via Supabase, not in this repo's source tree — see the Supabase dashboard):
`hyperguest-static-sync`, `hyperguest-search`, `hyperguest-city-search`, `hyperguest-prebook`, `hyperguest-book`, `hyperguest-cancel`, `hyperguest-booking-get`, `hyperguest-booking-list`.

---

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev             # runs at http://localhost:5173
```

Required env vars (see `.env.example`):
```env
VITE_SUPABASE_URL=https://sfzinvadnmrbxgttnygj.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

`.gitignore` excludes `.env` — never commit real keys to this repo, which is public.

---

## Database schema

`supabase/schema.sql` is a **reference snapshot**, regenerated from the live database, not a from-scratch setup script — the live Supabase project is the source of truth. If you change the schema via the dashboard or a migration, regenerate this file rather than hand-editing it.

Key things to know if you're touching the schema:
- Every table has **Row Level Security enabled**. Most tables have **zero RLS policies** — they're written to and read from exclusively via Edge Functions using the service-role key, which bypasses RLS. If you add a new **direct frontend query** against a table, check whether it has a matching policy first — RLS-enabled-with-no-policy means silent zero-row results, not an error, which is easy to misdiagnose as a frontend bug.
- `hg_property_index` has ~53k+ rows with no natural ordering. Never query it directly with a `LIMIT` expecting representative results (e.g. for a city list) — use the `hg_cities` view instead.
- `hotels` (the original, non-HyperGuest table) currently has 0 active rows. All live search/booking activity runs through the `hg_*` tables.

---

## HyperGuest integration notes

- Test/certification property ID: **19912** — all testing must use this property until HyperGuest issues a LIVE token
- Booking endpoint timeout can be up to 300 seconds per HyperGuest's own docs — `hyperguest-booking-list` exists as the required fallback for reconciling booking status if a request times out client-side before HyperGuest responds
- `hyperguest-book` hardcodes HyperGuest's own published test card number and refuses to accept card details from any caller — no real payment card data can reach this function until PCI-compliant handling is built
- Full API call audit trail lives in `hg_api_logs` (used for HyperGuest's certification log requirement)

---

## Deploying

Push to `main` → Vercel auto-deploys (`vercel.json`: `vite build`, output `dist/`, SPA rewrite to `index.html`).

Node.js version: **24.x** (set in Vercel project settings — 20.x deployments stop working after Oct 2026).
