# RamSai Public School ERP

School management system for **RamSai Public School**.

## Stack

- Web: Next.js + TypeScript + Tailwind (`apps/web`)
- Mobile shell: Expo + TypeScript (`apps/mobile`)
- Database: Supabase PostgreSQL + Prisma schema (`packages/db`)

## Phase 1

School Admin portal with Admission Management.

### Admin login (seeded)

- Email: `admin@rsps.local`
- Password: `Admin@12345`

Change this password after first login in Supabase Auth.

### Run the web app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional: Prisma connection

Copy database passwords into:

- `apps/web/.env.local`
- `packages/db/.env`

(from Supabase → Project Settings → Database)

Phase 1 screens currently use the Supabase client with RLS. Prisma remains the schema source of truth for future modules.
