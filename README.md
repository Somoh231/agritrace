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
- `SUPABASE_SERVICE_ROLE_KEY` is required for seed scripts and server-side inserts used by `/request-demo` and analytics.
- Mapbox is required for `/map` views.

### 3) Apply Supabase schema (in order)

Open Supabase → **SQL Editor** and run these files in order:

1. `src/lib/supabase/schema.sql`
2. `src/lib/supabase/schema.enterprise.sql`
3. `src/lib/supabase/schema.integrity.sql`
4. `src/lib/supabase/schema.demo_inquiries.sql`
5. `src/lib/supabase/schema.analytics.sql`
6. `src/lib/supabase/schema.notifications.sql`

### 4) Bootstrap the first super admin

Visit `http://localhost:3000/setup` to generate a copy/paste SQL snippet for the currently signed-in Supabase Auth user.

### 5) Seed demo users + data

```bash
cd agritrace
npm run seed:demo
```

This creates the demo accounts used by the “Try Demo Roles” buttons on `/login`.

### 6) Run the app (dev)

```bash
cd agritrace
npm run dev
```

Open:
- Public homepage: `http://localhost:3000/`
- Executive demo launcher: `http://localhost:3000/demo`
- Login: `http://localhost:3000/login`
- Health: `http://localhost:3000/health`
- Setup: `http://localhost:3000/setup`

## NPM scripts

- **dev**: `next dev` (with polling enabled for file watching)
- **build**: production build
- **start**: serve production build
- **lint**: run ESLint
- **seed**: seed baseline data (service role key required)
- **seed:demo**: seed demo users + pilot data (service role key required)

## Test checklist (local)

```bash
cd agritrace
npm run build
```

Manual smoke test:
- `/` renders public homepage
- `/request-demo` submits successfully (requires `demo_inquiries` table + service role key)
- `/demo` deep-links to dashboards in presentation mode
- `/login` demo role buttons work (after `npm run seed:demo`)
- `/admin/launch-readiness` shows checks and DB table presence

## Deploy (Vercel)

1. Create a new Vercel project from this repo, set the root directory to `agritrace`.
2. Add environment variables in Vercel Project Settings (same as `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_MAPBOX_TOKEN`
   - `NEXT_PUBLIC_APP_URL` (set to your production URL, e.g. `https://<project>.vercel.app`)
3. Deploy.
4. In Supabase, apply all schema files (order above) to the production project.
5. (Optional) Run demo seed locally against prod Supabase keys:

```bash
cd agritrace
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:demo
```

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
