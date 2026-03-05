# Stack Research

## Recommended Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Frontend | Next.js (App Router) | 15.x |
| UI Framework | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Component Library | shadcn/ui | latest (copy-paste, not versioned) |
| Language | TypeScript | 5.7+ |
| Backend/API | Next.js API Routes + tRPC | tRPC 11.x |
| Database | PostgreSQL | 16 |
| ORM | Drizzle ORM | 0.38+ |
| 3D Visualization | Three.js via React Three Fiber | Three.js r170+, R3F 9.x |
| PDF Generation | @react-pdf/renderer | 4.x |
| QR Codes | qrcode (server) + react-qr-code (client) | qrcode 1.5+, react-qr-code 2.x |
| Search | Meilisearch | 1.12+ |
| Auth | Better Auth | 1.x |
| Hosting | Vercel (frontend) + Railway or Fly.io (services) | — |
| Payments | Stripe (with Stripe Billing for B2B accounts) | stripe-node 17.x |
| Email | Resend + React Email | Resend SDK 4.x, React Email 3.x |
| CRM | HubSpot (Free tier, then Sales Hub) | API v3 |
| File Storage | Cloudflare R2 | — |
| Monitoring | Sentry | @sentry/nextjs 9.x |
| Testing | Vitest + Playwright | Vitest 3.x, Playwright 1.49+ |

---

## Frontend

### Next.js 15 + React 19 + TypeScript 5.7

**Why Next.js 15 specifically:**
- App Router is now stable and mature. Server Components reduce client bundle size significantly — critical for a content-heavy e-commerce site where SEO matters.
- Server Actions eliminate the need for a separate API layer for mutations (add to cart, submit quote request, save calculation).
- Built-in image optimization (`next/image`) handles product photography at scale.
- ISR (Incremental Static Regeneration) lets you statically generate product pages while keeping prices/stock dynamic.
- Middleware handles geo-routing, auth checks, and A/B testing at the edge.
- React 19's `use()` hook and improved Suspense make data-fetching patterns cleaner.

**Why NOT a separate SPA for Torke TRACE:**
The calculation tool and the shop MUST live on the same Next.js app. This is architecturally important — the entire conversion funnel depends on zero friction between "I just designed this anchor plate" and "Add to cart." Separate apps mean separate auth, separate deployments, and a jarring UX transition. Use Next.js route groups: `(shop)` for e-commerce, `(design)` for the calc tool, `(wms)` for warehouse (can be behind auth).

### Tailwind CSS 4

- Utility-first CSS that works perfectly with component-based architecture.
- Tailwind 4 uses a CSS-first configuration approach (no more `tailwind.config.js`), faster builds via Oxide engine.
- The red/black/dark-grey Torke brand palette maps directly to custom theme tokens.

### shadcn/ui

- Not a dependency — it's copy-paste components built on Radix UI primitives.
- Fully accessible (WCAG 2.1 AA), which matters for a professional B2B tool.
- You own the code. No version lock-in, no breaking upgrades.
- Components: `DataTable` (product catalogue), `Dialog` (quote modals), `Form` (calculation inputs), `Sheet` (mobile nav), `Tabs` (product specs/certs/batch info).

### State Management

- **Zustand 5.x** for client-side state (cart, calculation parameters, UI state). Lightweight, no boilerplate.
- **React Query (TanStack Query) 5.x** for server state (product data, order history, cert lookups). Automatic caching, background refetching, optimistic updates.
- Do NOT use Redux. It's over-engineered for this use case.

---

## Backend

### Next.js API Routes + tRPC 11

**Why tRPC:**
- End-to-end type safety between frontend and backend with zero code generation.
- The entire Torke platform is TypeScript — tRPC gives you autocomplete on API calls, type-checked request/response shapes, and compile-time error catching.
- tRPC 11 has first-class support for Next.js App Router and Server Components.
- Procedures map cleanly to domain operations: `product.list`, `product.getBySlug`, `batch.trace`, `cert.generate`, `calculation.run`, `order.create`, `quote.request`.

**Why NOT a separate backend (Express, Fastify, NestJS):**
- At Torke's current stage (pre-seed, single developer), a separate backend doubles deployment complexity with no benefit.
- Next.js API routes handle everything: REST webhooks from Stripe, tRPC for the app, file uploads for cert PDFs.
- If you outgrow this, tRPC procedures can be extracted to a standalone Fastify server with minimal refactoring — the procedure definitions are framework-agnostic.

**Background Jobs:**
- **Trigger.dev 3.x** for background processing: PDF cert pack generation, email dispatch, batch allocation on order, search index updates. Trigger.dev is purpose-built for Next.js, runs on your own infra or their cloud, and handles retries/scheduling. Alternative: **Inngest** (similar model, slightly more mature).
- Do NOT use BullMQ + Redis for this — it requires running your own worker process and Redis instance, which is unnecessary complexity at this stage.

### Calculation Engine (Torke TRACE)

The Eurocode anchor calculations should run server-side (API route or tRPC procedure), NOT client-side:
- Calculation logic is IP — don't ship it to the browser.
- Server-side validation prevents tampered inputs producing fake pass results.
- Heavy matrix operations (anchor group interaction) are faster on server.
- The calculation module should be a pure TypeScript library (`@torke/calc-engine`) with no framework dependencies, callable from both the API and future CLI/testing tools.

---

## Database

### PostgreSQL 16

**Why PostgreSQL:**
- The data model is inherently relational: Products have Batches, Batches have Certs, Orders have LineItems, LineItems reference Batches, Customers have Accounts with negotiated Prices. This is a textbook relational schema.
- PostgreSQL's JSONB columns handle semi-structured data where needed (calculation parameters, cert metadata, product specifications that vary by category).
- Row-level security (RLS) can enforce multi-tenant data isolation (contractor A cannot see contractor B's orders).
- Full-text search as a fallback if Meilisearch is overkill at launch.
- `ltree` extension for hierarchical product categories (Fixings > Mechanical Anchors > Throughbolts > M12 Throughbolt).
- Excellent GIN indexing for JSONB queries on product specifications.

### Drizzle ORM 0.38+

**Why Drizzle over Prisma:**
- Drizzle generates SQL that looks like SQL — no query engine abstraction layer. You write `select().from(products).where(eq(products.category, 'chemical-anchors'))` and it produces exactly the SQL you'd expect.
- Schema-as-code with TypeScript: your database schema IS your type system. Change the schema, get compile errors everywhere the types no longer match.
- Drizzle Kit for migrations: `drizzle-kit generate` creates SQL migration files, `drizzle-kit migrate` applies them. Version-controlled, auditable.
- Significantly faster than Prisma at runtime — no Rust query engine binary, no WASM overhead.
- Prisma's query engine adds ~15-20MB to your deployment and has cold-start penalties on serverless. Drizzle has zero overhead.

### Key Schema Concepts

```
suppliers
  └─ supplier_batches (supplier's batch number + linked 3.1 cert PDF)
       └─ torke_batches (Torke's internal batch ID, links to supplier_batch)
            └─ stock_items (individual units/cases in warehouse, with bin_location)
                 └─ order_line_allocations (which stock_item fulfils which order line)
                      └─ order_lines → orders → customers

products
  └─ product_variants (M10x80, M12x100, etc.)
       └─ torke_batches (which batches of this variant exist)

certifications
  └─ linked to supplier_batches (the raw 3.1 cert PDF/data)
  └─ linked to cert_packs (generated PDF bundles per order)
```

---

## 3D Visualization

### Three.js r170+ via React Three Fiber (R3F) 9.x

**Why R3F over raw Three.js:**
- Declarative scene graph using JSX. An anchor plate visualization is a component tree:
  ```tsx
  <Canvas>
    <AnchorPlate width={300} depth={200} thickness={20}>
      <AnchorBolt position={[50, 50]} embedment={100} diameter={12} />
      <AnchorBolt position={[250, 50]} embedment={100} diameter={12} />
      <AnchorBolt position={[50, 150]} embedment={100} diameter={12} />
      <AnchorBolt position={[250, 150]} embedment={100} diameter={12} />
    </AnchorPlate>
    <ConcreteBlock class="C30/37" />
    <LoadArrows tension={45} shear={20} />
  </Canvas>
  ```
- React state drives the 3D scene. When the engineer changes bolt diameter in a form input, the 3D model updates instantly — no imperative scene manipulation.
- `@react-three/drei` provides orbit controls, annotations, dimension lines, and environment lighting out of the box.
- `@react-three/postprocessing` for visual polish (ambient occlusion, bloom on load arrows).

**Supporting libraries:**
- **@react-three/drei 9.x** — helper components (OrbitControls, Text, Line, Edges, Html overlays for dimension labels).
- **leva 0.10+** — debug GUI for development (tweak bolt positions, loads, materials in real-time). Strip from production build.
- **three-stdlib** — additional geometries if needed.

**Performance notes:**
- The Torke TRACE 3D scene is simple geometry (boxes, cylinders, arrows). This is NOT a game engine workload. Performance will be excellent even on low-end devices.
- Use `<Canvas frameloop="demand">` to only re-render when inputs change, saving battery on tablets (engineers on-site often use iPads).

---

## PDF Generation

### @react-pdf/renderer 4.x

**Why @react-pdf/renderer:**
- Define PDF layouts using React components. The same developer skill set (JSX + Tailwind-like styling) applies.
- Calculation reports, cert packs, and quote documents are all templates with dynamic data — this is exactly what component-based PDF generation excels at.
- Server-side rendering: generate PDFs in API routes or background jobs, store to R2, email link to customer.
- Supports images (Torke logo, cert scan embeds), tables (calculation results), headers/footers, page numbers.

**Template structure:**
- `CalculationReport` — Torke TRACE output: inputs, 3D screenshot, results table, pass/fail summary, engineer details, project info. Torke-branded header/footer.
- `CertPack` — order dispatch document: order summary, per-line-item batch numbers, embedded or linked 3.1 cert PDFs, QR codes linking to online verification.
- `QuoteDocument` — formal quotation with terms, product list, pricing, validity period.
- `DispatchNote` — packing list with batch references.

**Alternative considered:** Puppeteer/Playwright for HTML-to-PDF. Rejected — requires a headless browser instance, much heavier resource usage, harder to deploy on serverless. `@react-pdf/renderer` produces PDFs directly from a virtual DOM with no browser.

---

## QR Code Generation

### qrcode 1.5.x (server) + react-qr-code 2.x (client)

- **Server-side (`qrcode`):** Generate QR code images for product labels, dispatch notes, and cert pack PDFs. Output as PNG buffer or SVG string, embed directly into `@react-pdf/renderer` documents.
- **Client-side (`react-qr-code`):** Render QR codes in the browser for on-screen display (order detail page, batch lookup results).
- QR payload: URL pointing to `torke.co.uk/verify/{batchId}` or `torke.co.uk/cert/{orderId}` — public verification pages that display the cert chain without requiring login.

### QR/Barcode Scanning (WMS)

- **html5-qrcode 2.x** — browser-based QR/barcode scanner using device camera. Works on Android tablets and phones that warehouse staff will use.
- No native app required. The WMS runs as a PWA (Progressive Web App) with `next-pwa`.
- Supports Code128, EAN-13, QR, DataMatrix — covers all standard logistics barcodes.

---

## Search

### Meilisearch 1.12+

**Why Meilisearch over Algolia/Elasticsearch:**
- **Self-hosted and free.** Algolia charges per search request — at scale, this is expensive. Elasticsearch is operationally heavy. Meilisearch is a single binary with zero configuration.
- Typo-tolerant, instant search. An engineer searching "M12 throughbolt stainles" finds "M12 Throughbolt Stainless Steel A4" instantly.
- Faceted filtering: filter by category, diameter, material, finish, load class, ETA number. Construction product catalogues need this.
- 50ms query response time on catalogues of 100k+ products.
- **meilisearch-js 0.46+** client library, or use the REST API directly.

**Index strategy:**
- `products` index: name, description, SKU, category, material, diameter, length, finish, ETA number, load data summary.
- `batches` index (internal/WMS): batch ID, supplier, product, date received, status.
- `orders` index (internal): order number, customer name, product names, status.

**Deployment:** Run as a Docker container on Railway or Fly.io alongside the database. Sync from PostgreSQL using Trigger.dev jobs on product/batch create/update.

---

## Hosting

### Vercel (Frontend) + Railway (Services)

**Vercel for the Next.js app:**
- Zero-config deployment for Next.js (Vercel built Next.js — it's the reference platform).
- Edge network for static assets (product images, marketing pages).
- Serverless functions for API routes and tRPC.
- Preview deployments on every PR — critical for QA on a safety-critical platform.
- Pro plan ($20/mo) is sufficient for launch. Enterprise if you need SLAs later.

**Railway for stateful services:**
- PostgreSQL managed instance (Railway Postgres is simple and cheap — $5/mo base).
- Meilisearch container.
- Trigger.dev worker (if self-hosting).
- Redis (if needed later for caching/sessions).

**Alternative: Fly.io** — better if you want servers in London specifically (lower latency for UK customers). Railway's servers are US-based but the latency difference is negligible for a B2B platform where users aren't gaming.

**Why NOT AWS/GCP directly:**
- At pre-seed, managing ECS/EKS/Lambda/RDS/CloudFront is a full-time ops job. Vercel + Railway abstracts this entirely.
- When Torke reaches the scale where AWS makes financial sense, the migration path is straightforward: Next.js on ECS/Fargate, PostgreSQL on RDS, Meilisearch on EC2.

### Cloudflare R2 for File Storage

- S3-compatible object storage with zero egress fees.
- Store: 3.1 cert PDFs (uploaded at goods-in), generated cert packs, product images, calculation report PDFs.
- Serve via Cloudflare CDN — fast globally, but especially in the UK.
- Cost: ~$0.015/GB/month storage, $0 egress. For a fixings business with thousands of cert PDFs, this is pennies.

---

## Payments

### Stripe

**Why Stripe for UK B2B:**
- **Stripe Billing** handles the hybrid model: some customers pay by card per-order, large accounts get invoiced on 30-day terms.
- **Stripe Invoicing** for account-based customers: generate and send invoices, track payment status, auto-chase overdue.
- **Stripe Connect** if Torke ever becomes a marketplace (multiple suppliers selling through the platform).
- **Strong Customer Authentication (SCA)** compliance is built in — mandatory for UK/EU card payments.
- **stripe-node 17.x** — the official Node.js SDK. Fully typed.
- Webhooks for order status updates: `payment_intent.succeeded` → trigger pick list generation, `invoice.paid` → update account balance.

**B2B-specific setup:**
- Create Stripe Customers for each contractor account.
- Use Stripe's `payment_terms` on invoices (net 30, net 60).
- Store negotiated pricing in your own database (PostgreSQL), NOT in Stripe — Stripe handles payment collection, your system handles pricing logic.
- Support for BACS Direct Debit (UK bank transfers) via Stripe — important for large contractors who don't pay by card.

**Why NOT GoCardless / Worldpay:**
- GoCardless is Direct Debit only — you'd need a second provider for card payments. Stripe does both.
- Worldpay/Opayo have poor developer experience, outdated APIs, and lengthy onboarding. Stripe is live in hours.

---

## Email/CRM

### Resend + React Email (Transactional Email)

**Resend:**
- Modern email API built for developers. Send transactional emails (order confirmations, dispatch notifications, cert pack delivery) via a simple API call.
- UK sending infrastructure — emails land in inboxes, not spam.
- **resend 4.x** SDK.
- $20/mo for 50,000 emails — more than enough for launch.

**React Email 3.x:**
- Build email templates using React components. Same developer skill set, same tooling, same component patterns.
- Templates: `OrderConfirmation`, `DispatchNotification` (with cert pack PDF attached or linked), `QuoteReady`, `AccountWelcome`, `ReorderReminder`, `CPDInvitation`.
- Preview emails in the browser during development with `react-email dev`.

### HubSpot (CRM + Marketing Automation)

**Why HubSpot:**
- Free CRM tier covers contact management, deal tracking, and basic email marketing. Torke doesn't need Salesforce complexity at this stage.
- **Marketing Hub Starter** ($15/mo) adds email automation sequences: new lead nurture, post-purchase follow-up, reorder reminders based on typical consumption rates.
- **HubSpot API v3** integrates cleanly — sync customers, orders, and product usage data from PostgreSQL to HubSpot via Trigger.dev jobs.
- Sales Hub tracks account manager interactions with large customers (the "hybrid model" from the requirements).

**Integration pattern:**
- New customer signup → create HubSpot Contact + Company.
- Order placed → create HubSpot Deal, log activity.
- Torke TRACE calculation saved → log as engagement (lead scoring: engineers who calculate are high-intent leads).
- Reorder automation: if Customer X typically orders M12 throughbolts every 6 weeks and it's been 7 weeks, trigger a "Time to reorder?" email.

---

## Auth

### Better Auth 1.x

**Why Better Auth over NextAuth/Clerk/Auth0:**
- Open-source, self-hosted — no per-MAU pricing that scales painfully (Clerk charges $0.02/MAU after 10k).
- Stores users in YOUR PostgreSQL database — not a third-party system. Critical for a platform where user accounts are tightly coupled to orders, batches, and certs.
- Supports email/password, magic link, OAuth (Google for convenience), and organization/team structures (a contracting firm has multiple users under one account).
- Role-based access out of the box: `customer`, `account_manager`, `warehouse_staff`, `admin`, `engineer` (for Torke TRACE saved projects).
- Session management with JWTs or database sessions.
- Two-factor authentication — important for admin and warehouse roles.

---

## What NOT to Use (and Why)

| Technology | Why Not |
|-----------|---------|
| **Shopify / WooCommerce / Medusa** | Batch traceability, cert chain tracking, and FIFO batch allocation are too deeply integrated into the order/fulfilment flow. Bolting this onto a generic e-commerce platform means fighting the framework at every step. Custom-built is correct here. |
| **Redux / MobX** | Overkill for this application. Zustand + TanStack Query cover all state management needs with 90% less boilerplate. |
| **Prisma** | Slower runtime performance, ~15MB query engine binary, poor serverless cold-start characteristics, and the abstraction hides SQL in ways that make complex batch-tracing queries harder to optimize. Drizzle is leaner and closer to the metal. |
| **MongoDB** | The data is relational. Products, batches, certs, orders, line items, customers, and allocations form a complex web of relationships. MongoDB would require denormalization that makes the traceability chain fragile and hard to audit. |
| **Elasticsearch** | Operational burden is too high for a small team. Meilisearch gives you 95% of the search UX with 5% of the ops overhead. |
| **Algolia** | Expensive at scale (per-search-request pricing). Meilisearch is free and self-hosted with equivalent search quality for a product catalogue of this size. |
| **AWS Lambda / raw AWS** | Too much infrastructure management for a pre-seed team. Vercel + Railway abstract the same capabilities with drastically less ops work. Migrate to AWS when the business justifies a platform team. |
| **Firebase / Supabase** | Supabase is tempting (Postgres + auth + storage in one), but the auth and storage abstractions add lock-in and the realtime features aren't needed. Better to own each layer independently. Supabase's edge functions are also less mature than Vercel's. |
| **Puppeteer for PDF** | Requires a headless Chrome instance. Heavy, slow, expensive to run in serverless. `@react-pdf/renderer` generates PDFs without a browser. |
| **Native mobile app for WMS** | A PWA with camera access for QR scanning is sufficient. Building and maintaining iOS + Android apps for an internal warehouse tool is unjustifiable at this stage. |
| **GraphQL** | Adds schema definition overhead with no benefit for a single-team, single-frontend project. tRPC gives you the same type safety with less ceremony. If Torke ever opens a public API for third-party integrators, add a GraphQL layer then. |
| **Tailwind UI (paid)** | shadcn/ui provides equivalent components for free, with full source ownership. |
| **Auth0 / Clerk** | Per-MAU pricing becomes expensive. User data lives in their system, not yours. For a platform where user accounts are tightly coupled to business data (orders, certs, calculations), you want users in your own database. Better Auth achieves this. |

---

## Confidence Levels

| Decision | Confidence | Notes |
|----------|-----------|-------|
| Next.js 15 + React 19 | **Very High** | Industry standard for this class of application. No credible alternative offers the same SSR + API + edge combination. |
| TypeScript everywhere | **Very High** | Non-negotiable for a safety-critical platform. Type safety catches bugs at compile time. |
| PostgreSQL | **Very High** | The data model is textbook relational. No debate here. |
| Drizzle ORM | **High** | Best-in-class TypeScript ORM in 2025/2026. Prisma is the only real alternative, and Drizzle wins on performance and developer experience for this use case. |
| tRPC | **High** | Perfect for a single-team full-stack TypeScript project. Would reconsider if Torke needed a public API consumed by third parties (then add REST/GraphQL alongside). |
| React Three Fiber | **High** | The standard for React + Three.js integration. The alternative is raw Three.js, which is more verbose but equally capable. R3F wins on developer experience. |
| Meilisearch | **High** | Strong choice for self-hosted search. Would reconsider if Torke's catalogue grows beyond 500k products with complex faceting requirements (then evaluate Typesense or Elasticsearch). |
| Stripe | **Very High** | Dominant payment platform for UK B2B SaaS/e-commerce. The only reason NOT to use Stripe is if you need very specific UK payment rails that Stripe doesn't support (it supports all of them). |
| Better Auth | **Medium-High** | Newer than NextAuth but architecturally superior for this use case (data in your DB, no per-MAU fees). NextAuth v5 (Auth.js) is the safe alternative if Better Auth's community/docs prove insufficient. |
| Vercel + Railway | **High** | Right for the pre-seed stage. Will likely migrate to AWS/GCP within 2-3 years as the team and traffic grow. The migration path from Next.js on Vercel to Next.js on ECS is well-documented. |
| @react-pdf/renderer | **High** | Best React-native PDF solution. If complex layouts prove difficult, fall back to **Typst** (a modern typesetting system) generating PDFs server-side — steeper learning curve but more powerful layout engine. |
| Resend + React Email | **High** | Modern, developer-friendly email stack. SendGrid and Postmark are proven alternatives if Resend's deliverability proves inconsistent. |
| HubSpot CRM | **Medium-High** | Good free tier, solid API, standard in UK B2B. If Torke's needs are simpler than expected, a lightweight CRM like **Attio** might be a better cultural fit for a startup. |
| Cloudflare R2 | **Very High** | S3-compatible with zero egress fees. No reason to use S3 directly unless you're already deep in the AWS ecosystem. |
| Zustand + TanStack Query | **Very High** | The de facto standard for React state management in 2025/2026. Mature, lightweight, well-documented. |

---

*Research completed: 2026-03-04. Based on production patterns and ecosystem maturity as of early 2026. All version numbers reflect latest stable releases at time of writing.*
