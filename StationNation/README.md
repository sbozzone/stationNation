# Station Nation

Find and rate clean gas-station restrooms near you. Mobile-web PWA built with
Next.js (App Router) and Supabase, deployed on Vercel.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Required environment
variables (see `.env.local` / Vercel project settings):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (required) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (required) |
| `NEXT_PUBLIC_DEMO_MODE` | `true` shows mock data + an on-screen "Demo Mode" badge. Leave unset for real data. |

## Alpha testing checklist

1. **Database** — in the Supabase SQL editor run, in order:
   `supabase/schema.sql` (fresh projects only), then
   `supabase/migration_real_coords.sql` (existing projects — widens
   lat/lng to real GPS precision).
2. **Stations** — delete the fictional seed rows
   (`DELETE FROM reviews; DELETE FROM stations;`) and insert the real gas
   stations in your test area using the template at the bottom of
   `migration_real_coords.sql`. Get coordinates from Google Maps
   (right-click → copy coordinates).
3. **Deploy** — merge to `main`; Vercel builds and deploys automatically.
   Make sure `NEXT_PUBLIC_DEMO_MODE` is **not** set in Vercel.
4. **Testers** — send them the production URL. On first launch they pick a
   nickname and grant location; the app can be installed from the browser
   ("Add to Home Screen"). Points, streaks, and stats persist on-device.

## How it works

- `app/page.tsx` — the whole app (screens, routing, rating flow).
- `app/profile.ts` — local profile (nickname, points, streak) in localStorage.
- `app/useGeolocation.ts` — geolocation hook + haversine distances.
- `lib/data.ts` — Supabase reads/writes; a DB trigger recalculates station
  scores when reviews are inserted.
- `supabase/` — schema, migrations, and (fictional) seed data.
