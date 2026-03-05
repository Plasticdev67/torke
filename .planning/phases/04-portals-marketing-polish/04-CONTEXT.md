# Phase 4: Portals + Marketing + Polish - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the traceability surface with customer and end-client portals, launch content/SEO, activate Torke TRACE as a lead generation funnel, and rebrand existing Proventure documents. This phase does NOT add new e-commerce features, new calculation capabilities, or new WMS workflows — it surfaces existing data to new audiences and adds marketing content.

</domain>

<decisions>
## Implementation Decisions

### Cert Portal Search & UX
- New dedicated tab "Certifications" within the existing account dashboard (alongside Orders and Addresses)
- Full search: order number, Torke batch ID, product code, and date range — covers audit scenarios where contractor has a batch sticker
- Per-order cert pack download (already built) PLUS bulk ZIP download for selecting multiple orders — useful for project handover
- Individual 3.1 cert PDFs downloadable separately in addition to full cert pack — auditors often need one specific cert
- Cert portal reuses existing `orders.myOrderDetail` tRPC, `/api/certpack/{orderId}` endpoint, and `batches.getByToken` query

### End-Client Verification Sharing
- Per-order share links as the primary model — contractor generates a unique read-only link for a specific order
- Project grouping (assign orders to named projects, share one project link) as a stretch goal — adds significant value for multi-order projects but more complex
- Verification links never expire — matches TRACE-18 philosophy (permanent URLs, 50+ year building lifespan)
- End-client sees rich view: project name, product list with quantities, batch IDs, supplier name, manufacturer, heat numbers, goods-in date, dispatch date, and downloadable 3.1 cert PDFs — full audit trail
- Co-branded: Torke branding with contractor's company name displayed ("Fixings supplied by [Contractor], verified by Torke")
- Extends existing `/t/[token]` verification page pattern — new tokens for order-level and project-level sharing

### Blog, Glossary & Content Strategy
- MDX files stored in the repository for blog content — zero infrastructure cost, version controlled, deploys with the app
- Launch with articles + downloadable resource library + searchable technical glossary (MKTG-01, MKTG-03, MKTG-04)
- Article types: installation guides, Eurocode explainers, product comparisons, specification guidance
- Resource library: downloadable technical datasheets, ETAs, DoPs per product — linked from product detail pages
- Glossary: searchable key/definition pairs targeting informational search queries (e.g. "embedment depth", "characteristic resistance")
- Full structured data: Product, Article, FAQ, Breadcrumb, Organization, and HowTo schemas across the site (MKTG-02)
- Document rebranding (MKTG-08/09/10): PDF template system that applies Torke branding (header, footer, colours, logo) to content — enables consistent docs for future products

### Lead Gen Funnel & Account Capture
- Keep current gating (calculate freely, gate save + PDF export) PLUS add soft non-blocking prompts — after multiple calculations, nudge "save your work" / show account benefits
- Capture email + name + company at signup from Torke TRACE — company name helps qualify leads without excessive friction
- Welcome flow for design-to-shop transition: when a design-only user first visits the shop, brief onboarding ("You can order the fixings you just designed")
- Single account system already unified via Better Auth — no merge needed, just surface both calculations and orders in the account dashboard
- Basic admin lead list: simple page showing recent signups from design tool (name, email, company, date, calculation count) — enough to validate the funnel

### Claude's Discretion
- Cert portal UI layout and component structure
- Search result pagination and sorting defaults
- ZIP generation approach (server-side vs streaming)
- Verification share link token format and URL structure
- MDX processing pipeline and frontmatter schema
- Glossary data structure (MDX files vs JSON)
- Schema markup utility implementation
- PDF template system architecture for document rebranding
- Soft prompt timing and copy
- Admin lead list page design and filtering

</decisions>

<specifics>
## Specific Ideas

- Verification page should feel trustworthy and official — existing light theme (exception to dark site theme) is correct for certificate-like presentation
- Co-branded verification: contractor's company name should be prominent but Torke identity should be clear — this builds Torke's reputation with end-clients who may not know the brand yet
- Blog content should establish Torke as a technical authority — not marketing fluff, genuine engineering content
- The cert portal search experience should be fast and forgiving — contractors on site searching on a phone need results quickly
- Resource library PDFs should be accessible from product detail pages (MKTG-09) — engineer reading specs should find datasheets right there

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `certpack-service.ts` (530 lines): Full cert pack PDF generation with pdf-lib — reuse for bulk ZIP
- `qr-service.ts`: QR generation in 3 formats (data URL, buffer, SVG) — reuse for verification share links
- `AccountDashboard.tsx`: Existing account portal with tabs — extend with Certifications tab
- `OrderDetail.tsx`: Order view with batch allocations — reference for cert portal result display
- `/t/[token]/page.tsx`: Public verification page — template for end-client portal
- `email-service.ts`: Resend integration — reuse for verification share notifications
- `calc-report-service.ts`: PDF report generation — reference pattern for document template system
- Better Auth with `protectedProcedure` / `warehouseProcedure` — auth patterns established

### Established Patterns
- tRPC routers by domain with Zod validation — add `blog`, `certs`, `verification` routers
- R2 storage with presigned URLs — reuse for resource library PDFs and rebranded documents
- pdf-lib for all PDF generation — use for document template system
- React Email + Resend for transactional emails — reuse for share link notifications
- Dark theme default with zinc/slate + Torke red (#C41E3A) accents
- `force-dynamic` on pages needing DB queries at runtime
- Zustand stores for client state (cart, design) — may need for cert search filters

### Integration Points
- Product detail pages (`/products/[slug]`): Add resource library downloads and schema markup
- Account dashboard (`/account`): Add Certifications tab
- Root layout: Add blog nav link, Organization schema
- Orders tRPC router: Extend for cert search queries and verification link generation
- Verification tokens table: Extend or create new table for order-level/project-level share tokens
- Middleware: May need public routes for verification share links and blog pages

</code_context>

<deferred>
## Deferred Ideas

- Email/CRM automation (welcome sequences, reorder reminders) — v2 backlog
- CPD/accredited training platform — v2 backlog
- Project hub (grouping orders, certs, calcs under named projects) — v2 backlog (per-project verification links are a lightweight version)
- Admin analytics dashboard (conversion funnels, usage metrics) — v2 backlog

</deferred>

---

*Phase: 04-portals-marketing-polish*
*Context gathered: 2026-03-05*
