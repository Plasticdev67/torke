---
phase: 04-portals-marketing-polish
plan: 02
subsystem: api, ui
tags: [trpc, verification, share-links, qr-code, traceability, public-pages]

requires:
  - phase: 04-01
    provides: "CertResults component, certs tRPC router, certifications page"
  - phase: 02-05
    provides: "Cert pack generation, R2 storage for certificates"
  - phase: 01-04
    provides: "QR verification tokens, /t/[token] page, share-tokens schema"
provides:
  - "Verification tRPC router (createShareLink, getShareLinks, revokeShareLink)"
  - "ShareLinkDialog component for generating/managing share links"
  - "Public /v/[token] order verification page with full traceability table"
  - "Share button wired into CertResults for every order"
affects: [04-04, 04-05]

tech-stack:
  added: []
  patterns:
    - "Light theme exception for public verification pages (certificate trustworthiness)"
    - "Co-branded verification with contractor company name from userProfiles"
    - "Fire-and-forget lastAccessedAt updates on share token access"

key-files:
  created:
    - src/server/trpc/routers/verification.ts
    - src/components/shop/ShareLinkDialog.tsx
    - src/app/v/[token]/page.tsx
  modified:
    - src/server/trpc/router.ts
    - src/components/shop/CertResults.tsx

key-decisions:
  - "Share token QR codes generated inline via qrcode library (same as batch QR service)"
  - "Verification page uses light theme with red header bar matching /t/[token] pattern"
  - "Mobile-responsive card layout for on-site phone viewing by building inspectors"
  - "Fire-and-forget lastAccessedAt update to avoid blocking page render"

patterns-established:
  - "Order-level share tokens via orderShareTokens table with userId ownership check"
  - "Public verification pages at /v/ (order-level) vs /t/ (batch-level)"

requirements-completed: [TRACE-15, TRACE-16, TRACE-17]

duration: 5min
completed: 2026-03-05
---

# Phase 4 Plan 2: End-Client Verification Portal Summary

**Shareable order verification links with co-branded public traceability pages, QR codes, and per-line 3.1 cert downloads**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-05T10:17:02Z
- **Completed:** 2026-03-05T10:22:06Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Verification tRPC router with create/list/revoke share link endpoints including QR code generation
- ShareLinkDialog component with project name input, copy-to-clipboard, QR display, and link management
- Public /v/[token] order verification page showing full traceability chain (product, batch, supplier, heat number, goods-in date, 3.1 cert download)
- Co-branded display with contractor company name from userProfiles
- Confirmed existing /t/[token] page satisfies TRACE-17 (product details, batch ID, cert, goods-in date)

## Task Commits

Each task was committed atomically:

1. **Task 1: Verification router, share link dialog, and order verification page** - `c7f2416` (feat)
2. **Task 2: Public order verification page and QR verification check** - `ded936a` (feat)

## Files Created/Modified
- `src/server/trpc/routers/verification.ts` - Share token generation, listing, and revocation via tRPC
- `src/server/trpc/router.ts` - Registered verificationRouter
- `src/components/shop/ShareLinkDialog.tsx` - Dialog for generating/managing share links with QR codes
- `src/components/shop/CertResults.tsx` - Added Share button per order opening ShareLinkDialog
- `src/app/v/[token]/page.tsx` - Public order verification page with full traceability table

## Decisions Made
- Share token QR codes generated inline via the existing qrcode library (same as batch QR service)
- Verification page uses light theme with red header bar, matching existing /t/[token] pattern for certificate trustworthiness
- Mobile-responsive card layout included for on-site phone viewing (building inspectors, structural engineers)
- Fire-and-forget lastAccessedAt update to avoid blocking page render on public verification
- Revocation supported despite "links never expire" requirement, for security purposes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Verification portal complete, ready for testing with real order data
- /v/[token] and /t/[token] pages both functional for end-client and QR verification
- Share button accessible from certifications page for all orders

---
*Phase: 04-portals-marketing-polish*
*Completed: 2026-03-05*
