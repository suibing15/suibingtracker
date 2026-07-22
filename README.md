# suibingtracker

A personal daily-expense tracker. Next.js (App Router) front end for Vercel,
Supabase (Postgres) back end. Log spends through a form, see a live dashboard,
filter by date/category/search, and export a PDF report.

## What's inside

- **Entry form** writes directly to Supabase (`components/ExpenseForm.tsx`).
- **Dashboard** with a "spend pulse" bar rhythm, running total, per-day average
  and category breakdown (`components/Dashboard.tsx`).
- **Filters**: quick ranges (7/30 days, this month, all time), custom date
  range, category and text search (`components/FilterBar.tsx`).
- **Table** with per-row delete and **PDF export** via jsPDF
  (`components/ExpenseTable.tsx`).
- **Customisation** in one file: `lib/config.ts` (categories, colours, payment
  methods, currency, date format).

## 1. Set up Supabase

1. Create a project at https://supabase.com.
2. Open **SQL Editor → New query**, paste the contents of
   `supabase/schema.sql`, and run it. This creates the `expenses` table,
   indexes, a permissive RLS policy for the single-user starter, and a few
   sample rows.
3. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon public** key.

## 2. Run locally

```bash
npm install
cp .env.local.example .env.local   # then paste your URL and anon key
npm run dev
```

Open http://localhost:3000.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New → Project** and import the repo.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Vercel auto-detects Next.js; no extra build settings needed.

## Customise

Everything you'd want to tweak day to day lives in `lib/config.ts`:

- **Categories** — add/remove entries in `CATEGORIES`, each with a colour that
  flows through the form, chips and dashboard.
- **Payment methods** — edit `PAYMENT_METHODS`.
- **Currency & formatting** — `CURRENCY`, `formatMoney`, `formatDate`.

Colours and the visual theme are CSS variables at the top of
`app/globals.css`.

## Built to extend

The structure leaves room for the next steps you mentioned:

- **Auth**: add Supabase Auth, put a `user_id uuid references auth.users` column
  on `expenses`, and replace the anon RLS policy with an owner-scoped one
  (`using (auth.uid() = user_id)`).
- **Budgets**: a `budgets` table keyed by category/month, compared against the
  dashboard totals (the coral/mint tokens are already there for over/under).
- **Recurring expenses**, **CSV import**, **multi-currency**: all isolated to
  `lib/` and one component each.
```
