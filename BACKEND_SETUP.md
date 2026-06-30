# Backend setup (Supabase — free)

Your roster app now syncs to a free hosted database so everyone on the team
sees the same data, from any device, regardless of who's logged in. PINs are
stored as plain text per your earlier preference — fine for an internal tool,
but don't reuse this project for anything sensitive.

## 1. Create a free Supabase project
1. Go to https://supabase.com and sign up (GitHub or email — no credit card needed).
2. Click **New project**. Pick any name (e.g. `alaska-roster`), a region close
   to your team (e.g. Mumbai/Singapore), and a database password (save it
   somewhere, you likely won't need it again).
3. Wait ~1-2 minutes for the project to spin up.

## 2. Run the schema
1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Paste in everything from `supabase_schema.sql` (included in this project folder).
3. Click **Run**. You should see "Success" — this creates two tables:
   `kv_store` (team members, conditions, monthly overrides/adhoc log) and
   `audit_log` (login/PIN-change trail).

## 3. Get your API keys
1. Go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key (NOT the service_role key).

## 4. Configure the app
1. In the project folder, copy `.env.example` to `.env`.
2. Fill in:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. Run `npm install` then `npm run dev` — the app will automatically seed the
   backend with your current team list and scheduling conditions on first load.

## 5. Deploying
The `.env` values get baked into the build at `npm run build` time, so wherever
you eventually host the static `dist/` folder (SharePoint, Power Apps web
viewer, etc.) it will talk to the same Supabase backend — no server to manage,
no extra hosting needed for the backend itself.

## What's stored where
- **Team members** (incl. PINs) — `kv_store` row with key `team_members`
- **Scheduling conditions** — `kv_store` row with key `conditions`
- **Manual overrides per month** — `kv_store` row per month, e.g. `overrides_2026_07`
- **Adhoc/override log per month** — `kv_store` row per month, e.g. `adhoc_2026_07`
- **Login / PIN-change trail** — `audit_log` table (append-only)

## Free tier limits (more than enough for a 32-person team tool)
Supabase's free tier includes 500MB database storage and 5GB bandwidth/month,
with the project pausing after 1 week of total inactivity (any page load
un-pauses it within a few seconds).

## Note on security
The anon key is meant to be public (it ships in your frontend bundle either
way), and Row Level Security policies in `supabase_schema.sql` allow it full
read/write on these two tables — appropriate for a small trusted internal
tool with app-level PIN gating, not for data you'd consider truly sensitive.
