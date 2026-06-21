# Bly. — Deployment Guide

> South African stays. Curated sharp.

This guide walks you through getting Bly running live — from zero to a deployed app — using **GitHub** for version control and **Supabase** for the database, with **Vercel** for hosting.

---

## What you'll have at the end

- ✅ A live URL (e.g. `bly.vercel.app`)
- ✅ A Supabase database with 6 sample hotels
- ✅ Hotel search, detail pages, and booking UI
- ✅ Fully connected to your own Supabase backend

---

## Prerequisites

Install these first if you don't have them:

- [Node.js 18+](https://nodejs.org) — check with `node -v`
- [Git](https://git-scm.com) — check with `git -v`
- A [GitHub account](https://github.com)
- A [Supabase account](https://supabase.com) (free)
- A [Vercel account](https://vercel.com) (free, sign in with GitHub)

---

## Step 1 — Set up Supabase

### 1a. Create a new project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New project"**
3. Fill in:
   - **Name:** `bly`
   - **Database password:** choose a strong password and save it
   - **Region:** pick the closest to South Africa (e.g. `eu-west-2` London)
4. Click **"Create new project"** — wait ~2 minutes for it to provision

### 1b. Run the schema

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy the entire contents and paste into the SQL editor
5. Click **"Run"** (or press `Cmd/Ctrl + Enter`)
6. You should see: `Success. No rows returned`
7. Verify: go to **Table Editor** — you should see `hotels`, `bookings`, `reviews` tables
8. Click the `hotels` table — you should see 6 sample hotels

### 1c. Get your API keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these two values (you'll need them soon):
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon / public key** — a long JWT string

---

## Step 2 — Set up GitHub

### 2a. Create a new repository

1. Go to [github.com/new](https://github.com/new)
2. Set:
   - **Repository name:** `bly`
   - **Visibility:** Public or Private (your choice)
   - Do NOT initialise with README (you already have one)
3. Click **"Create repository"**
4. Copy the repo URL — e.g. `https://github.com/yourusername/bly.git`

### 2b. Push the code

Open a terminal in the `bly` project folder and run:

```bash
# Install dependencies
npm install

# Copy the env example and fill in your Supabase keys
cp .env.example .env
```

Open `.env` and replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

Then push to GitHub:

```bash
git init
git add .
git commit -m "feat: initial Bly. setup"
git branch -M main
git remote add origin https://github.com/yourusername/bly.git
git push -u origin main
```

> ⚠️ The `.gitignore` already excludes `.env` so your keys are safe.

---

## Step 3 — Deploy to Vercel

### 3a. Import the project

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Click **"Import"** next to your `bly` repository
4. Vercel will detect it as a Vite project automatically

### 3b. Add environment variables

Before clicking "Deploy", scroll down to **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-public-key-here` |

### 3c. Deploy

1. Click **"Deploy"**
2. Wait ~1 minute
3. You'll get a live URL like `https://bly-yourusername.vercel.app` 🎉

---

## Step 4 — Test it's all working

Visit your live URL and check:

- [ ] Home page loads with hero image and 6 hotels in the carousel
- [ ] Search for "Cape Town" — shows filtered results
- [ ] Click a hotel card — detail page loads with pricing
- [ ] Change dates on the booking card — total updates correctly

---

## Local development

```bash
npm install
cp .env.example .env  # fill in your keys
npm run dev           # runs at http://localhost:5173
```

---

## Project structure

```
bly/
├── src/
│   ├── lib/
│   │   └── supabase.js          # Supabase client
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── SearchBar.jsx
│   │   ├── HotelCard.jsx
│   │   └── FeaturedCarousel.jsx
│   ├── pages/
│   │   ├── Home.jsx             # Landing page
│   │   ├── Search.jsx           # Search results
│   │   └── HotelDetail.jsx      # Hotel + booking card
│   ├── App.jsx                  # Routes
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles + CSS vars
├── supabase/
│   └── schema.sql               # Tables, RLS, seed data
├── index.html
├── vite.config.js
├── package.json
└── .env.example
```

---

## Add your own hotels

In Supabase → Table Editor → `hotels`, click **"Insert row"** to add your own properties. Required fields:

| Field | Type | Example |
|-------|------|---------|
| `name` | text | `"The Grand Franschhoek"` |
| `slug` | text | `"grand-franschhoek"` (unique URL key) |
| `city` | text | `"Franschhoek"` |
| `province` | text | `"Western Cape"` |
| `price_night` | number | `5500` |
| `images` | text[] | `{https://...jpg}` |
| `featured` | boolean | `true` |
| `category` | text | `hotel` / `lodge` / `boutique` |

---

## Future enhancements

- **Auth**: Supabase Auth is already wired in — enable email/Google login
- **Bookings**: The `bookings` table is ready; add a checkout flow
- **Reviews**: The `reviews` table is set up; build a review form
- **Map**: Add a hotel map view using React Leaflet
- **Payments**: Integrate Peach Payments or Yoco for ZAR payments

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (ready to enable) |
| Hosting | Vercel |
| Fonts | Syne + DM Sans |
| Styling | CSS custom properties |

<!-- trigger redeploy -->
