# Phase 4: Portals + Marketing + Polish - Research

**Researched:** 2026-03-05
**Domain:** Customer/verification portals, MDX blog/content, structured data, lead generation
**Confidence:** HIGH

## Summary

Phase 4 surfaces existing traceability data to two new audiences (customers searching certs, end-clients verifying supply chains) and adds content/SEO infrastructure. The technical risk is low because every major pattern (tRPC routers, pdf-lib PDF generation, R2 storage, verification tokens, account dashboard tabs) is already established in the codebase. The work decomposes into four distinct domains: (1) cert portal -- extending the account dashboard with search and bulk download, (2) end-client verification -- extending the `/t/[token]` pattern for order-level sharing, (3) content/SEO -- MDX blog, glossary, resource library, schema markup, and (4) lead gen funnel polish -- soft prompts, registration flow, admin lead list.

No new major dependencies are required. The MDX pipeline uses `@next/mdx` (official Next.js package). ZIP generation uses the `jszip` package (lightweight, works server-side). Schema markup uses `schema-dts` for TypeScript types. Everything else builds on existing stack: Drizzle, tRPC, pdf-lib, R2 storage, Better Auth, Resend.

**Primary recommendation:** Structure work in 5-6 plans progressing from data layer (new DB tables for share tokens) through cert portal UI, verification portal, content infrastructure, and lead gen polish. Each builds on established patterns with no architectural novelty.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Cert portal is a new "Certifications" tab within existing account dashboard (alongside Orders and Addresses)
- Full search: order number, Torke batch ID, product code, and date range
- Per-order cert pack download PLUS bulk ZIP download for selecting multiple orders
- Individual 3.1 cert PDFs downloadable separately in addition to full cert pack
- Cert portal reuses existing `orders.myOrderDetail` tRPC, `/api/certpack/{orderId}` endpoint, and `batches.getByToken` query
- Per-order share links as the primary model for end-client verification
- Project grouping (assign orders to named projects, share one project link) as a stretch goal
- Verification links never expire
- End-client sees rich view: project name, product list with quantities, batch IDs, supplier name, manufacturer, heat numbers, goods-in date, dispatch date, and downloadable 3.1 cert PDFs
- Co-branded: Torke branding with contractor's company name displayed ("Fixings supplied by [Contractor], verified by Torke")
- Extends existing `/t/[token]` verification page pattern -- new tokens for order-level and project-level sharing
- MDX files stored in the repository for blog content
- Launch with articles + downloadable resource library + searchable technical glossary
- Article types: installation guides, Eurocode explainers, product comparisons, specification guidance
- Resource library: downloadable technical datasheets, ETAs, DoPs per product -- linked from product detail pages
- Glossary: searchable key/definition pairs targeting informational search queries
- Full structured data: Product, Article, FAQ, Breadcrumb, Organization, and HowTo schemas across the site
- Document rebranding: PDF template system with Torke branding (header, footer, colours, logo) for consistent docs
- Keep current gating (calculate freely, gate save + PDF export) PLUS add soft non-blocking prompts
- Capture email + name + company at signup from Torke TRACE
- Welcome flow for design-to-shop transition
- Single account system already unified via Better Auth
- Basic admin lead list: simple page showing recent signups from design tool

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

### Deferred Ideas (OUT OF SCOPE)
- Email/CRM automation (welcome sequences, reorder reminders) -- v2 backlog
- CPD/accredited training platform -- v2 backlog
- Project hub (grouping orders, certs, calcs under named projects) -- v2 backlog (per-project verification links are a lightweight version)
- Admin analytics dashboard (conversion funnels, usage metrics) -- v2 backlog
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TRACE-12 | Contractor can search certs by order number, Torke batch ID, product code, or date range | New `certs` tRPC router with search query; extends existing orders/allocations/batches joins |
| TRACE-13 | Contractor can download individual cert PDFs or bundled cert pack per order | Reuse existing certpack-service.ts + R2 presigned URLs; new bulk ZIP endpoint with JSZip |
| TRACE-14 | Order history page shows batch allocation per line with linked cert downloads | Extends existing `myOrderDetail` pattern; add cert download links per allocation |
| TRACE-15 | Contractor can generate unique read-only verification link for end-client | New `orderShareTokens` table; new tRPC mutation; QR code generation via existing qr-service |
| TRACE-16 | End-client can view project name, fixings, batches, and certs via verification link | New `/v/[token]` page extending `/t/[token]` pattern with order-level data |
| TRACE-17 | QR code on physical product label resolves to public verification page | Already functional via existing `/t/[token]` -- this requirement is about ensuring the existing QR labels work correctly with the verification page |
| MKTG-01 | Technical blog with SEO-optimised articles | @next/mdx pipeline with MDX files in `/content/blog/`; frontmatter metadata export |
| MKTG-02 | Product pages include structured data (schema markup) | schema-dts types + JSON-LD script tags in product pages, layout, blog posts |
| MKTG-03 | Resource library with downloadable datasheets, ETAs, DoPs per product | R2-hosted PDFs linked from product detail pages; new `/resources` listing page |
| MKTG-04 | Technical glossary section targeting informational search queries | JSON data file with terms; `/glossary` page with search/filter; FAQ schema markup |
| MKTG-05 | Torke TRACE accessible without login | Already implemented (DESIGN-17) -- verify no regressions |
| MKTG-06 | Saving/exporting requires free account creation capturing lead data | Already implemented (DESIGN-18) -- verify company field captured at registration |
| MKTG-07 | Account creation from Torke TRACE feeds into e-commerce account system | Already implemented via Better Auth single account system -- verify unified experience |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, SSR, routing | Already in use |
| Drizzle ORM | 0.45.1 | Database queries, schema | Already in use |
| tRPC | 11.11.0 | Type-safe API | Already in use |
| pdf-lib | 1.17.1 | PDF generation, cert packs | Already in use |
| Resend | 6.9.3 | Email notifications | Already in use |
| Better Auth | 1.5.3 | Authentication | Already in use |
| Zod | 4.3.6 | Schema validation | Already in use |
| qrcode | 1.5.4 | QR code generation | Already in use |

### New Dependencies
| Library | Version | Purpose | Why This |
|---------|---------|---------|----------|
| @next/mdx | latest | MDX processing for blog | Official Next.js MDX package; server component support; no client JS |
| @mdx-js/loader | latest | MDX webpack loader | Required by @next/mdx |
| @mdx-js/react | latest | MDX React provider | Required by @next/mdx |
| jszip | ~3.10 | ZIP file generation | Server-side ZIP for bulk cert download; 400KB, well-maintained |
| schema-dts | latest | TypeScript types for Schema.org | Google-maintained; type-safe JSON-LD generation |
| gray-matter | latest | YAML frontmatter parsing | Parse MDX frontmatter for blog metadata; standard tool |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @next/mdx | next-mdx-remote | Not well-maintained in 2025; unstable with RSC; overkill for local files |
| jszip | archiver | archiver is heavier (streaming focus); jszip simpler for our use case (few PDFs per ZIP) |
| schema-dts | Manual JSON objects | No type safety; easy to produce invalid schema markup |
| gray-matter | Export metadata objects | gray-matter allows standard YAML frontmatter; export approach works too but gray-matter is more ergonomic for listing pages |

**Installation:**
```bash
npm install @next/mdx @mdx-js/loader @mdx-js/react jszip schema-dts gray-matter
npm install -D @types/mdx
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (shop)/account/
│   │   ├── certifications/      # TRACE-12,13,14 - cert portal tab
│   │   │   └── page.tsx
│   │   └── page.tsx             # Add Certifications tab link
│   ├── (blog)/
│   │   ├── blog/
│   │   │   ├── page.tsx         # Blog listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx     # Individual post (loads MDX)
│   │   ├── glossary/
│   │   │   └── page.tsx         # Glossary listing + search
│   │   ├── resources/
│   │   │   └── page.tsx         # Resource library
│   │   └── layout.tsx           # Blog layout (lighter nav)
│   ├── v/[token]/
│   │   └── page.tsx             # Order-level verification (TRACE-15,16)
│   ├── t/[token]/
│   │   └── page.tsx             # Existing batch verification (TRACE-17)
│   └── (wms)/warehouse/admin/
│       └── leads/
│           └── page.tsx         # Admin lead list
├── content/
│   ├── blog/                    # MDX blog posts
│   │   └── *.mdx
│   └── glossary.json            # Glossary terms data
├── server/
│   ├── db/schema/
│   │   └── share-tokens.ts      # New table for order share tokens
│   ├── trpc/routers/
│   │   ├── certs.ts             # Cert portal search + download
│   │   ├── verification.ts      # Share link generation
│   │   └── leads.ts             # Admin lead list queries
│   └── services/
│       └── zip-service.ts       # Bulk cert ZIP generation
├── lib/
│   ├── mdx.ts                   # MDX utilities (list posts, parse frontmatter)
│   ├── schema-markup.ts         # JSON-LD generation helpers
│   └── pdf-template.ts          # Document rebranding template system
└── components/
    ├── shop/
    │   ├── CertSearch.tsx        # Cert portal search form
    │   ├── CertResults.tsx       # Cert search results list
    │   └── ShareLinkDialog.tsx   # Generate verification share link
    ├── blog/
    │   ├── BlogCard.tsx          # Blog post preview card
    │   └── TableOfContents.tsx   # Article TOC
    ├── seo/
    │   └── JsonLd.tsx            # Reusable JSON-LD component
    └── design/
        └── SoftPrompt.tsx        # Non-blocking account prompt
```

### Pattern 1: Cert Search via tRPC
**What:** New `certs` tRPC router that queries orders + allocations + batches for the current user with search filters
**When to use:** TRACE-12 cert search
**Example:**
```typescript
// src/server/trpc/routers/certs.ts
export const certsRouter = router({
  search: protectedProcedure
    .input(z.object({
      orderNumber: z.string().optional(),
      batchId: z.string().optional(),
      productCode: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Query orders for current user with optional filters
      // Join through orderLines -> orderLineAllocations -> batches -> supplierBatches
      // Return order + allocation + cert data
    }),
});
```

### Pattern 2: Order Share Tokens
**What:** New DB table for order-level verification share links, separate from batch-level verification tokens
**When to use:** TRACE-15 share link generation
**Example:**
```typescript
// src/server/db/schema/share-tokens.ts
export const orderShareTokens = pgTable("order_share_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: uuid("token").defaultRandom().notNull().unique(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  userId: uuid("user_id").notNull(), // Owner who created the link
  projectName: varchar("project_name", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at"),
});
```

### Pattern 3: MDX Blog with @next/mdx
**What:** Local MDX files with frontmatter, compiled at build time, served as server components
**When to use:** MKTG-01 blog posts
**Example:**
```typescript
// content/blog/embedment-depth-guide.mdx
export const metadata = {
  title: "Understanding Embedment Depth for Post-Installed Anchors",
  description: "A guide to calculating embedment depth per EN 1992-4",
  date: "2026-03-01",
  category: "technical-guide",
  author: "Torke Engineering",
  tags: ["eurocode", "embedment-depth", "EN-1992-4"],
};

# Understanding Embedment Depth
...

// src/lib/mdx.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export function getAllPosts() {
  const dir = path.join(process.cwd(), "content/blog");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".mdx"));
  return files.map(file => {
    const source = fs.readFileSync(path.join(dir, file), "utf8");
    const { data } = matter(source);
    return { slug: file.replace(".mdx", ""), ...data };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
```

### Pattern 4: JSON-LD Schema Markup
**What:** Reusable component that renders `<script type="application/ld+json">` tags
**When to use:** MKTG-02 structured data on all page types
**Example:**
```typescript
// src/components/seo/JsonLd.tsx
import type { Thing, WithContext } from "schema-dts";

export function JsonLd<T extends Thing>({ data }: { data: WithContext<T> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Usage in product page:
<JsonLd<Product> data={{
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  sku: product.sku,
  description: product.description,
  // ...
}} />
```

### Pattern 5: Bulk ZIP Download
**What:** Server-side ZIP generation using JSZip, downloading cert PDFs from R2 and bundling
**When to use:** TRACE-13 bulk cert download
**Example:**
```typescript
// src/server/services/zip-service.ts
import JSZip from "jszip";
import { downloadFile } from "@/server/storage";

export async function generateBulkCertZip(
  certKeys: Array<{ key: string; filename: string }>
): Promise<Buffer> {
  const zip = new JSZip();

  await Promise.all(
    certKeys.map(async ({ key, filename }) => {
      const pdf = await downloadFile(key);
      zip.file(filename, pdf);
    })
  );

  return Buffer.from(await zip.generateAsync({ type: "uint8array" }));
}
```

### Anti-Patterns to Avoid
- **Client-side ZIP generation:** Do NOT generate ZIPs in the browser -- cert PDFs are in R2, must be fetched server-side. Use API route that streams the ZIP response.
- **Separate auth system for verification links:** Share tokens are unauthenticated (public). Do NOT require login for end-client verification pages.
- **Heavyweight CMS for blog:** Do NOT add Contentful/Sanity/Strapi. MDX in the repo is the locked decision -- zero infrastructure, deploys with the app.
- **Dynamic MDX compilation at runtime:** Use @next/mdx build-time compilation. Do NOT compile MDX at request time.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP file creation | Custom binary ZIP writer | JSZip | ZIP format has compression, CRC32, directory headers -- complex binary format |
| Schema.org types | Manual JSON objects | schema-dts | 800+ schema types; manual objects lead to invalid markup that fails Google validation |
| MDX processing | Custom markdown parser | @next/mdx + gray-matter | MDX has JSX compilation, imports, components -- not just markdown |
| PDF template branding | Pixel-perfect layout from scratch | Extend existing pdf-lib patterns from certpack-service.ts | Torke header/footer pattern already exists; extract and reuse |
| Frontmatter parsing | Regex extraction | gray-matter | Handles YAML edge cases, multiline values, type coercion |

## Common Pitfalls

### Pitfall 1: Cert Search Performance
**What goes wrong:** Searching across orders -> orderLines -> allocations -> batches -> supplierBatches with text filters can be slow
**Why it happens:** Many-to-many joins across 5+ tables without proper indexes
**How to avoid:** Add database indexes on orders.orderNumber, batches.torkeBatchId, products.sku. Use pagination (already planned). Consider limiting search to user's own orders only (which is the requirement).
**Warning signs:** Query time > 500ms on small dataset

### Pitfall 2: ZIP Memory for Large Orders
**What goes wrong:** Loading all cert PDFs into memory at once for a bulk download with many orders
**Why it happens:** Each cert PDF is ~100KB-1MB; 50 orders could be 50MB+ in memory
**How to avoid:** Limit bulk download to max 20 orders at once. Use JSZip's `generateNodeStream()` for streaming to response. Show a progress indicator for large downloads.
**Warning signs:** Memory spikes during bulk download

### Pitfall 3: MDX Build Errors Breaking Deployment
**What goes wrong:** A syntax error in an MDX file (unclosed JSX tag, invalid import) breaks the entire build
**Why it happens:** @next/mdx compiles at build time; MDX errors are build errors
**How to avoid:** Keep MDX content simple (no complex JSX). Add MDX lint/validation to CI. Test blog pages in dev before commit.
**Warning signs:** Build failures after content changes

### Pitfall 4: Verification Page SEO Leaking
**What goes wrong:** Google indexes verification share links, cluttering search results with private order data
**Why it happens:** Verification pages are public (no login required) so crawlers can reach them
**How to avoid:** Set `robots: "noindex, nofollow"` metadata on all verification pages (already done on `/t/[token]` -- replicate for `/v/[token]`). Use `X-Robots-Tag: noindex` header as belt-and-suspenders.
**Warning signs:** Verification pages appearing in search results

### Pitfall 5: Schema Markup Validation Failures
**What goes wrong:** JSON-LD produces invalid structured data that Google ignores
**Why it happens:** Missing required fields, wrong types, outdated schema
**How to avoid:** Use schema-dts for compile-time type checking. Test with Google Rich Results Test before deployment. Focus on Product, Article, Organization, BreadcrumbList (well-documented types).
**Warning signs:** Google Search Console showing structured data errors

### Pitfall 6: MDX pageExtensions Conflict
**What goes wrong:** Adding `mdx` to Next.js `pageExtensions` causes unexpected files to be treated as pages
**Why it happens:** @next/mdx configuration adds `.mdx` as a valid page extension globally
**How to avoid:** Store MDX content files outside of `src/app/` (in `/content/blog/`). Only use `.mdx` extension in the app directory for actual page files if needed. The blog listing page dynamically imports MDX content, not via file-system routing.

## Code Examples

### Cert Portal Search Query (Drizzle)
```typescript
// Pattern for TRACE-12: search certs across orders/batches for current user
const results = await db
  .select({
    orderId: orders.id,
    orderNumber: orders.orderNumber,
    orderDate: orders.createdAt,
    certPackKey: orders.certPackKey,
    productName: products.name,
    productSku: products.sku,
    torkeBatchId: batches.torkeBatchId,
    quantity: orderLineAllocations.quantity,
  })
  .from(orders)
  .innerJoin(orderLines, eq(orderLines.orderId, orders.id))
  .innerJoin(orderLineAllocations, eq(orderLineAllocations.orderLineId, orderLines.id))
  .innerJoin(batches, eq(orderLineAllocations.batchId, batches.id))
  .innerJoin(products, eq(orderLines.productId, products.id))
  .where(
    and(
      eq(orders.userId, userId),
      // Dynamic filters applied conditionally
      ...(orderNumber ? [sql`${orders.orderNumber} ILIKE ${`%${orderNumber}%`}`] : []),
      ...(batchId ? [sql`${batches.torkeBatchId} ILIKE ${`%${batchId}%`}`] : []),
      ...(productCode ? [sql`${products.sku} ILIKE ${`%${productCode}%`}`] : []),
    )
  )
  .orderBy(desc(orders.createdAt))
  .limit(limit)
  .offset(offset);
```

### Account Dashboard Tab Extension
```typescript
// Extend existing tab navigation in /account/page.tsx
<TabLink href="/account" active>Dashboard</TabLink>
<TabLink href="/account/orders">Orders</TabLink>
<TabLink href="/account/certifications">Certifications</TabLink>
<TabLink href="/account/addresses">Addresses</TabLink>
```

### JSON-LD for Product Page
```typescript
// Add to existing /products/[slug]/page.tsx
import { JsonLd } from "@/components/seo/JsonLd";
import type { Product } from "schema-dts";

// In the page component:
<JsonLd<Product> data={{
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  sku: product.sku,
  description: product.description ?? "",
  brand: {
    "@type": "Brand",
    name: "Torke",
  },
  manufacturer: {
    "@type": "Organization",
    name: "Torke",
  },
  ...(product.pricePence != null && {
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: (product.pricePence / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
  }),
}} />
```

### Verification Share Link Page (Order-Level)
```typescript
// src/app/v/[token]/page.tsx -- extends /t/[token] pattern
// Light theme, co-branded, noindex
export const metadata: Metadata = {
  robots: "noindex, nofollow",
  title: "Order Verification | Torke",
};

export default async function OrderVerificationPage({ params }: PageProps) {
  const { token } = await params;

  const shareToken = await db.query.orderShareTokens.findFirst({
    where: eq(orderShareTokens.token, token),
    with: {
      order: {
        with: {
          orderLines: {
            with: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!shareToken) return <VerificationNotFound />;

  // Fetch user profile for contractor company name (co-branding)
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, shareToken.userId));

  // Fetch allocations + batch data for each line...
  // Render light-themed verification page
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-mdx-remote | @next/mdx (official) | 2024+ | Better RSC support; no client JS; build-time compilation |
| Manual JSON-LD | schema-dts typed helpers | 2023+ | Type-safe; catches invalid markup at compile time |
| Custom metadata | Next.js Metadata API | Next.js 13+ | Built-in `generateMetadata()` for dynamic SEO |
| Pages Router blog | App Router with RSC | Next.js 13+ | Server components reduce client bundle for content pages |

## Open Questions

1. **MDX Content Authoring Workflow**
   - What we know: MDX files in repo, deployed with app
   - What's unclear: Whether anyone besides Claude will author content; whether a preview workflow is needed
   - Recommendation: Keep simple -- MDX in `/content/blog/`, preview via `npm run dev`. No CMS needed for v1.

2. **Resource Library PDF Source**
   - What we know: Need rebranded datasheets, ETAs, DoPs per product
   - What's unclear: Whether source Proventure PDFs exist or need to be created from scratch
   - Recommendation: Build the PDF template system (MKTG-10) and upload pipeline first; populate with available content. Products already have `datasheetUrl` field.

3. **Bulk ZIP Size Limits**
   - What we know: Each cert pack PDF is likely 100KB-2MB; ZIP for 20 orders could be 10-40MB
   - What's unclear: R2 presigned URL approach vs direct download vs streaming
   - Recommendation: Generate ZIP server-side, upload to R2, return presigned URL. Set max 20 orders per bulk download. Show estimated size before download.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRACE-12 | Cert search returns matching orders for user | unit | `npx vitest run src/__tests__/certs/cert-search.test.ts -x` | Wave 0 |
| TRACE-13 | ZIP contains all selected cert PDFs | unit | `npx vitest run src/__tests__/certs/bulk-download.test.ts -x` | Wave 0 |
| TRACE-14 | Order detail includes cert download links per allocation | unit | `npx vitest run src/__tests__/certs/cert-links.test.ts -x` | Wave 0 |
| TRACE-15 | Share token generation returns valid URL | unit | `npx vitest run src/__tests__/verification/share-token.test.ts -x` | Wave 0 |
| TRACE-16 | Verification page renders order data without auth | unit | `npx vitest run src/__tests__/verification/order-verify.test.ts -x` | Wave 0 |
| TRACE-17 | Existing QR verification page functional | manual-only | Manual: scan QR on label, verify page loads | N/A |
| MKTG-01 | Blog listing returns sorted posts | unit | `npx vitest run src/__tests__/blog/mdx-utils.test.ts -x` | Wave 0 |
| MKTG-02 | JSON-LD output matches schema.org spec | unit | `npx vitest run src/__tests__/seo/schema-markup.test.ts -x` | Wave 0 |
| MKTG-03 | Resource library lists products with download links | manual-only | Manual: visit /resources, verify downloads | N/A |
| MKTG-04 | Glossary search filters terms correctly | unit | `npx vitest run src/__tests__/blog/glossary.test.ts -x` | Wave 0 |
| MKTG-05 | Torke TRACE accessible without login | manual-only | Manual: visit /design in incognito | N/A |
| MKTG-06 | Registration captures email, name, company | unit | `npx vitest run src/__tests__/leads/lead-capture.test.ts -x` | Wave 0 |
| MKTG-07 | Design account works in shop | manual-only | Manual: register via design, visit shop | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/certs/cert-search.test.ts` -- covers TRACE-12
- [ ] `src/__tests__/certs/bulk-download.test.ts` -- covers TRACE-13
- [ ] `src/__tests__/certs/cert-links.test.ts` -- covers TRACE-14
- [ ] `src/__tests__/verification/share-token.test.ts` -- covers TRACE-15
- [ ] `src/__tests__/verification/order-verify.test.ts` -- covers TRACE-16
- [ ] `src/__tests__/blog/mdx-utils.test.ts` -- covers MKTG-01
- [ ] `src/__tests__/seo/schema-markup.test.ts` -- covers MKTG-02
- [ ] `src/__tests__/blog/glossary.test.ts` -- covers MKTG-04
- [ ] `src/__tests__/leads/lead-capture.test.ts` -- covers MKTG-06

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All existing code patterns verified by direct file reads
- [Next.js MDX Guide](https://nextjs.org/docs/app/guides/mdx) -- official @next/mdx setup
- [Next.js JSON-LD Guide](https://nextjs.org/docs/app/guides/json-ld) -- official structured data approach
- [schema-dts npm](https://www.npmjs.com/package/schema-dts) -- Google-maintained Schema.org types
- [JSZip documentation](https://stuk.github.io/jszip/) -- ZIP generation API

### Secondary (MEDIUM confidence)
- [MDX comparison: @next/mdx vs next-mdx-remote](https://www.cyishere.dev/blog/next-mdx-or-next-mdx-remote) -- community comparison
- [Building MDX Blog with Next.js 16](https://www.yourtechpilot.com/blog/building-mdx-blog-nextjs) -- verified against official docs

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all core libraries already in use; new deps are lightweight and well-established
- Architecture: HIGH -- every pattern extends existing codebase patterns; no architectural novelty
- Pitfalls: HIGH -- identified from direct codebase analysis and established web dev patterns
- Content/SEO: MEDIUM -- MDX and schema-dts are standard but specific configuration for Next.js 16.1.6 may have minor differences

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable domain, no fast-moving changes)
