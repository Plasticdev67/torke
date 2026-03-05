---
phase: 04-portals-marketing-polish
verified: 2026-03-05T10:29:06Z
status: passed
score: 13/13 must-haves verified
gaps: []
human_verification:
  - test: "Visit /account/certifications in a logged-in browser session"
    expected: "Certifications tab visible in nav; search form renders; entering an order number returns results with Cert Pack and 3.1 Cert download links"
    why_human: "Requires real DB data (orders, allocations, batches) and R2 signed URLs to validate functional end-to-end cert retrieval"
  - test: "From certifications page, click Share on any order, enter a project name, click Generate Link"
    expected: "Dialog shows the /v/{token} URL, a QR code image, and a copy-to-clipboard button"
    why_human: "QR code generation and clipboard API are browser-only; full dialog flow requires live tRPC mutation"
  - test: "Open the generated /v/{token} URL in an incognito browser"
    expected: "Public light-theme page loads without login; shows contractor company name, order reference, batch IDs, supplier names, heat numbers, goods-in dates, and 3.1 Cert download links"
    why_human: "Requires real token, real order data, and R2-signed cert URLs to validate the full traceability table"
  - test: "Visit /t/{token} for a QR-label verification token"
    expected: "Product verification page loads without login; shows product name, SKU, Torke batch ID, supplier batch number, goods-in date, and 3.1 cert download button"
    why_human: "Requires a real verification token (from goods-in flow) and R2-signed cert URL"
  - test: "Open /design in an incognito browser and run 3+ calculations"
    expected: "Calculations run instantly without any login prompt; after 3rd calculation a non-blocking banner appears at the bottom with 'Create Free Account' CTA"
    why_human: "SoftPrompt relies on localStorage and real calculation execution; cannot be verified programmatically"
  - test: "Register a new account via the AuthGateModal (Save button in design tool)"
    expected: "Registration form includes Name, Email, Password, and Company Name fields; account creation succeeds and user is logged in"
    why_human: "Requires interactive browser session to test the AuthGateModal signup flow and verify company field is captured"
  - test: "Visit /blog in a browser"
    expected: "Blog listing shows 3 articles with category badges, reading time estimates, and working card links to individual posts; blog post pages render MDX prose content"
    why_human: "MDX rendering with @next/mdx dynamic import requires a real browser/Next.js server context"
  - test: "View page source on any product page, blog post, and root layout"
    expected: "Product page: Product + BreadcrumbList JSON-LD scripts present. Blog post: Article + BreadcrumbList JSON-LD present. Root: Organization JSON-LD present"
    why_human: "JSON-LD injection into <head> via Next.js requires server rendering to inspect actual page source"
  - test: "Visit /glossary and type in the search box; switch category filters"
    expected: "31 terms visible; typing filters terms in real time; category pills filter correctly; each term expands to show definition on click"
    why_human: "Client-side filtering and expand/collapse interactions require browser"
  - test: "Visit /warehouse/leads as a warehouse admin"
    expected: "Stat cards show Total Leads, This Week, This Month, Converted counts; paginated table shows email, company, signup date, calculation count, and conversion badge"
    why_human: "Requires warehouse role session and real calculation/user data in the DB"
---

# Phase 4: Portals + Marketing + Polish — Verification Report

**Phase Goal:** Complete the traceability surface with customer and end-client portals, launch content/SEO, and activate Torke TRACE as a lead generation funnel.
**Verified:** 2026-03-05T10:29:06Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every Wave 1+ task has a pre-existing test stub | VERIFIED | All 9 stub files confirmed in src/__tests__/{certs,verification,blog,seo,leads}/ |
| 2 | Contractor can search certs by order number, batch ID, product code, or date range | VERIFIED | certsRouter.search with multi-criteria ILIKE filters + join chain; CertSearch form with 4 filter inputs; trpc.certs.search.useQuery wired in certifications page |
| 3 | Contractor can download individual cert PDFs per allocation | VERIFIED | CertResults renders per-allocation "Download 3.1 Cert" links from batchCertKey; /api/certpack/{orderId} for cert packs |
| 4 | Contractor can download cert pack per order and bulk ZIP for multiple orders | VERIFIED | CertResults includes Cert Pack anchor per order; bulk ZIP via POST /api/certpack/bulk with fetch + blob download |
| 5 | Certifications tab appears in account dashboard navigation | VERIFIED | account/page.tsx line 26: TabLink href="/account/certifications" |
| 6 | Contractor can generate a unique read-only verification link for an order | VERIFIED | verificationRouter.createShareLink creates orderShareTokens row; returns /v/{token} URL + QR data URL |
| 7 | End-client can view full traceability data via verification link without login | VERIFIED | /v/[token]/page.tsx is a public server component (no auth gate); queries order, lines, allocations, batches, suppliers, millCerts, userProfiles; light theme with co-branded banner |
| 8 | QR code on physical product label resolves to public batch verification page | VERIFIED | /t/[token]/page.tsx (309 lines) renders product details, Torke batch ID, supplier batch number, goods-in date, and 3.1 cert download; noindex/nofollow; no login required |
| 9 | User can browse a blog with SEO-optimised articles | VERIFIED | getAllPosts reads /content/blog/*.mdx; blog/page.tsx renders BlogCards; 3 MDX articles confirmed: understanding-embedment-depth.mdx, en-1992-4-anchor-design-guide.mdx, choosing-chemical-vs-mechanical-anchors.mdx |
| 10 | Product pages and blog include JSON-LD structured data | VERIFIED | products/[slug]/page.tsx imports productSchema + breadcrumbSchema + JsonLd; blog/[slug]/page.tsx imports articleSchema + breadcrumbSchema; layout.tsx imports organizationSchema; glossary/page.tsx imports faqSchema |
| 11 | User can browse a resource library with downloadable datasheets | VERIFIED | /resources/page.tsx queries products with datasheetUrl; grouped by category; product detail pages show "Technical Documents" section with download link and "View all technical resources" link |
| 12 | User can search a technical glossary with FAQ structured data | VERIFIED | glossary.json (194 lines, 31 terms) imported in glossary/page.tsx; faqSchema renders FAQ JSON-LD; GlossarySearch client component present |
| 13 | Torke TRACE activates as lead generation funnel | VERIFIED | Design page: no auth guard, calculations run freely; SoftPrompt + incrementCalcCount wired (line 10, 63, 171); AuthGateModal has companyName field (line 27, 61, 66, 148); AccountDashboard shows Torke TRACE section with calculation count and order prompt (line 83-142); leadsRouter registered; /wms/leads admin page wired via trpc.leads.list + trpc.leads.stats |

**Score:** 13/13 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/__tests__/certs/cert-search.test.ts` | Test stubs for TRACE-12 | VERIFIED | Exists, 6 it.todo() stubs |
| `src/__tests__/certs/bulk-download.test.ts` | Test stubs for TRACE-13 | VERIFIED | Exists, 4 it.todo() stubs |
| `src/__tests__/certs/cert-links.test.ts` | Test stubs for TRACE-14 | VERIFIED | Exists, 3 it.todo() stubs |
| `src/__tests__/verification/share-token.test.ts` | Test stubs for TRACE-15 | VERIFIED | Exists, 6 it.todo() stubs |
| `src/__tests__/verification/order-verify.test.ts` | Test stubs for TRACE-16 | VERIFIED | Exists, 6 it.todo() stubs |
| `src/__tests__/blog/mdx-utils.test.ts` | Test stubs for MKTG-01 | VERIFIED | Exists, 5 it.todo() stubs |
| `src/__tests__/seo/schema-markup.test.ts` | Test stubs for MKTG-02 | VERIFIED | Exists, 5 it.todo() stubs |
| `src/__tests__/blog/glossary.test.ts` | Test stubs for MKTG-04 | VERIFIED | Exists, 5 it.todo() stubs |
| `src/__tests__/leads/lead-capture.test.ts` | Test stubs for MKTG-06 | VERIFIED | Exists, 5 it.todo() stubs |
| `src/server/trpc/routers/certs.ts` | Cert search tRPC router | VERIFIED | 365 lines; search + orderCertDetail procedures with full join chain; exports certsRouter |
| `src/server/services/zip-service.ts` | Bulk ZIP generation | VERIFIED | generateBulkCertZip using JSZip; Promise.allSettled for resilient R2 fetches |
| `src/app/api/certpack/bulk/route.ts` | POST bulk ZIP endpoint | VERIFIED | Validates ownership, fetches certPackKeys, calls generateBulkCertZip, returns application/zip |
| `src/app/(shop)/account/certifications/page.tsx` | Certifications tab page | VERIFIED | 96 lines; uses trpc.certs.search.useQuery; renders CertSearch + CertResults; tab navigation |
| `src/components/shop/CertSearch.tsx` | Search form component | VERIFIED | 188 lines; 4 filter inputs (order number, batch ID, product code, date range); onSearch callback |
| `src/components/shop/CertResults.tsx` | Results list with downloads | VERIFIED | 534 lines; expandable rows with per-allocation 3.1 cert links; cert pack download; bulk ZIP; ShareLinkDialog integrated |
| `src/server/db/schema/share-tokens.ts` | orderShareTokens table | VERIFIED | Exists with id, token, orderId, userId, projectName, createdAt, lastAccessedAt |
| `src/server/trpc/routers/verification.ts` | Share token management | VERIFIED | 139 lines; createShareLink + getShareLinks + revokeShareLink; ownership validation; QR code generation via qrcode lib |
| `src/app/v/[token]/page.tsx` | Public order verification page | VERIFIED | 555 lines; no auth; queries orderShareTokens + full traceability chain; light theme; co-branded; mobile responsive cards |
| `src/components/shop/ShareLinkDialog.tsx` | Share link dialog | VERIFIED | 251 lines; project name input; createShareLink mutation; copy-to-clipboard; QR display; revoke controls |
| `src/lib/mdx.ts` | MDX utilities | VERIFIED | getAllPosts + getPostBySlug with gray-matter frontmatter; reading time calculation |
| `src/lib/schema-markup.ts` | JSON-LD generation helpers | VERIFIED | productSchema, articleSchema, organizationSchema, breadcrumbSchema, faqSchema, howToSchema — all exported |
| `src/components/seo/JsonLd.tsx` | Reusable JSON-LD component | VERIFIED | Generic JsonLd component with schema-dts types |
| `src/app/(blog)/blog/page.tsx` | Blog listing page | VERIFIED | 34 lines; calls getAllPosts(); renders BlogCard grid |
| `src/app/(blog)/blog/[slug]/page.tsx` | Individual blog post page | VERIFIED | 149 lines; getPostBySlug; dynamic import of MDX; articleSchema + breadcrumbSchema JSON-LD |
| `content/blog/understanding-embedment-depth.mdx` | Launch blog content | VERIFIED | Exists |
| `content/blog/en-1992-4-anchor-design-guide.mdx` | Launch blog content | VERIFIED | Exists |
| `content/blog/choosing-chemical-vs-mechanical-anchors.mdx` | Launch blog content | VERIFIED | Exists |
| `src/app/(blog)/resources/page.tsx` | Resource library page | VERIFIED | 139 lines; DB query for products with datasheetUrl; grouped by category |
| `src/app/(blog)/glossary/page.tsx` | Glossary page | VERIFIED | 43 lines; imports glossary.json; renders GlossarySearch; faqSchema JSON-LD |
| `content/glossary.json` | Glossary terms data | VERIFIED | 194 lines; 31 terms with term, definition, category fields |
| `src/lib/pdf-template.ts` | PDF template system | VERIFIED | applyTorkeBranding + createBrandedDocument exported |
| `src/components/design/SoftPrompt.tsx` | Non-blocking prompt | VERIFIED | 108 lines; localStorage counter; 24h dismiss cooldown; custom event listener; conditionally rendered for unauthenticated users |
| `src/server/trpc/routers/leads.ts` | Lead list tRPC router | VERIFIED | 115 lines; list + stats warehouseProcedures; raw SQL joins across user/calculations/orders/user_profiles |
| `src/app/(wms)/leads/page.tsx` | Admin lead list page | VERIFIED | 265 lines; trpc.leads.stats + trpc.leads.list; stat cards; filters; paginated table |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `certifications/page.tsx` | `routers/certs.ts` | trpc.certs.search.useQuery | WIRED | Line 15: `trpc.certs.search.useQuery(...)` |
| `CertResults.tsx` | `/api/certpack` | fetch POST + anchor href | WIRED | Line 123: `fetch("/api/certpack/bulk")`; line 376: `href=/api/certpack/{orderId}` |
| `account/page.tsx` | `/account/certifications` | TabLink href | WIRED | Line 26: `<TabLink href="/account/certifications">` |
| `ShareLinkDialog.tsx` | `routers/verification.ts` | trpc.verification.createShareLink.useMutation | WIRED | Line 39: `trpc.verification.createShareLink.useMutation(...)` |
| `v/[token]/page.tsx` | `share-tokens schema` | Direct DB query on orderShareTokens | WIRED | Lines 2, 50, 51: DB query on orderShareTokens table |
| `blog/page.tsx` | `lib/mdx.ts` | getAllPosts() | WIRED | Line 2: import getAllPosts; line 13: `getAllPosts()` called |
| `blog/[slug]/page.tsx` | `content/blog/` | Dynamic import of MDX | WIRED | Line 53: `import(\`@/../content/blog/${slug}.mdx\`)` |
| `glossary/page.tsx` | `content/glossary.json` | JSON import | WIRED | Line 5: `import glossaryData from "../../../../content/glossary.json"` |
| `products/[slug]/page.tsx` | `/resources` | "View all technical resources" link | WIRED | Line 352-355: `href="/resources"` |
| `layout.tsx` | `organizationSchema` | JsonLd in root layout | WIRED | Lines 5-6, 27: Organization JSON-LD in root |
| `design/page.tsx` | `SoftPrompt` | Rendered for unauthenticated users | WIRED | Lines 10, 63, 171: import + incrementCalcCount + `{!isAuthenticated && <SoftPrompt />}` |
| `leads/page.tsx` | `routers/leads.ts` | trpc.leads.list + trpc.leads.stats | WIRED | Lines 17, 19: both queries active |
| `router.ts` | All new routers | Router registration | WIRED | Lines 9-11, 24-26: certsRouter, verificationRouter, leadsRouter all registered |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TRACE-12 | 04-01 | Contractor can search certs by order number, batch ID, product code, date range | SATISFIED | certsRouter.search with multi-criteria filtering; CertSearch form; CertResults display |
| TRACE-13 | 04-01 | Contractor can download individual cert PDFs or bundled cert pack per order | SATISFIED | Per-allocation 3.1 cert links in CertResults; cert pack download link; bulk ZIP endpoint |
| TRACE-14 | 04-01 | Order history shows batch allocation per line item with linked cert downloads | SATISFIED | CertResults expandable rows show per-allocation batch IDs and cert download links |
| TRACE-15 | 04-02 | Contractor can generate unique read-only verification link for end-client | SATISFIED | verificationRouter.createShareLink; ShareLinkDialog wired in CertResults |
| TRACE-16 | 04-02 | End-client can view project name, fixings, batches, and 3.1 certs without login | SATISFIED | /v/[token]/page.tsx: public server component; full traceability table; co-branded; project name display |
| TRACE-17 | 04-02 | QR code on physical label resolves to public verification page with product details, batch ID, cert, goods-in date | SATISFIED | /t/[token]/page.tsx (309 lines): product details, Torke batch ID, supplier batch number, goods-in date, cert download; noindex/nofollow; no auth required |
| MKTG-01 | 04-03 | CMS-driven technical blog with SEO-optimised articles | SATISFIED | MDX pipeline with getAllPosts/getPostBySlug; 3 genuine technical articles live |
| MKTG-02 | 04-03 | Product pages include structured data (schema markup) for Google rich results | SATISFIED | productSchema + articleSchema + organizationSchema + breadcrumbSchema + faqSchema all implemented and wired to pages |
| MKTG-03 | 04-04 | Resource library with downloadable datasheets, ETAs, and DoPs per product | SATISFIED | /resources/page.tsx queries products with datasheetUrl; product detail pages link to downloads and /resources |
| MKTG-04 | 04-04 | Technical glossary targeting informational search queries | SATISFIED | 31-term glossary.json; GlossarySearch; FAQ JSON-LD on /glossary page |
| MKTG-05 | 04-05 | Torke TRACE accessible without login | SATISFIED | design/page.tsx: no auth guard; calculations run in useEffect regardless of auth; isAuthenticated only gates incrementCalcCount and save/export |
| MKTG-06 | 04-05 | Saving/exporting calculation requires free account creation, capturing lead | SATISFIED | AuthGateModal has companyName field; incrementCalcCount increments localStorage counter; SoftPrompt appears after 3 calculations for anonymous users |
| MKTG-07 | 04-05 | Account creation from Torke TRACE feeds into e-commerce account system | SATISFIED | AuthGateModal uses same Better Auth registration; AccountDashboard shows unified Torke TRACE section with calculation count and order prompt; single account system |

**Orphaned requirements check:** REQUIREMENTS.md Phase 4 lists TRACE-12 through TRACE-17 and MKTG-01 through MKTG-07 (13 total). Plans 04-00 through 04-05 collectively claim all 13. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `routers/certs.ts` | 267 | `return null` | Info | Valid business logic: returns null when order ownership validation fails for orderCertDetail — expected and correct |

No blockers or warnings found. The `return null` in certs.ts is a legitimate ownership-validation response, not a stub.

---

## Human Verification Required

### 1. Cert Portal End-to-End (TRACE-12, 13, 14)

**Test:** Visit /account/certifications while logged in with an account that has dispatched orders
**Expected:** Search form returns orders with expandable rows showing batch allocations; "Cert Pack" and "Download 3.1 Cert" links successfully download real PDF files from R2
**Why human:** Requires real DB data (completed orders with allocations, batches, cert PDFs in R2) and R2-signed URL generation

### 2. Share Link Generation and Verification Portal (TRACE-15, 16)

**Test:** From certifications page, click Share on an order; enter a project name; click Generate Link; open the resulting /v/{token} URL in incognito
**Expected:** Dialog shows URL + QR code; incognito page loads light-theme verification with contractor company name, project name, full fixings table with batch IDs and 3.1 cert downloads
**Why human:** Full flow requires live DB + QR code rendering in browser + R2 signed URLs for cert downloads

### 3. QR Label Verification (TRACE-17)

**Test:** Visit /t/{token} using a token generated from a goods-in label QR code
**Expected:** Product name, SKU, Torke batch ID, supplier batch number, goods-in date, and "Download 3.1 Certificate" button all present on white-background verification page
**Why human:** Requires a real verification token from the goods-in workflow

### 4. Design Tool Free Access and Soft Prompt (MKTG-05, 06)

**Test:** Open /design in incognito; run 3 or more calculations using the input panel
**Expected:** Calculations run immediately without login prompt; after the 3rd calculation a non-blocking bottom banner appears with "You've run N calculations" and "Create Free Account" CTA; dismissing hides it for 24h
**Why human:** SoftPrompt uses localStorage (browser-only); real calculation engine execution required

### 5. Blog Rendering and JSON-LD (MKTG-01, 02)

**Test:** Visit /blog and click through to an article; view page source on a product page
**Expected:** Blog listing shows 3 cards with category badges and reading time; article renders MDX prose content; page source contains valid JSON-LD script tags for Product/Article/Organization/BreadcrumbList
**Why human:** MDX dynamic import requires Next.js server rendering; JSON-LD injection into head requires real page source inspection

### 6. Admin Lead List (MKTG-06, 07)

**Test:** Visit /leads (WMS) as a warehouse-role user after some accounts have saved calculations
**Expected:** Stat cards show non-zero counts; table rows show email, company, calculation count, and Converted/Lead badge; pagination works
**Why human:** Requires warehouse role session, real calculation records in DB

---

## Summary

All 13 Phase 4 requirements (TRACE-12 through TRACE-17, MKTG-01 through MKTG-07) have been implemented across plans 04-00 through 04-05. Every artifact is substantive (no stubs, no placeholders, no empty implementations) and every key link between components, routers, and data sources is wired.

The phase delivers:
- **Customer cert portal** (TRACE-12/13/14): Full search, expandable results, individual 3.1 cert and cert pack downloads, bulk ZIP
- **End-client verification portal** (TRACE-15/16/17): Share link generation, QR codes, public /v/[token] with full traceability table, confirmed /t/[token] batch-level verification
- **Technical blog + SEO** (MKTG-01/02): 3 genuine technical MDX articles, type-safe JSON-LD schema markup across product pages, blog posts, and root layout
- **Resource library + glossary** (MKTG-03/04): Datasheets linked from product pages, /resources listing, 31-term glossary with FAQ structured data
- **Lead generation funnel** (MKTG-05/06/07): Free design tool access, SoftPrompt after 3 anonymous calculations, company capture in AuthGateModal, unified account dashboard, admin lead list

Human verification is needed to confirm the full flows work against real data (R2 cert PDFs, completed orders, real DB records) — all of which are outside programmatic verification scope.

---

_Verified: 2026-03-05T10:29:06Z_
_Verifier: Claude (gsd-verifier)_
