---
phase: 04-portals-marketing-polish
plan: 03
subsystem: content, seo
tags: [mdx, next-mdx, gray-matter, schema-dts, json-ld, blog, structured-data]

requires:
  - phase: 01-foundation
    provides: "Next.js app structure, layout components, product pages"
provides:
  - "MDX blog infrastructure with getAllPosts/getPostBySlug utilities"
  - "3 technical launch articles (embedment depth, EN 1992-4, chemical vs mechanical)"
  - "JSON-LD schema markup system (Product, Article, Organization, Breadcrumb, FAQ, HowTo)"
  - "JsonLd reusable component with schema-dts type safety"
  - "Blog route group with listing page and dynamic post pages"
affects: [04-portals-marketing-polish, content-strategy]

tech-stack:
  added: ["@next/mdx", "@mdx-js/loader", "@mdx-js/react", "gray-matter", "schema-dts"]
  patterns: ["MDX content pipeline with gray-matter frontmatter", "JSON-LD structured data via schema-dts typed helpers", "Blog route group separate from shop layout"]

key-files:
  created:
    - src/lib/mdx.ts
    - src/lib/schema-markup.ts
    - src/components/seo/JsonLd.tsx
    - src/components/blog/BlogCard.tsx
    - src/components/blog/BlogCategoryFilter.tsx
    - src/app/(blog)/layout.tsx
    - src/app/(blog)/blog/page.tsx
    - src/app/(blog)/blog/[slug]/page.tsx
    - content/blog/understanding-embedment-depth.mdx
    - content/blog/en-1992-4-anchor-design-guide.mdx
    - content/blog/choosing-chemical-vs-mechanical-anchors.mdx
    - mdx-components.tsx
  modified:
    - next.config.ts
    - src/app/layout.tsx
    - src/app/(shop)/products/[slug]/page.tsx
    - src/components/layout/Header.tsx
    - src/components/layout/MobileNav.tsx

key-decisions:
  - "Blog content files in /content/blog/ outside app dir, loaded via gray-matter + dynamic import"
  - "Blog route group (blog) uses separate layout from shop for simpler content-focused nav"
  - "Client-side category filter (BlogCategoryFilter) sufficient for small post count"
  - "mdx-components.tsx required at root for @next/mdx App Router integration"

patterns-established:
  - "MDX content pipeline: frontmatter parsed with gray-matter, MDX component via dynamic import"
  - "JSON-LD pattern: schema-markup.ts helpers + JsonLd generic component"
  - "Blog article frontmatter: title, description, date, category, author, tags"

requirements-completed: [MKTG-01, MKTG-02]

duration: 6min
completed: 2026-03-05
---

# Phase 4 Plan 03: Blog + SEO Schema Markup Summary

**MDX blog with 3 technical articles on anchor design and JSON-LD structured data (Product, Article, Organization, Breadcrumb) across site**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-05T10:07:47Z
- **Completed:** 2026-03-05T10:13:54Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- MDX blog infrastructure with gray-matter frontmatter parsing, reading time calculation, and category filtering
- 3 genuine technical articles: embedment depth guide, EN 1992-4 overview, chemical vs mechanical comparison
- Type-safe JSON-LD structured data system using schema-dts across product pages, blog posts, and root layout
- Blog and Design Tool links added to Header and MobileNav

## Task Commits

Each task was committed atomically:

1. **Task 1: MDX infrastructure, blog pages, and 3 launch articles** - `02c8ba3` (feat)
2. **Task 2: JSON-LD schema markup across site** - `eb19294` (feat)

## Files Created/Modified
- `src/lib/mdx.ts` - MDX utilities: getAllPosts, getPostBySlug with frontmatter parsing
- `src/lib/schema-markup.ts` - JSON-LD helpers: productSchema, articleSchema, organizationSchema, breadcrumbSchema, faqSchema, howToSchema
- `src/components/seo/JsonLd.tsx` - Generic JSON-LD script component with schema-dts types
- `src/components/blog/BlogCard.tsx` - Dark card with category badge, reading time, hover lift
- `src/components/blog/BlogCategoryFilter.tsx` - Client-side category pill filter
- `src/app/(blog)/layout.tsx` - Blog route group layout with Torke header/footer
- `src/app/(blog)/blog/page.tsx` - Blog listing page with category filter grid
- `src/app/(blog)/blog/[slug]/page.tsx` - Individual post page with MDX rendering and prose styling
- `content/blog/understanding-embedment-depth.mdx` - Technical guide on hef and concrete cone breakout
- `content/blog/en-1992-4-anchor-design-guide.mdx` - EN 1992-4 design process overview
- `content/blog/choosing-chemical-vs-mechanical-anchors.mdx` - Chemical vs mechanical anchor comparison
- `mdx-components.tsx` - Required root-level MDX components file for Next.js
- `next.config.ts` - Updated with @next/mdx wrapper and pageExtensions
- `src/app/layout.tsx` - Added Organization JSON-LD to root layout
- `src/app/(shop)/products/[slug]/page.tsx` - Added Product + BreadcrumbList JSON-LD
- `src/components/layout/Header.tsx` - Added Blog and Design nav links
- `src/components/layout/MobileNav.tsx` - Added Blog and Design Tool links

## Decisions Made
- Blog content files stored in /content/blog/ (outside app directory) and loaded via gray-matter for frontmatter + dynamic import for MDX component
- Blog uses separate route group layout from shop for a simpler, content-focused navigation
- Client-side category filter (BlogCategoryFilter) chosen over server-side since post count is small
- mdx-components.tsx file created at project root as required by @next/mdx for App Router

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created mdx-components.tsx**
- **Found during:** Task 1 (MDX infrastructure setup)
- **Issue:** @next/mdx with App Router requires mdx-components.tsx at project root
- **Fix:** Created mdx-components.tsx with useMDXComponents export
- **Files modified:** mdx-components.tsx
- **Committed in:** 02c8ba3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for MDX to function. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Blog infrastructure ready for additional articles
- JSON-LD system provides faqSchema and howToSchema for glossary and guide pages in Plan 04
- Schema markup extensible for future product types

---
*Phase: 04-portals-marketing-polish*
*Completed: 2026-03-05*
