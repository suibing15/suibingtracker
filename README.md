# suibingtracker

A multi-user daily-expense tracker. Next.js (App Router) front end for Vercel,
Supabase (Postgres + Auth) back end. Each person signs in to their own
account, logs spends, sees a live dashboard, and stays inside admin-set
budgets. One super admin manages every account and decides what features
each person sees.

## What's inside

- **Auth**: Supabase email/password. The first person to run `/setup`
  becomes the permanent super admin; everyone else is created by an admin
  from `/admin` (no public sign-up).
- **Admin panel** (`/admin`, super admin only): create/deactivate/delete
  accounts, change roles, reset passwords, set per-user daily/monthly budget
  caps, and toggle which features each account can see.
- **Entry form** writes to Supabase, scoped to the signed-in user
  (`components/ExpenseForm.tsx`). Warns (without blocking) if an entry would
  push the user over their admin-set daily/monthly cap.
- **Dashboard** with a "spend pulse" bar rhythm, running total, per-day
  average and category breakdown (`components/Dashboard.tsx`).
- **Budgets** (`components/BudgetPanel.tsx`): admin-set daily/monthly caps
  with live progress and an over-budget warning, plus a "days in a row
  within budget" streak; users can additionally set their own per-category
  monthly/daily limits.
- **Filters**: quick ranges (7/30 days, this month, all time), custom date
  range, category and text search (`components/FilterBar.tsx`).
- **Table** with per-row delete and **PDF export** via jsPDF, when that
  feature is enabled for the user (`components/ExpenseTable.tsx`).
- **Feature flags**: each account has a `features` set (budgets, PDF export,
  category insights) the super admin can turn on/off individually.
- **Customisation** in one file: `lib/config.ts` (categories, colours,
  payment methods, feature definitions, currency, date format).

## 1. Set up Supabase

This app keeps everything in its own **`tracker` Postgres schema** — not
`public` — specifically so it can share a Supabase project with other apps
without table-name collisions.

1. Create a project at <https://supabase.com>, or use an existing one that
   already has other apps in it.
2. Open **SQL Editor → New query**, paste the contents of
   `supabase/schema.sql`, and run it. This creates the `tracker` schema with
   `profiles`, `expenses`, `budgets`, roles, feature flags, and RLS —
   entirely separate from whatever already lives in `public`.
3. **Required manual step**: go to **Project Settings → API → API
   Settings → "Exposed schemas"** and add `tracker` to the list (e.g.
   `public, tracker`), then Save. Supabase's API only serves schemas you've
   explicitly exposed here — the app can't reach its own tables without
   this, and no SQL script can do it for you.
4. Go to **Project Settings → API** and copy three values:
   - **Project URL**
   - **anon public** key
   - **service_role** key — keep this one secret, it bypasses RLS entirely.

### If you already had expense data in `public.expenses`

Two follow-up scripts, run in order, after step 2 above:

1. `supabase/migrate_from_public.sql` — copies any existing rows from
   `public.expenses` into `tracker.expenses` (doesn't touch or delete the
   original table). Safe to skip if there's nothing there yet.
2. After you've signed up your super admin (see step 3 below), run
   `supabase/finish_migration.sql`. It assigns any ownerless rows to the
   super admin and locks `tracker.expenses.user_id` to `NOT NULL`.

Once you've confirmed the data looks right in `tracker.expenses`, you can
drop the old `public.expenses` table yourself if nothing else uses it.

## 2. Run locally

```
npm install
cp .env.local.example .env.local   # then paste your URL, anon key, and service role key
npm run dev
```

Open <http://localhost:3000>.

## 3. Claim the super admin, then invite everyone else

1. Visit `/setup` and create the first account — it's automatically promoted
   to super admin. (If you had pre-existing data, run
   `supabase/finish_migration.sql` right after this.)
2. Sign in, open **Admin** in the top bar, and use **+ New account** to
   create everyone else. There's no outbound email configured, so share the
   email/temporary password you set directly with each person — they can't
   self-register.
3. From each account's **Manage** panel you can change role, deactivate
   without deleting their data, set daily/monthly budget caps, toggle which
   features they see, reset their password, or delete the account entirely.

## 4. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New → Project** and import the repo.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (mark it as a secret; it's only read inside
     `app/api/admin/**` route handlers, which run server-side and are never
     bundled to the browser)
4. Deploy. Vercel auto-detects Next.js; no extra build settings needed.

## Customise

Everything you'd want to tweak day to day lives in `lib/config.ts`:

- **Categories** — add/remove entries in `CATEGORIES`, each with a colour
  that flows through the form, chips and dashboard.
- **Payment methods** — edit `PAYMENT_METHODS`.
- **Feature flags** — add a new entry to `FEATURE_DEFS`/`DEFAULT_FEATURES`,
  then gate the relevant UI with `hasFeature(profile.features, "your_key")`.
- **Currency & formatting** — `CURRENCY`, `formatMoney`, `formatDate`.

Colours and the visual theme are CSS variables at the top of
`app/globals.css`.

## How access control works

- Every table lives in the `tracker` schema and has Row Level Security on: a
  normal user only ever sees their own rows; a `super_admin` can see and
  update every profile (via the `tracker.is_super_admin()` SQL helper) and
  can read every expense/budget for oversight, but still can't write
  someone else's expenses directly — creating a login for someone is done
  through the service-role-backed API routes, not the client.
- Account creation, deletion, and password resets go through
  `app/api/admin/users/**`, which re-verifies the caller is an *active*
  super admin (via their access token) before touching `auth.users` — the
  service role key itself is never sent to the browser.
- Both Supabase clients (`lib/supabaseClient.ts` for the browser,
  `lib/supabaseAdmin.ts` for the admin API routes) are configured with
  `db: { schema: "tracker" }`, so every `supabase.from(...)` call in the app
  automatically targets this app's tables and never touches `public` or
  another app's schema, even by accident.

## Built to extend further

- **Recurring expenses**, **CSV import**, **multi-currency**: isolated to
  `lib/` and one component each, same pattern as budgets.
- **Second-tier `admin` role**: now wired up — an `admin`-role account can
  view `/admin/overview` (aggregate spend only, no line items) if granted
  the `users_overview` feature, but cannot create, block, or modify other
  accounts; only `super_admin` can do that.

## v4 additions (theme, self-signup, projector, income warning, admin privacy)

- **Dark/light theme** toggle, persisted, no flash on load.
- **Public sign-up** at `/signup` — free accounts, no admin needed.
- **Dashboard-first main view**: the filter feeds the dashboard directly;
  individual entries live behind a closed-by-default "Manage individual
  entries" disclosure, not a prominent table.
- **PDF now streams inline** (opens in a new tab) instead of downloading;
  **CSV export** added alongside it as its own feature toggle.
- **Expense projector**: estimates month-end total from the user's current
  daily spending pace. Feature: `expense_projector`.
- **Income warning**: the user sets their own monthly income (not
  admin-controlled) and gets a calm, graded warning as spend approaches or
  passes it. Feature: `income_warning`.
- **Admin privacy boundary tightened**: `super_admin` (and `admin`, if
  granted `users_overview`) can now only see **aggregate** per-user numbers
  (spend today/this month, entry count, last activity) via
  `tracker.admin_user_overview()` — never a raw expense row, title,
  category, or note. Run `supabase/add_v4_features.sql` to apply this to an
  existing database (drops the old admin-read policies, adds the aggregate
  RPC, adds `monthly_income`).
