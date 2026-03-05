---
phase: 04-portals-marketing-polish
plan: 04
subsystem: ui
tags: [pdf-lib, glossary, resources, faq-schema, json-ld, search]

requires:
  - phase: 01-foundation
    provides: "Product schema with datasheetUrl field and category structure"
  - phase: 04-03
    provides: "Blog layout, JSON-LD schema helpers, JsonLd component"
provides:
  - "Resource library page (/resources) with category filtering and search"
  - "Technical glossary page (/glossary) with 31 terms and FAQ structured data"
  - "PDF template system (applyTorkeBranding, createBrandedDocument) for Torke-branded documents"
  - "Product detail page Technical Documents section with datasheet downloads"
affects: [04-05, 04-06]

tech-stack:
  added: []
  patterns: ["Reusable PDF branding template extracted from certpack-service pattern", "Client-side resource filtering with server-fetched data", "FAQ JSON-LD from glossary data for featured snippets"]

key-files:
  created:
    - src/lib/pdf-template.ts
    - src/app/(blog)/resources/page.tsx
    - src/app/(blog)/resources/ResourceFilter.tsx
    - src/app/(blog)/glossary/page.tsx
    - src/components/blog/GlossarySearch.tsx
    - content/glossary.json
  modified:
    - src/app/(shop)/products/[slug]/page.tsx
    - src/app/(blog)/layout.tsx

key-decisions:
  - "ResourceFilter as client component for category/search filtering with server-fetched product data"
  - "Glossary terms imported via relative path from content/glossary.json (outside src/)"
  - "FAQ schema maps each glossary term to 'What is [term]?' question format for featured snippets"
  - "PDF template extracted header/footer pattern from certpack-service into reusable utility"

patterns-established:
  - "Content JSON files in /content/ directory for structured data (glossary, resources)"
  - "Client-side filtering pattern for small datasets served from server components"

requirements-completed: [MKTG-03, MKTG-04]

duration: 5min
completed: 2026-03-05
---

# Phase 4 Plan 04: Resource Library & Technical Glossary Summary

**Resource library with categorised datasheet downloads, 31-term technical glossary with FAQ schema markup, and reusable PDF branding template system**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-05T10:17:04Z
- **Completed:** 2026-03-05T10:22:12Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Resource library page listing all products with datasheets, grouped by category with search and filtering
- Technical glossary with 31 fixings engineering terms, real-time search, category filters, and expandable definitions
- FAQ structured data (JSON-LD) on glossary page targeting featured snippets for each term
- PDF template system with `applyTorkeBranding` and `createBrandedDocument` for consistent Torke branding on future documents
- Product detail pages now show Technical Documents section with datasheet download link
- Resources and Glossary links added to blog layout navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Resource library page and product page resource links** - `97cc44b` (feat)
2. **Task 2: Technical glossary with search and FAQ schema** - `5d7f098` (feat)

## Files Created/Modified
- `src/lib/pdf-template.ts` - Reusable PDF branding template (header bar, footer, branded document creation)
- `src/app/(blog)/resources/page.tsx` - Resource library server component with DB query for products with datasheets
- `src/app/(blog)/resources/ResourceFilter.tsx` - Client-side resource filtering by category and search
- `content/glossary.json` - 31 technical fixings engineering terms with definitions and categories
- `src/components/blog/GlossarySearch.tsx` - Glossary search/filter client component with expandable cards
- `src/app/(blog)/glossary/page.tsx` - Glossary page with FAQ JSON-LD structured data
- `src/app/(shop)/products/[slug]/page.tsx` - Added Technical Documents section with download link
- `src/app/(blog)/layout.tsx` - Added Resources and Glossary navigation links

## Decisions Made
- ResourceFilter as client component for category/search filtering with server-fetched product data
- Glossary terms imported via relative path from content/glossary.json (outside src/ directory)
- FAQ schema maps each glossary term to "What is [term]?" question format for featured snippets
- PDF template extracted header/footer pattern from certpack-service into reusable utility

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Resource library and glossary ready for production
- PDF template system ready for MKTG-10 (document rebranding) in future plans
- Blog navigation updated with both new pages

---
*Phase: 04-portals-marketing-polish*
*Completed: 2026-03-05*
