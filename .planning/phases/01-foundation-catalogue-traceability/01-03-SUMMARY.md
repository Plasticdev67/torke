---
phase: 01-foundation-catalogue-traceability
plan: 03
subsystem: ui, api
tags: [nextjs, react, trpc, meilisearch, tailwind, product-catalogue, search, dark-theme]

# Dependency graph
requires:
  - phase: 01-foundation-catalogue-traceability (plan 01)
    provides: "Next.js scaffold, Drizzle schema, tRPC router, Meilisearch client, Torke dark theme"
  - phase: 01-foundation-catalogue-traceability (plan 02)
    provides: "32 scraped products, category tree, seed scripts, product images and datasheets"
provides:
  - "Premium dark Torke homepage with hero, category cards, and value propositions"
  - "Product listing page with faceted filtering via Meilisearch and URL-driven state"
  - "Product detail page with image gallery, specs table, datasheet download, and related products"
  - "Instant search with debounced Meilisearch queries and keyboard navigation"
  - "tRPC products router (list, getBySlug, listByCategory, categories)"
  - "tRPC search router with Meilisearch faceted search integration"
  - "Site shell: Header with nav dropdown, Footer, MobileNav Sheet"
  - "Responsive layout across desktop, tablet, and mobile"
affects: [01-04, phase-2, phase-3]

# Tech tracking
tech-stack:
  added: []
  patterns: [shop-route-group, client-server-hybrid-filtering, meilisearch-faceted-search, premium-dark-ui-components]

key-files:
  created:
    - src/app/(shop)/layout.tsx
    - src/app/(shop)/page.tsx
    - src/app/(shop)/products/page.tsx
    - src/app/(shop)/products/catalogue-client.tsx
    - src/app/(shop)/products/[slug]/page.tsx
    - src/app/(shop)/search/page.tsx
    - src/components/layout/Header.tsx
    - src/components/layout/Footer.tsx
    - src/components/layout/MobileNav.tsx
    - src/components/products/ProductCard.tsx
    - src/components/products/ProductGrid.tsx
    - src/components/products/ProductFilters.tsx
    - src/components/products/SearchBar.tsx
    - src/components/products/SearchResults.tsx
    - src/components/products/CategoryNav.tsx
    - src/components/products/ProductSpecs.tsx
    - src/components/products/ProductImages.tsx
    - src/server/trpc/routers/products.ts
    - src/server/trpc/routers/search.ts
    - src/lib/hooks/useDebounce.ts
  modified:
    - src/app/globals.css
    - src/server/trpc/router.ts
    - tsconfig.json

key-decisions:
  - "Product listing uses dual data source: Meilisearch for facets/search, DB fallback when Meilisearch unavailable"
  - "Product detail page uses force-dynamic to avoid build-time DB queries without a running database"
  - "Excluded scripts/ from main tsconfig to prevent pre-existing script type errors blocking build"
  - "Filter state stored in URL search params for shareable/bookmarkable filtered views"

patterns-established:
  - "Shop route group (shop) wraps Header/Footer layout for public catalogue pages"
  - "Client-side filtering via URL search params with Meilisearch facet counts"
  - "ProductCard component pattern: dark card with hover lift, spec badges, category indicator"
  - "Premium dark UI: #1A1A1A cards on #0A0A0A background, #C41E3A red accents, shimmer loading"

requirements-completed: [SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05]

# Metrics
duration: 15min
completed: 2026-03-04
---

# Phase 01 Plan 03: Product Catalogue UI Summary

**Premium dark-themed product catalogue with faceted Meilisearch filtering, instant search, image galleries, specs tables, and responsive layout across 6 pages and 10 components**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-04T20:58:00Z
- **Completed:** 2026-03-04T21:13:04Z
- **Tasks:** 4 (3 feature tasks + 1 dev server)
- **Files modified:** 23

## Accomplishments
- Complete premium dark-themed product catalogue with Torke branding (red #C41E3A accents, near-black #0A0A0A background)
- Homepage with hero section, three category cards, and value proposition blocks (traceability, certification, FIFO)
- Product listing with real-time faceted filtering (category, diameter, material, finish, load class) via Meilisearch
- Instant search bar with 200ms debounce, keyboard navigation, and dropdown results
- Product detail page with image gallery (zoom on hover), technical specs table, datasheet download, and related products
- Full responsive design: mobile Sheet for filters, stacked layouts, category navigation
- tRPC product and search routers wired into the app router

## Task Commits

Each task was committed atomically:

1. **Task 1: Build site layout, header, footer, and tRPC routers** - `3fe61f2` (feat)
2. **Task 2: Build product listing with faceted filtering and instant search** - `3c641d9` (feat)
3. **Task 3: Build product detail page with specs, images, and datasheet** - `45fbac7` (feat)

## Files Created/Modified
- `src/app/(shop)/layout.tsx` - Shop layout wrapping Header + Footer
- `src/app/(shop)/page.tsx` - Premium dark homepage with hero, categories, value props
- `src/app/(shop)/products/page.tsx` - Server component product listing page with SEO metadata
- `src/app/(shop)/products/catalogue-client.tsx` - Client component for filtering/search state
- `src/app/(shop)/products/[slug]/page.tsx` - Product detail with images, specs, related products
- `src/app/(shop)/search/page.tsx` - Full search results page
- `src/components/layout/Header.tsx` - Sticky dark header with logo, nav, search, mobile menu
- `src/components/layout/Footer.tsx` - Dark footer with brand info and links
- `src/components/layout/MobileNav.tsx` - Full-screen mobile navigation via Sheet
- `src/components/products/ProductCard.tsx` - Dark card with hover effects and spec badges
- `src/components/products/ProductGrid.tsx` - Responsive grid with shimmer loading skeletons
- `src/components/products/ProductFilters.tsx` - Faceted filter sidebar with mobile Sheet
- `src/components/products/SearchBar.tsx` - Debounced search with dropdown results
- `src/components/products/SearchResults.tsx` - Full search results with filters
- `src/components/products/CategoryNav.tsx` - Horizontal category bar with counts
- `src/components/products/ProductSpecs.tsx` - Technical specs table with ETA callout
- `src/components/products/ProductImages.tsx` - Image gallery with thumbnails and zoom
- `src/server/trpc/routers/products.ts` - Products tRPC router (list, getBySlug, listByCategory, categories)
- `src/server/trpc/routers/search.ts` - Meilisearch search tRPC router with faceted filtering
- `src/lib/hooks/useDebounce.ts` - Reusable debounce hook
- `src/app/globals.css` - Enhanced with premium animations and dark scrollbar
- `src/server/trpc/router.ts` - Wired products and search sub-routers
- `tsconfig.json` - Excluded scripts/ directory

## Decisions Made
- Product listing uses dual data sources: Meilisearch for search/facets with DB fallback when Meilisearch is unavailable
- Product detail page uses `force-dynamic` since there's no database at build time
- Filter state stored in URL search params for bookmarkable/shareable filtered views
- Excluded `scripts/` from tsconfig to prevent pre-existing type errors in seed scripts from blocking the build

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Excluded scripts/ from tsconfig**
- **Found during:** Task 1 (build verification)
- **Issue:** Pre-existing TypeScript errors in scripts/seed-search-index.ts blocking build
- **Fix:** Added "scripts" to tsconfig.json exclude array (scripts have own tsconfig)
- **Files modified:** tsconfig.json
- **Verification:** Build passes
- **Committed in:** 3fe61f2

**2. [Rule 3 - Blocking] Fixed label-print.css escape syntax**
- **Found during:** Task 2 (build verification)
- **Issue:** `.print\\:hidden` CSS selector not valid for Turbopack parser
- **Fix:** Changed to `.print-hidden, [data-print-hide]` class selectors
- **Files modified:** src/styles/label-print.css
- **Committed in:** 3c641d9

**3. [Rule 1 - Bug] Fixed ExpiryAlerts nullable expiryDate**
- **Found during:** Task 2 (build verification)
- **Issue:** ExpiryBatch interface had `expiryDate: string` but data passes `string | null`
- **Fix:** Changed type to `string | null`, added null guard on date formatting
- **Files modified:** src/components/wms/ExpiryAlerts.tsx
- **Committed in:** 3c641d9

**4. [Rule 3 - Blocking] Made WMS pages force-dynamic**
- **Found during:** Task 2 (build verification)
- **Issue:** WMS goods-in and stock pages query DB at build time, causing ECONNREFUSED
- **Fix:** Added `export const dynamic = "force-dynamic"` to both WMS pages
- **Files modified:** src/app/(wms)/goods-in/page.tsx, src/app/(wms)/stock/page.tsx
- **Committed in:** 3c641d9

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All fixes necessary for build to pass. No scope creep. Blocking issues were pre-existing from other plans.

## Issues Encountered
- Pre-existing TypeScript errors in scripts/ directory and WMS components required fixes to unblock the build

## User Setup Required
None for this plan specifically. Database and Meilisearch must be running for the product listing and search to return data. See Plan 01-01 for setup instructions.

## Visual Checkpoint
- **Status:** APPROVED by user
- Checkpoint 5 (human-verify) passed -- premium dark catalogue UI approved

## Next Phase Readiness
- Product catalogue UI complete and visually approved
- All SHOP requirements (01-05) addressed in the UI layer
- Search and filtering will work once Meilisearch is seeded (via `npm run seed:search`)
- Product detail pages will display data once PostgreSQL is seeded (via `npm run seed:db`)
- Dev server running at http://localhost:3000 for checkpoint verification

## Self-Check: PASSED

All 20 key files verified present. All 3 commit hashes verified in git log.

---
*Phase: 01-foundation-catalogue-traceability*
*Completed: 2026-03-04*
