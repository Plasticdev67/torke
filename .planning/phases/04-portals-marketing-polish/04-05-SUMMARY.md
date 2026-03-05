---
phase: 04-portals-marketing-polish
plan: 05
subsystem: marketing
tags: [lead-generation, soft-prompt, admin-dashboard, trpc, localStorage]

requires:
  - phase: 03-torke-design
    provides: "Design tool with auth gate, calculation engine, and saved calculations"
  - phase: 04-01
    provides: "Account pages with tab navigation pattern"
  - phase: 04-03
    provides: "Blog and SEO schema markup"
provides:
  - "SoftPrompt component for anonymous user lead capture"
  - "Company name capture in AuthGateModal signup flow"
  - "Unified account dashboard with design calculations + shop orders"
  - "Admin lead list page with stats, filters, and pagination"
  - "leadsRouter with list and stats tRPC procedures"
affects: [04-06, future-email-automation]

tech-stack:
  added: []
  patterns: ["localStorage calc counter with custom event dispatch", "Raw SQL joins for cross-table admin analytics"]

key-files:
  created:
    - src/components/design/SoftPrompt.tsx
    - src/server/trpc/routers/leads.ts
    - src/app/(wms)/leads/page.tsx
  modified:
    - src/components/design/AuthGateModal.tsx
    - src/app/(design)/design/page.tsx
    - src/components/shop/AccountDashboard.tsx
    - src/server/trpc/router.ts
    - src/app/(wms)/layout.tsx

key-decisions:
  - "SoftPrompt uses localStorage counter + custom event dispatch pattern for cross-component reactivity"
  - "Company field added to AuthGateModal (design tool) alongside existing register page coverage"
  - "Admin leads query uses raw SQL joins across user, calculations, orders, and user_profiles tables"
  - "Leads page at /leads within WMS layout (not nested /warehouse/admin/) matching existing nav pattern"

patterns-established:
  - "localStorage custom event: dispatch torke-calc-increment for decoupled component communication"
  - "Raw SQL analytics: warehouseProcedure with cross-table joins for admin reporting"

requirements-completed: [MKTG-05, MKTG-06, MKTG-07]

duration: 6min
completed: 2026-03-05
---

# Phase 4 Plan 05: Lead Generation Funnel Summary

**Soft prompt after 3+ anonymous calculations, company capture in auth gate, unified account dashboard, and admin lead list with conversion stats**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-05T10:17:07Z
- **Completed:** 2026-03-05T10:23:26Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- SoftPrompt component appears as non-blocking banner after 3+ anonymous calculations with 24h dismiss cooldown
- Company name field added to AuthGateModal signup flow (design tool auth gate) with profile creation
- Unified account dashboard shows Torke TRACE section with calculation count and gentle order prompt
- Admin lead list page at /leads with stat cards (total, weekly, monthly, converted), date/status filters, and paginated table
- leadsRouter registered in main router with list and stats warehouse procedures

## Task Commits

Each task was committed atomically:

1. **Task 1: Lead capture polish** - `34ce5ff` (feat)
2. **Task 2: Admin lead list page** - `e762848` (feat)

## Files Created/Modified
- `src/components/design/SoftPrompt.tsx` - Non-blocking banner prompt with localStorage tracking and 24h dismiss cooldown
- `src/components/design/AuthGateModal.tsx` - Added company name field to signup form with profile creation API call
- `src/app/(design)/design/page.tsx` - Wired SoftPrompt rendering and calc count incrementing for anonymous users
- `src/components/shop/AccountDashboard.tsx` - Added Torke TRACE section with calc count and order prompt
- `src/server/trpc/routers/leads.ts` - Lead list and stats tRPC procedures with raw SQL cross-table joins
- `src/server/trpc/router.ts` - Registered leadsRouter
- `src/app/(wms)/leads/page.tsx` - Admin lead list page with stat cards, filters, and paginated table
- `src/app/(wms)/layout.tsx` - Added Leads nav item to WMS sidebar

## Decisions Made
- SoftPrompt uses localStorage counter with custom DOM event dispatch for decoupled communication between design page and prompt component
- Company field added to AuthGateModal (design tool signup) alongside existing /register page -- both flows now capture company
- Admin leads query uses raw SQL with joins across Better Auth user table, user_profiles, calculations, and orders for analytics
- Leads page placed at /leads within WMS layout matching existing flat nav pattern (not nested admin subdirectory)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added company name to AuthGateModal**
- **Found during:** Task 1
- **Issue:** Plan mentioned checking auth gate for company field. AuthGateModal (used for design tool signups) was missing company field while /register page already had it
- **Fix:** Added companyName state, input field, and profile creation API call to AuthGateModal signup flow
- **Files modified:** src/components/design/AuthGateModal.tsx
- **Verification:** TypeScript compiles cleanly
- **Committed in:** 34ce5ff (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for MKTG-06 requirement. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Lead generation funnel is complete: anonymous design tool usage -> soft prompt -> account creation -> admin visibility
- Email automation for lead nurturing deferred to v2 as specified in plan
- Ready for Plan 04-06 (final polish/cleanup)

---
*Phase: 04-portals-marketing-polish*
*Completed: 2026-03-05*
