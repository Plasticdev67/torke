---
phase: 02-e-commerce-order-flow-wms
plan: 05
subsystem: api, pdf-generation
tags: [pdf-lib, certpack, invoice, proforma, traceability, r2, bacs]

requires:
  - phase: 02-e-commerce-order-flow-wms
    provides: orders schema, order lines, allocations, batches, supplier batches, mill certs, invoices table, delivery addresses
  - phase: 01-foundation
    provides: products schema, batches schema, R2 storage module

provides:
  - Cert pack PDF generation with Torke-branded cover page and unaltered cert merging
  - Invoice PDF generation with batch references per line item (Torke differentiator)
  - Proforma invoice PDF for BACS orders with bank details
  - Invoice number sequence generation (INV-YYYYMM-NNNNNN)
  - Download API endpoints for cert packs and invoices
  - downloadFile utility in storage.ts for R2 object retrieval

affects: [02-06, 02-07]

tech-stack:
  added: [pdf-lib]
  patterns: [pdf-drawing-helpers, cover-page-traceability-table, shared-invoice-layout]

key-files:
  created:
    - src/server/services/certpack-service.ts
    - src/server/services/invoice-service.ts
    - src/app/api/certpack/[orderId]/route.ts
    - src/app/api/invoice/[orderId]/route.ts
  modified:
    - src/server/storage.ts
    - src/__tests__/certpack/certpack.test.ts
    - src/__tests__/invoice/invoice.test.ts

key-decisions:
  - "pdf-lib used for all PDF generation (zero native deps, works in Edge/Node)"
  - "Cert page reference column pre-calculated before cover page build using dual-pass approach"
  - "Proforma invoice has no invoice number (not a tax document per HMRC)"
  - "Bank details sourced from env vars with placeholder defaults for development"
  - "Invoice and proforma share layout helpers to avoid PDF drawing duplication"

patterns-established:
  - "PDF drawing helpers: drawText, drawTableRow, drawHorizontalLine shared across services"
  - "Cover page with red header bar, company branding, traceability table using drawLine/drawText"
  - "On-demand PDF generation with R2 caching (check key first, generate if missing)"

requirements-completed: [TRACE-09, TRACE-11, SHOP-09, SHOP-16]

duration: 7min
completed: 2026-03-04
---

# Phase 2 Plan 05: Cert Pack + Invoice Generation Summary

**Cert pack PDF with Torke-branded cover page merging original 3.1 certs unaltered, invoice PDFs with batch traceability per line item, and BACS proforma invoices with bank details using pdf-lib**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-04T23:32:04Z
- **Completed:** 2026-03-04T23:39:02Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Cert pack service generates Torke-branded cover page with full traceability table (Line#, Product, Qty, Torke Batch ID, Supplier Batch, Manufacturer, Heat Number, Cert Page Ref) then appends original supplier 3.1 cert PDFs unaltered via pdf-lib copyPages
- Invoice PDF includes Torke batch IDs per line item as a unique differentiator, with VAT breakdown and payment terms by method
- BACS proforma invoice prominently displays bank details (bank name, sort code, account number) with order number as payment reference
- Download API endpoints for both cert packs (/api/certpack/[orderId]) and invoices (/api/invoice/[orderId]?type=proforma) with on-demand generation and R2 caching
- 9 tests passing across both services (4 certpack + 5 invoice)

## Task Commits

Each task was committed atomically:

1. **Task 1: Cert pack service with cover page and PDF merging** - `10b11d1` (feat)
2. **Task 2: Invoice and proforma PDF service with batch references** - `03e065b` (feat)

## Files Created/Modified
- `src/server/services/certpack-service.ts` - Cert pack PDF generation with cover page, traceability table, and cert merging
- `src/server/services/invoice-service.ts` - Invoice and proforma PDF generation with batch references and bank details
- `src/app/api/certpack/[orderId]/route.ts` - GET endpoint for cert pack download with on-demand generation
- `src/app/api/invoice/[orderId]/route.ts` - GET endpoint for invoice/proforma download with ?type=proforma support
- `src/server/storage.ts` - Added downloadFile function for R2 object retrieval
- `src/__tests__/certpack/certpack.test.ts` - 4 tests for cert pack generation, table content, error handling, R2 upload
- `src/__tests__/invoice/invoice.test.ts` - 5 tests for invoice generation, batch IDs, proforma, DB record, R2 upload

## Decisions Made
- pdf-lib chosen for all PDF generation (zero native dependencies, works in Edge and Node runtimes)
- Cert page references pre-calculated using dual-pass approach: first pass loads certs to count pages, second pass builds cover page with correct page numbers
- Proforma invoices have no invoice number since they are not tax documents per HMRC requirements
- Bank details sourced from environment variables (TORKE_BANK_NAME, TORKE_SORT_CODE, TORKE_ACCOUNT_NUMBER) with placeholder defaults for development
- Shared PDF layout helpers (header, details, addresses, line items, totals, footer) between invoice and proforma to reduce code duplication

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added downloadFile to storage.ts**
- **Found during:** Task 1 (Cert pack service)
- **Issue:** storage.ts had upload and URL functions but no way to download file bytes from R2, needed for cert pack PDF merging
- **Fix:** Added downloadFile function using GetObjectCommand with stream-to-Buffer conversion
- **Files modified:** src/server/storage.ts
- **Verification:** Cert pack tests pass with mocked downloadFile
- **Committed in:** 10b11d1 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** downloadFile was an essential prerequisite for cert PDF fetching. No scope creep.

## Issues Encountered
None - both tasks executed cleanly.

## User Setup Required
None - pdf-lib has zero native dependencies. Bank details use placeholder values with TODO for production configuration.

## Next Phase Readiness
- Cert pack and invoice services ready for integration with order dispatch flow (Plan 04)
- Proforma generation ready to be called from BACS payment flow (Plan 07)
- Download endpoints ready for customer order history UI (Plan 06)
- Bank details env vars need production values before BACS go-live

---
*Phase: 02-e-commerce-order-flow-wms*
*Completed: 2026-03-04*
