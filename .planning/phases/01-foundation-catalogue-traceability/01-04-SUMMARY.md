---
phase: 01-foundation-catalogue-traceability
plan: 04
subsystem: wms, traceability, api
tags: [trpc, drizzle, qr-code, batch-tracking, fifo, label-printing, r2-upload, zod]

# Dependency graph
requires:
  - phase: 01-foundation-catalogue-traceability/01-01
    provides: "Database schema (batches, stock, verification tables), auth, tRPC infrastructure"
  - phase: 01-foundation-catalogue-traceability/01-02
    provides: "Product catalogue seed data for goods-in product selector"
provides:
  - "Batch service with transactional goods-in completion"
  - "QR code generation and permanent /t/{token} verification URLs"
  - "FIFO allocation logic for stock picking"
  - "Recall query for supplier batch traceability"
  - "Goods-in multi-step form with cert upload"
  - "Thermal label printing with QR codes"
  - "Batch-tracked stock overview with expiry alerts"
  - "Public QR verification page for batch authenticity"
  - "tRPC routers for batches and stock operations"
affects: [phase-2-ecommerce, phase-4-portals]

# Tech tracking
tech-stack:
  added: [qrcode (npm), shadcn progress/select/table/textarea components]
  patterns: [server-action cert upload to R2, transactional batch creation, multi-step wizard form, print-optimised CSS for thermal labels, public verification page pattern]

key-files:
  created:
    - src/server/services/batch-service.ts
    - src/server/services/qr-service.ts
    - src/server/trpc/routers/batches.ts
    - src/server/trpc/routers/stock.ts
    - src/app/(wms)/layout.tsx
    - src/app/(wms)/goods-in/page.tsx
    - src/app/(wms)/goods-in/actions.ts
    - src/app/(wms)/goods-in/[batchId]/page.tsx
    - src/app/(wms)/stock/page.tsx
    - src/app/t/[token]/page.tsx
    - src/components/wms/GoodsInForm.tsx
    - src/components/wms/CertUpload.tsx
    - src/components/wms/BatchLabel.tsx
    - src/components/wms/BatchDetail.tsx
    - src/components/wms/StockTable.tsx
    - src/components/wms/ExpiryAlerts.tsx
    - src/styles/label-print.css
    - src/app/api/goods-in/route.ts
    - src/app/api/qr/route.ts
    - src/app/api/upload-cert/route.ts
  modified:
    - src/server/trpc/router.ts
    - src/server/db/schema/batches.ts
    - tsconfig.json

key-decisions:
  - "Batch creation and verification token generation in single DB transaction for atomicity"
  - "QR verification URLs use /t/{uuid} permanent scheme — opaque tokens, not batch IDs"
  - "FIFO allocation queries batches ordered by goodsInDate ASC, splits across batches if needed"
  - "Label print CSS uses @page 100mm x 60mm for thermal label stock"
  - "Verification page uses light theme (exception to site dark theme) for certificate-like trustworthiness"
  - "Mill cert fields optional on goods-in form for Phase 2 readiness"

patterns-established:
  - "WMS layout pattern: dark sidebar with navigation, protected route group under (wms)"
  - "Multi-step wizard form: step indicator, validation per step, server action on final submit"
  - "Cert upload: drag-drop zone with progress, PDF-only, max 20MB, R2 storage"
  - "Print CSS pattern: @media print hides all UI except label container"
  - "Public verification page: no auth required, noindex/nofollow, updates lastAccessedAt"

requirements-completed: [TRACE-01, TRACE-02, TRACE-03, TRACE-04, TRACE-05, TRACE-06, TRACE-08, TRACE-18, TRACE-19, WMS-01, WMS-05, WMS-06, WMS-07]

# Metrics
duration: 20min
completed: 2026-03-04
---

# Phase 1 Plan 4: Goods-In, Batch Tracking, QR Verification & Stock Overview Summary

**Transactional goods-in workflow with cert upload, TRK-YYYYMMDD-NNNN batch IDs, QR label printing, /t/{uuid} verification pages, FIFO allocation logic, and batch-tracked stock overview with expiry alerts**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-04T21:15:00Z
- **Completed:** 2026-03-04T21:35:00Z
- **Tasks:** 5 (3 auto + 1 dev server + 1 human verification)
- **Files modified:** 37

## Accomplishments
- Complete goods-in workflow: multi-step form captures supplier batch, cert PDF upload to R2, generates Torke batch ID, prints QR label
- Batch service creates batch + verification token in single DB transaction (atomicity guarantee)
- FIFO allocation logic selects oldest qualifying batch first, supports splitting across batches
- Recall query traces supplier batch to all affected orders (many-to-many data model)
- QR verification page at /t/{uuid} shows full batch details and cert download (public, no auth)
- Batch-tracked stock overview with expiry alerts for chemical products (30-day and 7-day thresholds)
- tRPC routers for batch CRUD and stock operations with Zod validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Batch service, QR service, FIFO allocation, tRPC routers** - `54213ba` (feat)
2. **Task 2: Goods-in UI, cert upload, label printing, WMS layout** - `9172e90` (feat)
3. **Task 3: Stock overview, expiry alerts, QR verification page** - `efb79a5` (feat)
4. **Task 4: Start dev server** - no commit (runtime only)
5. **Task 5: Human verification** - approved by user

## Files Created/Modified

### Services & API
- `src/server/services/batch-service.ts` - Batch creation, FIFO allocation, recall query
- `src/server/services/qr-service.ts` - QR code generation (data URL, buffer, SVG)
- `src/server/trpc/routers/batches.ts` - Batch CRUD, goods-in completion, token lookup
- `src/server/trpc/routers/stock.ts` - Stock overview, expiring batches queries
- `src/server/trpc/router.ts` - Wired batches and stock routers into appRouter
- `src/app/api/goods-in/route.ts` - Goods-in API endpoint
- `src/app/api/qr/route.ts` - QR generation API endpoint
- `src/app/api/upload-cert/route.ts` - Cert upload API endpoint

### WMS Pages & Components
- `src/app/(wms)/layout.tsx` - WMS layout with dark sidebar navigation
- `src/app/(wms)/goods-in/page.tsx` - Goods-in workflow page
- `src/app/(wms)/goods-in/actions.ts` - Server actions for cert upload and goods-in submission
- `src/app/(wms)/goods-in/[batchId]/page.tsx` - Batch detail page after goods-in
- `src/app/(wms)/stock/page.tsx` - Batch-tracked stock overview
- `src/components/wms/GoodsInForm.tsx` - Multi-step wizard (product/supplier, cert upload, inspection)
- `src/components/wms/CertUpload.tsx` - Drag-drop PDF upload with progress
- `src/components/wms/BatchLabel.tsx` - Thermal label with QR code (100mm x 60mm)
- `src/components/wms/BatchDetail.tsx` - Batch information display card
- `src/components/wms/StockTable.tsx` - Sortable, filterable stock data table
- `src/components/wms/ExpiryAlerts.tsx` - Expiry warning banners (red <7d, amber 7-30d)

### Verification
- `src/app/t/[token]/page.tsx` - Public QR verification page (light theme, noindex)

### Styles & Config
- `src/styles/label-print.css` - Print CSS for thermal labels (@page 100mm x 60mm)
- `src/server/db/schema/batches.ts` - Schema updates for batch model
- `tsconfig.json` - TypeScript config adjustments

## Decisions Made
- Batch creation and verification token generation wrapped in single DB transaction for atomicity
- QR verification URLs use permanent /t/{uuid} scheme with opaque UUIDs (not batch IDs) per TRACE-18/19
- FIFO allocation queries by goodsInDate ASC, supports cross-batch splitting for partial availability
- Thermal label sized at 100mm x 60mm with high-contrast black-on-white for thermal printer compatibility
- Verification page uses light theme (exception to site-wide dark theme) for certificate-like trustworthiness
- Mill cert fields (heat number, mill name) are optional on goods-in for Phase 2 readiness
- Error correction level H on QR codes (survives 30% damage, essential for warehouse labels)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All traceability core requirements (TRACE-01 through TRACE-06, TRACE-08, TRACE-18, TRACE-19) are complete
- All WMS foundation requirements (WMS-01, WMS-05, WMS-06, WMS-07) are complete
- Phase 1 is fully complete: scaffold, catalogue scraping, catalogue UI, and goods-in/traceability all delivered
- Ready for Phase 2: e-commerce ordering, FIFO enforcement at pick, dispatch workflows, cert pack generation
- FIFO allocation logic is already implemented and ready for Phase 2 pick list integration

## Self-Check: PASSED

All 3 task commits verified (54213ba, 9172e90, efb79a5). All 12 key files confirmed present on disk.

---
*Phase: 01-foundation-catalogue-traceability*
*Completed: 2026-03-04*
