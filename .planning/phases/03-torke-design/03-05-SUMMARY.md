---
phase: 03-torke-design
plan: 05
subsystem: api
tags: [pdf-lib, trpc, pdf-generation, r2-storage, presigned-url]

requires:
  - phase: 03-torke-design/01
    provides: "EN 1992-4 calc engine (calculateAnchorDesign, types, validation)"
  - phase: 03-torke-design/02
    provides: "calculations DB schema table"
  - phase: 03-torke-design/04
    provides: "Results display with action bar stubs"
provides:
  - "generateCalcReport PDF service for branded engineering reports"
  - "calculationsRouter with save/load/list/exportPdf/delete procedures"
  - "CALC-YYYY-NNNNNN reference generation"
affects: [03-torke-design/06]

tech-stack:
  added: []
  patterns: ["pdf-lib multi-page report with state object pattern", "server-side calc re-execution for integrity"]

key-files:
  created:
    - src/server/services/calc-report-service.ts
    - src/server/trpc/routers/calculations.ts
    - src/__tests__/calc-report/calc-report.test.ts
  modified:
    - src/server/trpc/router.ts

key-decisions:
  - "PDF report uses PageState object pattern for multi-page flow control"
  - "Scope limitations footer on every page (5.5pt font to fit single line)"
  - "Presigned R2 download URLs with 24h expiry for PDF exports"

patterns-established:
  - "PageState pattern: mutable state object for multi-page PDF builders"
  - "Server-side calc re-execution before save/export (DESIGN-06 integrity)"

requirements-completed: [DESIGN-06, DESIGN-11, DESIGN-12, DESIGN-13, DESIGN-18]

duration: 6min
completed: 2026-03-05
---

# Phase 3 Plan 5: PDF Report + Calculations Router Summary

**Branded PDF report generator with cover page, per-failure-mode sections, and summary page; tRPC router for save/load/list/export/delete behind auth gates**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-05T08:22:09Z
- **Completed:** 2026-03-05T08:28:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- PDF report with Torke branding cover page, TOC, inputs summary, 7 failure mode sections with clause refs/formulas/intermediate values, combined interaction, and summary page with governing mode highlight
- Scope limitations footer on every page with page numbers
- Calculations tRPC router with 5 procedures (save, load, list, exportPdf, delete) all requiring authentication
- Server-side re-execution of calculateAnchorDesign before save/export ensures calculation integrity

## Task Commits

Each task was committed atomically:

1. **Task 1: PDF report service (TDD)** - `d09ef68` (feat)
2. **Task 2: Calculations tRPC router** - `ba6743b` (feat)

## Files Created/Modified
- `src/server/services/calc-report-service.ts` - PDF report generator using pdf-lib with cover, TOC, inputs, failure modes, summary
- `src/server/trpc/routers/calculations.ts` - tRPC router for calculation CRUD and PDF export
- `src/__tests__/calc-report/calc-report.test.ts` - Tests for PDF generation (valid bytes, header, page count)
- `src/server/trpc/router.ts` - Added calculationsRouter to main app router

## Decisions Made
- PDF report uses a PageState mutable object pattern for tracking current page/y-position across section builders
- Scope limitations footer compressed to 5.5pt font to fit on one line across all pages
- Presigned R2 download URLs with 24-hour expiry for exported PDFs
- CALC-YYYY-NNNNNN reference generation reuses the MAX-query-in-transaction pattern from order numbers

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- TypeScript type mismatch between Zod-inferred input (where projectName/engineerName are optional) and DesignInputs type (where they are required strings). Resolved with explicit defaults and `as DesignInputs` cast after providing defaults.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- PDF export and save/load ready for wiring into the action bar (Plan 06)
- All auth gates in place via protectedProcedure
- calculationsRouter registered and ready for client-side consumption

---
*Phase: 03-torke-design*
*Completed: 2026-03-05*
