---
phase: 01-foundation-catalogue-traceability
plan: 01
subsystem: infra
tags: [nextjs, typescript, drizzle, postgresql, better-auth, trpc, tailwind, shadcn, meilisearch, cloudflare-r2]

# Dependency graph
requires: []
provides:
  - "Next.js 15 project scaffold with all Phase 1 dependencies"
  - "Complete Drizzle ORM schema: products, batches, suppliers, mill certs, stock, verification tokens, allocations"
  - "Better Auth with Drizzle adapter for email/password registration and login"
  - "tRPC router with public, protected, and warehouse-role procedures"
  - "R2 storage client for cert PDF upload and presigned URLs"
  - "Meilisearch client for product search"
  - "Auth middleware protecting WMS routes"
  - "Torke dark brand theme with red (#C41E3A) primary"
  - "Login and register pages with Torke branding"
affects: [01-02, 01-03, 01-04, phase-2, phase-3, phase-4]

# Tech tracking
tech-stack:
  added: [next@16.1.6, react@19.2.3, drizzle-orm@0.45.1, better-auth@1.5.3, "@trpc/server@11.11.0", meilisearch@0.55.0, "@aws-sdk/client-s3", zustand@5.0.11, zod@4.3.6, shadcn-ui, tailwindcss@4]
  patterns: [app-router, server-components, drizzle-schema-per-domain, trpc-procedure-hierarchy, css-variable-theming]

key-files:
  created:
    - src/server/db/schema/products.ts
    - src/server/db/schema/batches.ts
    - src/server/db/schema/stock.ts
    - src/server/db/schema/verification.ts
    - src/server/db/schema/allocations.ts
    - src/server/db/schema/users.ts
    - src/server/db/index.ts
    - src/server/auth.ts
    - src/server/trpc/trpc.ts
    - src/server/trpc/router.ts
    - src/server/storage.ts
    - src/server/search.ts
    - src/middleware.ts
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/register/page.tsx
    - src/lib/constants.ts
    - src/lib/types.ts
    - src/lib/auth-client.ts
    - src/lib/trpc.ts
    - drizzle.config.ts
  modified:
    - package.json
    - tsconfig.json
    - src/app/globals.css
    - src/app/layout.tsx

key-decisions:
  - "Used Next.js 16.1.6 (latest stable) — middleware deprecated but still functional for auth checks"
  - "Drizzle schema split by domain: products, batches, stock, verification, allocations, users"
  - "Better Auth 1.5.3 requires separate @better-auth/drizzle-adapter package"
  - "Dark theme as default (not media query based) — Torke brand is always dark"
  - "sonner used instead of shadcn toast (toast component deprecated)"
  - "Inter font chosen as clean sans-serif for professional B2B aesthetic"

patterns-established:
  - "Schema per domain: each domain file exports tables + relations from src/server/db/schema/"
  - "tRPC procedure hierarchy: publicProcedure < protectedProcedure < warehouseProcedure"
  - "Auth client as 'use client' module exporting hooks (useSession, signIn, signUp, signOut)"
  - "TanStack Query + tRPC provider via src/components/providers.tsx wrapper"
  - "Torke brand CSS variables: --torke-red, --torke-black, --torke-dark-grey, etc."

requirements-completed: [SHOP-13]

# Metrics
duration: 12min
completed: 2026-03-04
---

# Phase 01 Plan 01: Project Scaffold Summary

**Next.js 16 project with Drizzle schema (10 tables, 2 enums), Better Auth email/password login, tRPC router, R2/Meilisearch clients, and Torke dark brand theme**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-04T20:40:59Z
- **Completed:** 2026-03-04T20:53:16Z
- **Tasks:** 3
- **Files modified:** 50+

## Accomplishments
- Complete Next.js 16 project scaffold with all Phase 1 dependencies (Drizzle, Better Auth, tRPC, Meilisearch, AWS S3, QR, Zustand, Zod)
- Full database schema with 10 tables covering the traceability chain: products, categories, suppliers, mill certs, supplier batches, Torke batches, stock items, verification tokens, order line allocations, user profiles
- Better Auth configured with Drizzle adapter, email/password auth, 7-day sessions
- tRPC router with role-based procedures (public, protected, warehouse)
- R2 storage client, Meilisearch client, auth middleware, and Torke-branded auth pages
- Torke dark theme established: red (#C41E3A) primary, near-black (#0A0A0A) background, premium aesthetic

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 15 project** - `55409ae` (feat)
2. **Task 2: Define Phase 1 database schema** - `6ca45af` (feat, included in parallel agent commit)
3. **Task 3: Configure auth, tRPC, storage, search, middleware, auth pages** - `cbdc975` (feat)

## Files Created/Modified
- `package.json` - Project config with all Phase 1 deps
- `tsconfig.json` - TypeScript strict mode with noUncheckedIndexedAccess
- `src/app/globals.css` - Torke dark brand theme CSS variables
- `src/server/db/schema/products.ts` - Products and categories tables with facet columns
- `src/server/db/schema/batches.ts` - Full batch traceability chain (suppliers, mill certs, supplier batches, Torke batches)
- `src/server/db/schema/stock.ts` - Stock items with bin location
- `src/server/db/schema/verification.ts` - Verification tokens with opaque UUID for QR URLs
- `src/server/db/schema/allocations.ts` - Order line allocations join table
- `src/server/db/schema/users.ts` - User profiles with role field
- `src/server/db/index.ts` - Drizzle client connection
- `drizzle.config.ts` - Drizzle Kit config
- `drizzle/0000_chilly_boom_boom.sql` - Initial migration (10 tables, 2 enums)
- `src/server/auth.ts` - Better Auth with Drizzle adapter
- `src/server/trpc/trpc.ts` - tRPC context, public/protected/warehouse procedures
- `src/server/trpc/router.ts` - Root tRPC router with health check
- `src/server/storage.ts` - R2 client for cert PDF upload
- `src/server/search.ts` - Meilisearch client
- `src/middleware.ts` - WMS route protection (goods-in, stock)
- `src/app/(auth)/login/page.tsx` - Login page with Torke branding
- `src/app/(auth)/register/page.tsx` - Register page with company name field
- `src/app/api/auth/[...all]/route.ts` - Better Auth route handler
- `src/app/api/trpc/[trpc]/route.ts` - tRPC fetch handler
- `src/lib/constants.ts` - QR URL builder, batch ID generator
- `src/lib/types.ts` - Shared TypeScript types
- `src/lib/auth-client.ts` - Better Auth React client
- `src/lib/trpc.ts` - tRPC React client
- `src/components/providers.tsx` - TanStack Query + tRPC provider
- 12 shadcn/ui components (button, input, card, label, form, dialog, sheet, tabs, badge, separator, dropdown-menu, sonner)

## Decisions Made
- Used Next.js 16.1.6 (latest create-next-app version); middleware is deprecated but still functional for route protection
- Used `sonner` instead of `toast` shadcn component (toast is deprecated in latest shadcn)
- Better Auth 1.5.3 requires `@better-auth/drizzle-adapter` as separate package (not bundled)
- Dark theme applied as default (no dark/light toggle) per Torke brand requirements
- Inter font used as primary typeface (clean, professional sans-serif)
- Schema tables all use UUID primary keys with defaultRandom()

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed @better-auth/drizzle-adapter**
- **Found during:** Task 3 (Better Auth configuration)
- **Issue:** better-auth 1.5.3 exports drizzle adapter via separate `@better-auth/drizzle-adapter` package
- **Fix:** `npm install @better-auth/drizzle-adapter`
- **Files modified:** package.json, package-lock.json
- **Verification:** Build passes, auth route compiles
- **Committed in:** cbdc975

**2. [Rule 1 - Bug] Added Better Auth baseURL configuration**
- **Found during:** Task 3 (build verification)
- **Issue:** Better Auth warning about missing base URL during build
- **Fix:** Added `baseURL: process.env.NEXT_PUBLIC_APP_URL` to auth config
- **Files modified:** src/server/auth.ts
- **Verification:** Build passes without warnings
- **Committed in:** cbdc975

**3. [Rule 3 - Blocking] Used sonner instead of deprecated toast component**
- **Found during:** Task 1 (shadcn init)
- **Issue:** `npx shadcn add toast` fails — component deprecated
- **Fix:** Used `sonner` component instead
- **Files modified:** src/components/ui/sonner.tsx
- **Verification:** Build passes
- **Committed in:** 55409ae

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for build success. No scope creep.

## Issues Encountered
- Next.js create-next-app rejected project name "Torke" (capital letter) — scaffolded in temp directory and copied files
- Task 2 schema files were committed by a parallel agent (01-02 scraper plan), so no separate commit was needed for Task 2

## User Setup Required

External services require manual configuration:
- **PostgreSQL:** Local Docker or Railway — set DATABASE_URL
- **Cloudflare R2:** Create bucket and API tokens — set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
- **Meilisearch:** Local Docker or Railway — set MEILISEARCH_URL, MEILISEARCH_ADMIN_KEY, MEILISEARCH_SEARCH_KEY

See `.env.example` for all required environment variables.

## Next Phase Readiness
- Database schema ready for migration against a live PostgreSQL instance
- Auth system ready for registration and login flows
- tRPC router ready for product, batch, stock, and search sub-routers
- R2 client ready for cert PDF uploads once credentials configured
- Meilisearch client ready for product indexing once instance running
- Torke brand theme established for all future UI work

## Self-Check: PASSED

All 18 key files verified present. All 2 commit hashes verified in git log.

---
*Phase: 01-foundation-catalogue-traceability*
*Completed: 2026-03-04*
