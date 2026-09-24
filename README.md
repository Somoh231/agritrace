# Agrivault (Liberia Pilot)

Agrivault is a pilot-ready agricultural traceability platform for Liberia, with rice production visibility, cocoa chain-of-custody, integrity workflows (inventory + discrepancies + approvals), and compliance exports.

## Local setup

### 1) Install dependencies

```bash
cd agritrace
npm install
```

### 2) Configure environment variables

Create `agritrace/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=<service-role>
NEXT_PUBLIC_MAPBOX_TOKEN=<mapbox-token>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Notes:
- `SUPABASE_SERVICE_ROLE_KEY` is used only server-side (admin provisioning, account
  activation, analytics). Never expose it to the browser.
- Mapbox is required for `/map` and boundary capture.
- `NEXT_PUBLIC_ILLUSTRATIVE_DATA=enabled` shows illustrative/training datasets. Leave it
  **unset** on any deployment real operators use (see `src/lib/data/illustrative-policy.ts`).

### 3) Apply the database schema (migrations only)

The schema is defined **only** by `supabase/migrations/*.sql`, applied in filename order
(`supabase db push`, or the SQL editor for a disposable project). Do **not** run the legacy
`src/lib/supabase/schema*.sql` files: they recreate permissive pre-hardening policies.

Pending migrations and their approval order are in
`docs/audits/CLAUDE_OPUS_55_RELEASE_GATE.md`. Always prove a migration set first on a
disposable database:

```bash
npm run test:rls:behavior   # all migrations + 66 authorization probes (needs Docker)
npm run test:rls:p0         # live-equivalent schema + P0 containment
```

### 4) Bootstrap the first administrator

There is no public setup page. Follow `docs/audits/BOOTSTRAP_ADMIN_TRANSITION_PLAN.md`
(an operator-approved manifest applied with the workforce identity migration).

### 5) Provision workforce users

Sign in as the approved administrator, open `/admin/users`, and invite each unique
workforce or QA identity. Users choose their own passwords from Supabase invitation
links; shared role accounts are disabled. Public sign-up must be disabled in Supabase Auth.

### 6) Run the app (dev)

```bash
cd agritrace
npm run dev
```

Open `http://localhost:3000/login` (`/` redirects there). `/api/health` reports
configuration and identity-service reachability. Former public pages (`/setup`, `/demo`,
`/request-demo`, marketing pages) return 404.

## NPM scripts

- **dev** / **build** / **start** / **lint**
- **test:workflow** — workflow state machine, permissions, data-source policy, security helpers
- **test:workflow:parity** — TypeScript vs SQL workflow transition table
- **test:gis** — farm boundary geometry validation
- **test:rls:behavior** / **test:rls:p0** — behavioral RLS suites on a disposable Postgres (Docker)
- **test:rls:rc1** / **test:identity:rc1** — migration contract checks
- **test:e2e:rc1** — Playwright suites (`tests/e2e`), including `opus55-agentic-qa.spec.ts`
  (set `PREVIEW_BASE_URL`, `QA55_*_EMAIL`, `QA_PASSWORD`; synthetic mutations additionally
  need `QA_ALLOW_SYNTHETIC_MUTATIONS=true` and never run against production)
- **seed** / **seed:ministry** — synthetic staging data only; refuse to run unless
  `SEED_TARGET_IS_DISPOSABLE=yes` and `SEED_TARGET_PROJECT_REF` matches the target

## Deploy (Vercel)

1. Create a new Vercel project from this repo, set the root directory to `agritrace`.
2. Add environment variables in Vercel Project Settings (same as `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - `NEXT_PUBLIC_APP_URL` (set to your production URL, e.g. `https://<project>.vercel.app`)
3. Deploy.
4. In Supabase, apply the reviewed `supabase/migrations` set (never the legacy
   `src/lib/supabase/schema*.sql` files) and disable public sign-ups.
5. Provision unique users through `/admin/users`; never seed shared credentials
   against production.

6. Confirm readiness:
- Visit `/health`
- Visit `/admin/launch-readiness`

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
