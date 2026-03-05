---
phase: 04-portals-marketing-polish
plan: 01
subsystem: ui, api
tags: [trpc, jszip, r2, certifications, account-portal, download]

requires:
  - phase: 02-e-commerce-order-flow-wms
    provides: orders, order lines, allocations, batches, certpack-service, R2 storage
provides:
  - Cert search tRPC router (certs.search, certs.orderCertDetail)
  - Bulk ZIP service (generateBulkCertZip)
  - POST /api/certpack/bulk endpoint
  - Certifications tab in account dashboard
  - CertSearch and CertResults UI components
  - orderShareTokens schema table
  - Consistent tab navigation across all account pages
affects: [04-02-share-portal, account-pages]

tech-stack:
  added: [jszip]
  patterns: [tRPC cert search with multi-table join filtering, bulk ZIP generation from R2]

key-files:
  created:
    - src/server/db/schema/share-tokens.ts
    - src/server/trpc/routers/certs.ts
    - src/server/services/zip-service.ts
    - src/app/api/certpack/bulk/route.ts
    - src/app/(shop)/account/certifications/page.tsx
    - src/components/shop/CertSearch.tsx
    - src/components/shop/CertResults.tsx
  modified:
    - src/server/db/schema/index.ts
    - src/server/trpc/router.ts
    - src/app/(shop)/account/page.tsx
    - src/app/(shop)/account/orders/page.tsx
    - src/app/(shop)/account/addresses/page.tsx

key-decisions:
  - "Tab navigation added consistently to all account pages (dashboard, orders, addresses, certifications)"
  - "Cert search queries through orders -> orderLines -> allocations -> batches -> products with conditional ILIKE filters"
  - "Bulk ZIP uses Promise.allSettled for resilient parallel R2 fetches with partial success"

patterns-established:
  - "Account tab navigation pattern: TabLink component replicated per page (not extracted to shared component)"
  - "Cert search pagination: offset-based with client-side count from distinct order IDs"

requirements-completed: [TRACE-12, TRACE-13, TRACE-14]

duration: 6min
completed: 2026-03-05
---

# Phase 4 Plan 01: Customer Cert Portal Summary

**Certifications tab with tRPC cert search, expandable order results with per-batch 3.1 cert downloads, and bulk ZIP generation via JSZip**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-05T10:08:11Z
- **Completed:** 2026-03-05T10:14:12Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Cert search router with multi-criteria filtering (order number, batch ID, product code, date range)
- Certifications tab UI with expandable order rows showing per-allocation 3.1 cert downloads
- Bulk ZIP download for up to 20 selected orders via POST /api/certpack/bulk
- Consistent tab navigation across all account pages
- orderShareTokens schema prepared for Plan 02 share portal

## Task Commits

Each task was committed atomically:

1. **Task 1: Cert search router, ZIP service, and bulk download API** - `ca2d433` (feat)
2. **Task 2: Certifications tab UI with search, results, and downloads** - `f4b26bb` (feat)

## Files Created/Modified
- `src/server/db/schema/share-tokens.ts` - orderShareTokens table for future sharing
- `src/server/trpc/routers/certs.ts` - Cert search and orderCertDetail procedures
- `src/server/services/zip-service.ts` - Bulk ZIP generation from R2 cert PDFs
- `src/app/api/certpack/bulk/route.ts` - POST endpoint for multi-order ZIP download
- `src/app/(shop)/account/certifications/page.tsx` - Certifications tab page
- `src/components/shop/CertSearch.tsx` - Search form with order/batch/product/date filters
- `src/components/shop/CertResults.tsx` - Results list with expandable rows and downloads
- `src/server/db/schema/index.ts` - Added share-tokens export
- `src/server/trpc/router.ts` - Registered certsRouter
- `src/app/(shop)/account/page.tsx` - Added Certifications tab link
- `src/app/(shop)/account/orders/page.tsx` - Added consistent tab navigation
- `src/app/(shop)/account/addresses/page.tsx` - Added consistent tab navigation

## Decisions Made
- Tab navigation replicated per page rather than extracted to shared component (follows existing pattern)
- Cert search uses distinct order IDs for pagination count to handle multi-join result expansion
- Bulk ZIP uses Promise.allSettled for resilient fetching (partial success returns available certs)
- orderShareTokens table created now to avoid schema migration conflicts with Plan 02

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added consistent tab navigation to orders and addresses pages**
- **Found during:** Task 2 (Tab navigation updates)
- **Issue:** Orders page had back link instead of tabs; addresses page had no navigation at all
- **Fix:** Added full tab bar with Dashboard/Orders/Addresses/Certifications to both pages
- **Files modified:** src/app/(shop)/account/orders/page.tsx, src/app/(shop)/account/addresses/page.tsx
- **Verification:** TypeScript check passes
- **Committed in:** f4b26bb (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Navigation consistency improvement. No scope creep.

## Issues Encountered
- `keepPreviousData` is deprecated in React Query v5/tRPC v11 -- removed in favor of simpler query config

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Cert search router and UI ready for use
- orderShareTokens schema ready for Plan 02 (share portal)
- Tab navigation pattern established for future account pages

---
*Phase: 04-portals-marketing-polish*
*Completed: 2026-03-05*
