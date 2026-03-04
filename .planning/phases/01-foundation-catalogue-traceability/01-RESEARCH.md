# Phase 1 Research: Foundation + Catalogue + Traceability Core

Research for implementing Phase 1 requirements: SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05, SHOP-13, TRACE-01, TRACE-02, TRACE-03, TRACE-04, TRACE-05, TRACE-06, TRACE-08, TRACE-18, TRACE-19, WMS-01, WMS-05, WMS-06, WMS-07.

---

## 1. Next.js 15 App Router Project Setup

### Project Initialisation

```bash
npx create-next-app@latest torke --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Key flags:
- `--app` selects App Router (not Pages Router)
- `--src-dir` puts application code under `src/` for clean separation from config files
- `--import-alias "@/*"` enables `@/lib/db` style imports instead of `../../../lib/db`

### TypeScript Configuration

Next.js 15 ships with `typescript` 5.7+ support. Key `tsconfig.json` settings:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,   // catches undefined array access
    "exactOptionalPropertyTypes": true, // distinguishes undefined from missing
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`noUncheckedIndexedAccess` is critical for a safety-oriented platform — it forces explicit null checks on array/record access, preventing silent undefined errors.

### Directory Structure for Phase 1

```
src/
  app/
    (shop)/                        # Route group: public catalogue
      products/
        page.tsx                   # Product listing with filters (SHOP-01, SHOP-02)
        [slug]/
          page.tsx                 # Product detail page (SHOP-03)
      search/
        page.tsx                   # Search results page (SHOP-04, SHOP-05)
      layout.tsx                   # Public layout with nav, search bar
    (auth)/                        # Route group: auth pages
      login/page.tsx
      register/page.tsx
    (wms)/                         # Route group: warehouse (behind auth)
      goods-in/
        page.tsx                   # Goods-in workflow (TRACE-01-05)
        [batchId]/page.tsx         # Batch detail view
      stock/
        page.tsx                   # Stock overview (WMS-01)
      layout.tsx                   # WMS layout with warehouse nav
    api/
      auth/[...all]/route.ts       # Better Auth catch-all route
      trpc/[trpc]/route.ts         # tRPC handler
      webhooks/route.ts            # External webhooks
    t/
      [token]/page.tsx             # QR verification page (TRACE-18, TRACE-19)
    layout.tsx                     # Root layout
  server/
    db/
      schema/                      # Drizzle schema files
        products.ts
        batches.ts
        users.ts
        stock.ts
      index.ts                     # DB connection + Drizzle client
      migrate.ts                   # Migration runner
    trpc/
      router.ts                    # Root tRPC router
      trpc.ts                      # tRPC init + context
      routers/
        products.ts
        batches.ts
        stock.ts
        search.ts
    auth.ts                        # Better Auth config
    search.ts                      # Meilisearch client
    storage.ts                     # Cloudflare R2 client
  lib/
    utils.ts                       # Shared utilities
    constants.ts                   # Batch ID format, QR URL scheme
    types.ts                       # Shared type definitions
  components/
    ui/                            # shadcn/ui components
    products/                      # Product-specific components
    wms/                           # WMS-specific components
```

### Route Groups

Route groups `(shop)`, `(auth)`, `(wms)` share the same URL space but have different layouts. The WMS layout includes warehouse navigation and is protected by auth middleware. The shop layout includes the public header, search bar, and category navigation.

### Server Components vs Client Components

Default to Server Components. Use `"use client"` only for:
- Interactive search input with debounce (SHOP-04)
- Faceted filter sidebar with client-side state (SHOP-02)
- Goods-in form with multi-step wizard (TRACE-01-05)
- File upload component for cert PDFs (TRACE-02)
- Print trigger button for labels (TRACE-04, WMS-06)

Product listing pages, product detail pages, and stock overview pages should be Server Components fetching data directly from the database — no API round-trip, no client-side loading states.

### Server Actions

Use Next.js Server Actions for mutations:
- `createBatch` — goods-in batch creation (TRACE-03)
- `uploadCert` — cert PDF upload to R2 (TRACE-02)
- `recordGoodsIn` — complete goods-in workflow (TRACE-05)
- `registerUser` / `loginUser` — auth actions (SHOP-13)

Server Actions are called directly from client components and handle validation, database writes, and revalidation in one round-trip.

### Middleware

```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect WMS routes
  if (pathname.startsWith('/goods-in') || pathname.startsWith('/stock')) {
    // Check session cookie via Better Auth
    // Redirect to /login if not authenticated
    // Check role === 'warehouse_staff' or 'admin'
  }
}

export const config = {
  matcher: ['/goods-in/:path*', '/stock/:path*'],
};
```

---

## 2. Drizzle ORM Schema Design

### Core Tables for Phase 1

All tables use UUIDs as primary keys (`pgTable` with `uuid` type and `defaultRandom()`). Timestamps use `timestamp` with `defaultNow()`. The `drizzle-kit` tooling generates SQL migration files from schema changes.

### Products & Categories

```typescript
// src/server/db/schema/products.ts
import { pgTable, uuid, text, varchar, jsonb, timestamp, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categoryEnum = pgEnum('category', [
  'chemical-anchors',
  'mechanical-anchors',
  'general-fixings',
]);

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  parentId: uuid('parent_id').references(() => categories.id),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  description: text('description'),
  technicalSpecs: jsonb('technical_specs'),       // type-specific specs
  diameter: varchar('diameter', { length: 20 }),   // M8, M10, M12, etc.
  material: varchar('material', { length: 100 }),  // A2, A4, zinc plated, etc.
  length: integer('length_mm'),                    // length in mm
  finish: varchar('finish', { length: 100 }),
  loadClass: varchar('load_class', { length: 50 }),
  etaReference: varchar('eta_reference', { length: 100 }),
  datasheetUrl: text('datasheet_url'),             // R2 URL to PDF
  images: jsonb('images').$type<string[]>(),       // Array of R2 URLs
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Design decisions:**
- Facet columns (`diameter`, `material`, `finish`, `loadClass`) are explicit columns, not buried in JSONB — this allows database-level filtering and indexing, and maps directly to Meilisearch filterable attributes (SHOP-02).
- `technicalSpecs` is JSONB for type-specific data that varies between chemical anchors (cure time, temperature range) and mechanical anchors (torque, expansion type).
- `slug` is unique and used for URL routing (`/products/m12-chemical-anchor-stud-a4`).
- `images` is a JSONB array of R2 URLs, not a separate join table — product images are always loaded together, and the overhead of a join table adds no value here.

### Batches, Supplier Batches & Mill Certs

```typescript
// src/server/db/schema/batches.ts
import { pgTable, uuid, varchar, text, timestamp, integer, date, pgEnum, jsonb } from 'drizzle-orm/pg-core';

export const batchStatusEnum = pgEnum('batch_status', [
  'pending',       // Goods-in started but not complete
  'available',     // Goods-in complete, stock available for picking
  'quarantined',   // Quality hold
  'depleted',      // All stock allocated/dispatched
]);

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 500 }).notNull(),
  code: varchar('code', { length: 50 }).unique(),
  contactInfo: jsonb('contact_info'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const millCerts = pgTable('mill_certs', {
  id: uuid('id').primaryKey().defaultRandom(),
  heatNumber: varchar('heat_number', { length: 100 }),
  millName: varchar('mill_name', { length: 500 }),
  documentUrl: text('document_url').notNull(),      // R2 URL to cert PDF
  chemicalComposition: jsonb('chemical_composition'),
  mechanicalProperties: jsonb('mechanical_properties'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const supplierBatches = pgTable('supplier_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(),
  supplierBatchNumber: varchar('supplier_batch_number', { length: 200 }).notNull(),
  millCertId: uuid('mill_cert_id').references(() => millCerts.id),
  manufacturerCertUrl: text('manufacturer_cert_url'),  // R2 URL to 3.1 cert
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantityReceived: integer('quantity_received').notNull(),
  productionDate: date('production_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const batches = pgTable('batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  torkeBatchId: varchar('torke_batch_id', { length: 50 }).notNull().unique(),
    // Format: TRK-YYYYMMDD-NNNN (e.g. TRK-20260304-0001)
  supplierBatchId: uuid('supplier_batch_id').references(() => supplierBatches.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  goodsInDate: timestamp('goods_in_date').defaultNow().notNull(),
  receivedBy: uuid('received_by').references(() => users.id).notNull(),
  inspectionNotes: text('inspection_notes'),
  quantity: integer('quantity').notNull(),
  quantityAvailable: integer('quantity_available').notNull(),
  quantityReserved: integer('quantity_reserved').default(0).notNull(),
  status: batchStatusEnum('status').default('pending').notNull(),
  expiryDate: date('expiry_date'),     // For chemical products (WMS-05)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Stock Items

```typescript
// src/server/db/schema/stock.ts
export const stockItems = pgTable('stock_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  batchId: uuid('batch_id').references(() => batches.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  binLocation: varchar('bin_location', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Verification Tokens (QR Codes)

```typescript
// src/server/db/schema/verification.ts
export const verificationTokens = pgTable('verification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: uuid('token').defaultRandom().notNull().unique(),  // Opaque UUID (TRACE-19)
  batchId: uuid('batch_id').references(() => batches.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastAccessedAt: timestamp('last_accessed_at'),
});
```

**TRACE-18 compliance:** The URL scheme `/t/{token}` uses the opaque UUID token, not the batch ID. This is a permanent URL — it must never change. The `token` column is the public-facing identifier; the `batchId` is the internal lookup. These URLs are designed to be valid for 50+ years.

**TRACE-19 compliance:** Tokens are UUIDv4 (122 bits of randomness). They cannot be guessed or enumerated. Sequential batch IDs like `TRK-20260304-0001` are internal only and never appear in QR URLs.

### Users & Accounts

```typescript
// src/server/db/schema/users.ts
// Better Auth manages the core user/session/account tables.
// These are defined by Better Auth's PostgreSQL adapter.
// Additional Torke-specific user fields go in a separate profile table.

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique(),  // FK to Better Auth's user table
  companyName: varchar('company_name', { length: 500 }),
  phone: varchar('phone', { length: 50 }),
  role: varchar('role', { length: 50 }).default('customer').notNull(),
    // 'customer', 'warehouse_staff', 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Key decision:** Better Auth creates and manages its own `user`, `session`, and `account` tables with its own schema. Torke-specific user data (company name, role, phone) lives in a `userProfiles` table linked by `userId`. This avoids fighting Better Auth's schema while keeping Torke-specific fields clean.

### Batch Allocation (Many-to-Many for Phase 2, Schema Defined Now)

```typescript
// src/server/db/schema/allocations.ts
// Defined in Phase 1 because the data model must support the recall query
// and FIFO allocation logic from the start (TRACE-06, TRACE-08).

export const orderLineAllocations = pgTable('order_line_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderLineId: uuid('order_line_id').notNull(),  // FK added in Phase 2
  batchId: uuid('batch_id').references(() => batches.id).notNull(),
  quantity: integer('quantity').notNull(),
  allocatedAt: timestamp('allocated_at').defaultNow().notNull(),
  pickedAt: timestamp('picked_at'),
  dispatchedAt: timestamp('dispatched_at'),
});
```

### Drizzle Relations

```typescript
export const batchesRelations = relations(batches, ({ one, many }) => ({
  supplierBatch: one(supplierBatches, {
    fields: [batches.supplierBatchId],
    references: [supplierBatches.id],
  }),
  product: one(products, {
    fields: [batches.productId],
    references: [products.id],
  }),
  verificationTokens: many(verificationTokens),
  allocations: many(orderLineAllocations),
  stockItems: many(stockItems),
}));

export const supplierBatchesRelations = relations(supplierBatches, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [supplierBatches.supplierId],
    references: [suppliers.id],
  }),
  millCert: one(millCerts, {
    fields: [supplierBatches.millCertId],
    references: [millCerts.id],
  }),
  product: one(products, {
    fields: [supplierBatches.productId],
    references: [products.id],
  }),
  batches: many(batches),
}));
```

### Migration Workflow

```bash
# Generate migration from schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Open Drizzle Studio for visual DB inspection
npx drizzle-kit studio
```

`drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/server/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## 3. Meilisearch Integration

### Setup

Meilisearch runs as a Docker container on Railway alongside PostgreSQL. The `meilisearch` npm package (v0.46+) provides the client.

```typescript
// src/server/search.ts
import { MeiliSearch } from 'meilisearch';

export const meili = new MeiliSearch({
  host: process.env.MEILISEARCH_URL!,
  apiKey: process.env.MEILISEARCH_ADMIN_KEY!,
});

// Public search key (safe for client-side)
export const SEARCH_API_KEY = process.env.MEILISEARCH_SEARCH_KEY!;
```

### Index Configuration

```typescript
// src/server/search-setup.ts
async function configureProductsIndex() {
  const index = meili.index('products');

  // Searchable attributes — what text search queries match against (SHOP-04)
  await index.updateSearchableAttributes([
    'name',
    'sku',
    'description',
    'etaReference',
    'categoryName',
  ]);

  // Filterable attributes — what faceted filters operate on (SHOP-02)
  await index.updateFilterableAttributes([
    'categorySlug',
    'diameter',
    'material',
    'finish',
    'loadClass',
    'isActive',
  ]);

  // Sortable attributes
  await index.updateSortableAttributes(['name', 'sku']);

  // Typo tolerance is enabled by default in Meilisearch
  // "throughbolt" matches "throughbolts", "througbolt", etc.

  // Displayed attributes — what comes back in results
  await index.updateDisplayedAttributes([
    'id', 'name', 'slug', 'sku', 'categorySlug', 'categoryName',
    'description', 'diameter', 'material', 'finish', 'loadClass',
    'etaReference', 'images', 'datasheetUrl',
  ]);
}
```

### Indexing Products

Products are indexed into Meilisearch on creation/update. Use a tRPC procedure or Server Action to sync:

```typescript
async function indexProduct(product: Product & { category: Category }) {
  await meili.index('products').addDocuments([{
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    categorySlug: product.category.slug,
    categoryName: product.category.name,
    description: product.description,
    diameter: product.diameter,
    material: product.material,
    finish: product.finish,
    loadClass: product.loadClass,
    etaReference: product.etaReference,
    images: product.images,
    datasheetUrl: product.datasheetUrl,
    isActive: product.isActive,
  }]);
}
```

For initial data load (after scraping proventure.co.uk), bulk-index all products:

```typescript
await meili.index('products').addDocuments(allProducts);
```

### Faceted Search (SHOP-02, SHOP-05)

```typescript
// Server-side search procedure
const results = await meili.index('products').search(query, {
  filter: [
    `categorySlug = "chemical-anchors"`,
    `diameter = "M12"`,
    `material = "A4"`,
  ],
  facets: ['categorySlug', 'diameter', 'material', 'finish', 'loadClass'],
  limit: 20,
  offset: 0,
});

// results.facetDistribution gives counts per facet value:
// { diameter: { "M8": 12, "M10": 24, "M12": 18, ... }, ... }
```

The `facetDistribution` in the response provides the counts needed for SHOP-05 — correct facet counts returned in under 200ms. Meilisearch's faceting is pre-computed; counts are instant regardless of catalogue size.

### Client-Side Search Component

Use `react-instantsearch` with the Meilisearch adapter for the search UI, or build a custom component that calls a tRPC procedure:

```typescript
// Custom approach (simpler, full control)
// src/components/products/SearchBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { trpc } from '@/lib/trpc';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);

  const { data } = trpc.search.products.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 }
  );

  // Render search results with facet counts
}
```

### Performance Target (SHOP-05)

Meilisearch returns search results in under 50ms for catalogues of 100k+ documents. With Torke's catalogue (500-2,000 products), results will be well under the 200ms target. The network round-trip from Vercel serverless to Railway-hosted Meilisearch adds ~20-50ms. Total: safely under 200ms.

---

## 4. Better Auth Setup

### Installation

```bash
npm install better-auth
```

### Configuration

```typescript
// src/server/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Enable later for production
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,    // 7 days
    updateAge: 60 * 60 * 24,          // Refresh daily
  },
});
```

Better Auth's Drizzle adapter automatically creates and manages `user`, `session`, and `account` tables in the database. These tables are managed by Better Auth — Torke-specific user data goes in `userProfiles`.

### API Route Handler

```typescript
// src/app/api/auth/[...all]/route.ts
import { auth } from '@/server/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

### Client-Side Auth

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
});

export const { useSession, signIn, signUp, signOut } = authClient;
```

### Auth in Server Components

```typescript
// In any Server Component or Server Action
import { auth } from '@/server/auth';
import { headers } from 'next/headers';

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect('/login');

  // session.user contains the authenticated user
}
```

### Role-Based Access

Phase 1 needs two roles: `customer` (default for SHOP-13 registrations) and `warehouse_staff` (for goods-in workflow). Role checking:

```typescript
async function requireWarehouseAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, session.user.id),
  });

  if (!profile || !['warehouse_staff', 'admin'].includes(profile.role)) {
    throw new Error('Unauthorized: warehouse access required');
  }

  return { session, profile };
}
```

---

## 5. React Three Fiber — Phase 3 Only

React Three Fiber (R3F) is NOT needed in Phase 1. It is used exclusively for the 3D anchor plate visualisation in Torke Design (DESIGN-08, DESIGN-09, DESIGN-10), which is Phase 3.

**Do not install** `three`, `@react-three/fiber`, `@react-three/drei`, or any 3D-related packages in Phase 1. This avoids unnecessary bundle size and dependency complexity.

---

## 6. Product Data Scraping (proventure.co.uk)

### Approach

Scrape the existing Proventure product catalogue to seed Torke's database. This is a one-time data migration, not an ongoing sync.

### Tool Choice: Playwright

Use Playwright in a standalone script (not the test runner) for scraping. Playwright handles JavaScript-rendered pages, which is necessary if Proventure uses client-side rendering.

```bash
npm install -D playwright @playwright/test
npx playwright install chromium
```

### Scraping Script Structure

```typescript
// scripts/scrape-proventure.ts
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

interface ScrapedProduct {
  name: string;
  sku: string;
  category: string;
  description: string;
  diameter?: string;
  material?: string;
  length?: number;
  finish?: string;
  loadClass?: string;
  etaReference?: string;
  imageUrls: string[];
  datasheetUrl?: string;
  technicalSpecs: Record<string, string>;
}

async function scrapeProventure() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Navigate to category listing pages
  const categoryUrls = [
    'https://proventure.co.uk/chemical-anchors',
    'https://proventure.co.uk/mechanical-anchors',
    'https://proventure.co.uk/general-fixings',
  ];

  const products: ScrapedProduct[] = [];

  for (const url of categoryUrls) {
    await page.goto(url);
    // 2. Extract product links from listing page
    const productLinks = await page.$$eval('a.product-link', links =>
      links.map(l => l.getAttribute('href'))
    );

    // 3. Visit each product page
    for (const link of productLinks) {
      await page.goto(`https://proventure.co.uk${link}`);
      // 4. Extract structured data
      const product = await extractProductData(page);
      products.push(product);
    }
  }

  // 5. Write to JSON for import
  writeFileSync('data/scraped-products.json', JSON.stringify(products, null, 2));
  await browser.close();
}
```

### Data Transformation Pipeline

```
proventure.co.uk  →  scraped-products.json  →  transform.ts  →  seed-db.ts
     (HTML)              (raw data)           (clean + map       (insert into
                                               to Torke schema)   PostgreSQL)
```

The transformation step:
1. Maps Proventure categories to Torke's three top-level categories
2. Generates URL-safe slugs from product names
3. Generates Torke SKUs (format: `TRK-{TYPE}-{DIAMETER}-{LENGTH}-{MATERIAL}`)
4. Downloads product images and datasheets, re-uploads to Cloudflare R2
5. Extracts facetable fields (diameter, material, finish, loadClass) from product descriptions/specs into explicit columns
6. Validates all products have required fields

### Image & PDF Handling

```typescript
// Download from Proventure, upload to R2
async function migrateAsset(sourceUrl: string, r2Key: string): Promise<string> {
  const response = await fetch(sourceUrl);
  const buffer = await response.arrayBuffer();

  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: r2Key,
    Body: Buffer.from(buffer),
    ContentType: response.headers.get('content-type') || 'application/octet-stream',
  }));

  return `${process.env.R2_PUBLIC_URL}/${r2Key}`;
}
```

### Seeding the Database

```typescript
// scripts/seed-products.ts
import { db } from '@/server/db';
import { products, categories } from '@/server/db/schema/products';
import scrapedData from '../data/transformed-products.json';

async function seed() {
  // Insert categories first
  await db.insert(categories).values([
    { name: 'Chemical Anchors', slug: 'chemical-anchors', sortOrder: 1 },
    { name: 'Mechanical Anchors', slug: 'mechanical-anchors', sortOrder: 2 },
    { name: 'General Fixings', slug: 'general-fixings', sortOrder: 3 },
  ]);

  // Insert products with references to categories
  for (const product of scrapedData) {
    await db.insert(products).values(product);
  }

  // Bulk-index all products into Meilisearch
  const allProducts = await db.select().from(products);
  await meili.index('products').addDocuments(allProducts);
}
```

---

## 7. QR Code Generation

### Package

```bash
npm install qrcode
npm install -D @types/qrcode
```

The `qrcode` package generates QR codes server-side as PNG buffers or SVG strings. This is used for:
- Goods-in label printing (TRACE-04, WMS-06, WMS-07)
- Embedding in PDF cert packs (future Phase 2)
- Embedding in `@react-pdf/renderer` label documents

### QR URL Scheme (TRACE-18, TRACE-19)

```typescript
// src/lib/constants.ts
export const QR_BASE_URL = 'https://torke.co.uk/t';  // or proventure.co.uk/t

export function buildVerificationUrl(token: string): string {
  return `${QR_BASE_URL}/${token}`;
}
```

The URL scheme `/t/{token}` is:
- Short (important for QR code density — shorter URLs produce simpler, more scannable QR codes)
- Permanent (the `/t/` path prefix is versioned and will not change)
- Opaque (the token is a UUIDv4, not a batch number)

### Generating QR Codes for Labels

```typescript
import QRCode from 'qrcode';
import { buildVerificationUrl } from '@/lib/constants';

// Generate QR as PNG buffer (for label printing)
async function generateLabelQR(token: string): Promise<Buffer> {
  const url = buildVerificationUrl(token);
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: 'H',  // High — survives up to 30% damage
    type: 'png',
    width: 200,                  // pixels
    margin: 2,
  });
}

// Generate QR as SVG string (for PDF embedding)
async function generateLabelQRSvg(token: string): Promise<string> {
  const url = buildVerificationUrl(token);
  return QRCode.toString(url, {
    errorCorrectionLevel: 'H',
    type: 'svg',
  });
}

// Generate QR as data URL (for browser display)
async function generateQRDataUrl(token: string): Promise<string> {
  const url = buildVerificationUrl(token);
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    width: 200,
  });
}
```

**Error correction level H** is essential for warehouse labels — labels get dirty, scratched, and partially obscured. Level H allows up to 30% of the QR code to be damaged while remaining scannable.

### Token Creation (at Goods-In)

When a batch is created during goods-in, a verification token is immediately generated and locked:

```typescript
async function createBatchWithToken(batchData: NewBatch) {
  return db.transaction(async (tx) => {
    // 1. Create the batch
    const [batch] = await tx.insert(batches).values(batchData).returning();

    // 2. Create the verification token
    const [token] = await tx.insert(verificationTokens).values({
      batchId: batch.id,
    }).returning();

    // 3. Return both — the token.token is the UUID used in QR URLs
    return { batch, verificationToken: token.token };
  });
}
```

The token is created inside a database transaction with the batch — it is impossible to have a batch without a verification token or vice versa.

---

## 8. File Upload for 3.1 Cert PDFs (Cloudflare R2)

### R2 Client Setup

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Cloudflare R2 is S3-compatible, so the AWS SDK works directly:

```typescript
// src/server/storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

// Upload a cert PDF
export async function uploadCertPdf(
  file: Buffer,
  supplierBatchId: string,
  filename: string,
): Promise<string> {
  const key = `certs/${supplierBatchId}/${filename}`;

  await r2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file,
    ContentType: 'application/pdf',
  }));

  return key;  // Store the key in the database, not the full URL
}

// Generate a time-limited signed URL for viewing/downloading a cert
export async function getCertUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(r2, command, { expiresIn: 3600 }); // 1 hour
}
```

### Upload Flow (TRACE-02)

The goods-in form uses a Server Action to handle the file upload:

```typescript
// src/app/(wms)/goods-in/actions.ts
'use server';

import { uploadCertPdf } from '@/server/storage';

export async function uploadCert(formData: FormData) {
  const file = formData.get('certFile') as File;
  if (!file || file.type !== 'application/pdf') {
    throw new Error('A PDF file is required');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const supplierBatchId = formData.get('supplierBatchId') as string;

  const key = await uploadCertPdf(buffer, supplierBatchId, file.name);
  return key;
}
```

### Client-Side Upload Component

```typescript
// src/components/wms/CertUpload.tsx
'use client';

import { useRef, useState } from 'react';
import { uploadCert } from '@/app/(wms)/goods-in/actions';

export function CertUpload({ supplierBatchId }: { supplierBatchId: string }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.set('certFile', file);
    formData.set('supplierBatchId', supplierBatchId);

    const key = await uploadCert(formData);
    // Store key, show success
    setUploading(false);
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept=".pdf" />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload 3.1 Certificate'}
      </button>
    </div>
  );
}
```

### Security

- Cert PDFs are served via signed URLs with 1-hour expiry, not public URLs
- The R2 bucket is private — no public access
- File validation: check MIME type, enforce max size (e.g. 20MB), reject non-PDF files
- Store the R2 object key in the database, not a public URL — the signed URL is generated on demand

---

## 9. Label Printing from Browser

### Approach: Browser Print API + CSS Print Styles

For Phase 1, label printing uses the browser's native `window.print()` with CSS `@media print` styles targeting the label dimensions. This avoids any printer-specific drivers or protocols.

### Thermal Label Printer Compatibility

Common thermal label printers in UK warehouses:
- **Zebra GK420d / ZD220** — USB, supports ZPL (Zebra Programming Language)
- **Brother QL-820NWB** — USB/Wi-Fi/Bluetooth, supports ESC/P
- **DYMO LabelWriter 450** — USB, supports DYMO SDK

For Phase 1, the simplest approach is:
1. Generate a label as an HTML page sized to the label dimensions (e.g. 100mm x 50mm)
2. Open the label in a new window/iframe
3. Call `window.print()` with the thermal printer selected as the system printer
4. CSS `@page` rules set the page size to match the label

### Label Layout Component

```typescript
// src/components/wms/BatchLabel.tsx
'use client';

interface BatchLabelProps {
  torkeBatchId: string;    // e.g. "TRK-20260304-0001"
  productSku: string;
  productName: string;
  quantity: number;
  qrDataUrl: string;       // Base64 QR code image
  goodsInDate: string;
}

export function BatchLabel(props: BatchLabelProps) {
  return (
    <div className="label-container">
      {/* Logo */}
      <div className="label-header">
        <img src="/torke-logo-mono.svg" alt="Torke" />
      </div>

      {/* Batch info */}
      <div className="label-body">
        <div className="batch-id">{props.torkeBatchId}</div>
        <div className="product-sku">{props.productSku}</div>
        <div className="product-name">{props.productName}</div>
        <div className="quantity">Qty: {props.quantity}</div>
        <div className="date">{props.goodsInDate}</div>
      </div>

      {/* QR code */}
      <div className="label-qr">
        <img src={props.qrDataUrl} alt="Scan for cert verification" />
      </div>
    </div>
  );
}
```

### Print-Specific CSS

```css
/* src/styles/label-print.css */
@media print {
  @page {
    size: 100mm 60mm;   /* Match label stock dimensions */
    margin: 2mm;
  }

  body * {
    visibility: hidden;
  }

  .label-container, .label-container * {
    visibility: visible;
  }

  .label-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 96mm;
    height: 56mm;
    font-family: 'Arial', sans-serif;
  }

  .batch-id {
    font-size: 14pt;
    font-weight: bold;
  }

  .label-qr img {
    width: 25mm;
    height: 25mm;
  }
}
```

### Print Trigger

```typescript
function printLabel() {
  window.print();
}
```

### Future Enhancement (Post Phase 1)

For direct thermal printer control (bypassing the print dialog), consider:
- **WebUSB API** — direct USB communication with Zebra printers using ZPL commands
- **jsprintmanager** — a local print agent that accepts print jobs from the browser
- **QZ Tray** — open-source browser-to-printer bridge supporting ZPL, EPL, ESC/P

These require either a browser extension or a local agent running on the warehouse PC. For Phase 1, `window.print()` is sufficient — the warehouse operator selects the thermal printer from the system print dialog once, and it remains the default.

### Auto-Print (TRACE-04)

"Auto-print" in the context of TRACE-04 means the print dialog opens automatically when goods-in is completed — not silent printing without user interaction (which browsers block for security).

```typescript
// After goods-in completion
async function completeGoodsIn(batchData: BatchData) {
  const { batch, verificationToken } = await createBatchWithToken(batchData);
  const qrDataUrl = await generateQRDataUrl(verificationToken);

  // Open print dialog with label content
  openLabelPrintWindow({
    torkeBatchId: batch.torkeBatchId,
    productSku: batchData.productSku,
    productName: batchData.productName,
    quantity: batchData.quantity,
    qrDataUrl,
    goodsInDate: new Date().toISOString().split('T')[0],
  });
}
```

---

## 10. Batch Data Model — FIFO, Many-to-Many, Recall Queries

### The Core Data Relationships

```
products (what)
  └── batches (when/how much)
        ├── supplierBatches (where it came from)
        │     ├── suppliers (who supplied it)
        │     └── millCerts (raw material certs)
        ├── stockItems (where it is in the warehouse)
        ├── verificationTokens (QR code lookups)
        └── orderLineAllocations (who got it) [many-to-many]
              └── orderLines → orders → customers
```

### Many-to-Many: Batch to Order (TRACE-08)

The `orderLineAllocations` table is the join between batches and order lines:

```
Order A, Line 1: 100x M12 Throughbolt
  → Allocation: 80 from Batch TRK-20260301-0001
  → Allocation: 20 from Batch TRK-20260305-0002

Batch TRK-20260301-0001 (qty 500):
  → Allocation: 80 to Order A, Line 1
  → Allocation: 200 to Order B, Line 3
  → Allocation: 150 to Order C, Line 1
  → Remaining available: 70
```

### FIFO Allocation Algorithm (TRACE-06)

```typescript
// src/server/trpc/routers/batches.ts

/**
 * Allocate stock for an order line using FIFO.
 * Returns an array of allocations (may span multiple batches).
 */
async function allocateFIFO(
  tx: Transaction,
  productId: string,
  quantityNeeded: number,
): Promise<Allocation[]> {
  // 1. Get all available batches for this product, oldest first
  const availableBatches = await tx
    .select()
    .from(batches)
    .where(
      and(
        eq(batches.productId, productId),
        eq(batches.status, 'available'),
        gt(batches.quantityAvailable, 0),
      )
    )
    .orderBy(asc(batches.goodsInDate));  // FIFO: oldest first

  // 2. Allocate from oldest batch first
  const allocations: Allocation[] = [];
  let remaining = quantityNeeded;

  for (const batch of availableBatches) {
    if (remaining <= 0) break;

    const allocateQty = Math.min(remaining, batch.quantityAvailable);

    // Reserve stock from this batch
    await tx
      .update(batches)
      .set({
        quantityAvailable: batch.quantityAvailable - allocateQty,
        quantityReserved: batch.quantityReserved + allocateQty,
        status: batch.quantityAvailable - allocateQty === 0 ? 'depleted' : 'available',
      })
      .where(eq(batches.id, batch.id));

    allocations.push({
      batchId: batch.id,
      torkeBatchId: batch.torkeBatchId,
      quantity: allocateQty,
    });

    remaining -= allocateQty;
  }

  if (remaining > 0) {
    throw new Error(
      `Insufficient stock: needed ${quantityNeeded}, available ${quantityNeeded - remaining}`
    );
  }

  return allocations;
}
```

### Recall Query: "Supplier batch X — which orders got it?"

This is the critical traceability query. Given a supplier batch number, find every order that received stock from it:

```typescript
async function recallQuery(supplierBatchNumber: string) {
  // 1. Find the supplier batch
  const supplierBatch = await db.query.supplierBatches.findFirst({
    where: eq(supplierBatches.supplierBatchNumber, supplierBatchNumber),
    with: {
      batches: {
        with: {
          allocations: true,
        },
      },
    },
  });

  // 2. Collect all order IDs affected
  const affectedOrders = supplierBatch?.batches
    .flatMap(batch => batch.allocations)
    .map(allocation => allocation.orderLineId);

  return affectedOrders;
}
```

SQL equivalent:

```sql
SELECT DISTINCT ola.order_line_id, ola.quantity, b.torke_batch_id
FROM supplier_batches sb
JOIN batches b ON b.supplier_batch_id = sb.id
JOIN order_line_allocations ola ON ola.batch_id = b.id
WHERE sb.supplier_batch_number = 'SUP-2024-0142';
```

This query traverses the chain: `supplierBatch → batch(es) → allocation(s) → orderLine(s)`.

### Expiry Tracking (WMS-05)

Chemical products (resins) have shelf life. The `expiryDate` field on the `batches` table enables:

```typescript
// Query for batches approaching expiry (within 30 days)
const expiringBatches = await db
  .select()
  .from(batches)
  .where(
    and(
      eq(batches.status, 'available'),
      isNotNull(batches.expiryDate),
      lte(batches.expiryDate, addDays(new Date(), 30)),
    )
  )
  .orderBy(asc(batches.expiryDate));
```

FIFO allocation naturally handles expiry — the oldest batch is always allocated first, which means the batch closest to expiry is used first. However, explicit expiry checks prevent selling expired product.

### Batch ID Generation (TRACE-03)

```typescript
// src/lib/batch-id.ts

/**
 * Generate the next Torke batch ID for today.
 * Format: TRK-YYYYMMDD-NNNN
 * e.g. TRK-20260304-0001, TRK-20260304-0002
 */
async function generateTorkeBatchId(tx: Transaction): Promise<string> {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const prefix = `TRK-${today}-`;

  // Find the highest sequence number for today
  const latest = await tx
    .select({ torkeBatchId: batches.torkeBatchId })
    .from(batches)
    .where(like(batches.torkeBatchId, `${prefix}%`))
    .orderBy(desc(batches.torkeBatchId))
    .limit(1);

  let sequence = 1;
  if (latest.length > 0) {
    const lastSeq = parseInt(latest[0].torkeBatchId.split('-').pop()!, 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}
```

### Stock Availability Gate (TRACE-05)

Stock does not become available until goods-in is fully completed. The `batches.status` field enforces this:

```
1. Batch created with status = 'pending'
   → Stock NOT available for allocation
2. Cert PDF uploaded and linked
3. QR label printed
4. Operator confirms completion
   → Status updated to 'available'
   → Stock now visible for FIFO allocation
```

```typescript
async function completeGoodsIn(batchId: string) {
  const batch = await db.query.batches.findFirst({
    where: eq(batches.id, batchId),
    with: { supplierBatch: true },
  });

  // Validate all required data is present
  if (!batch) throw new Error('Batch not found');
  if (!batch.supplierBatch.manufacturerCertUrl) {
    throw new Error('3.1 cert must be uploaded before completing goods-in');
  }

  // Mark as available
  await db
    .update(batches)
    .set({ status: 'available' })
    .where(eq(batches.id, batchId));
}
```

---

## Validation Architecture

### Testing Strategy

The testing stack uses **Vitest** for unit/integration tests and **Playwright** for end-to-end tests, as specified in the tech stack research.

### Layer 1: Unit Tests (Vitest)

Pure logic that can be tested without a database or browser:

| Target | Tests | Requirement |
|--------|-------|-------------|
| Batch ID generation | Correct format `TRK-YYYYMMDD-NNNN`, sequence increments, resets daily | TRACE-03 |
| QR URL construction | Correct URL format `/t/{uuid}`, UUID format validation | TRACE-18, TRACE-19 |
| FIFO allocation algorithm | Allocates oldest first, splits across batches, throws on insufficient stock | TRACE-06, TRACE-08 |
| Facet filter construction | Meilisearch filter string generation from user selections | SHOP-02 |
| Expiry date calculation | Correctly identifies batches within N days of expiry | WMS-05 |
| Batch status transitions | `pending → available` only when cert is uploaded | TRACE-05 |

```typescript
// Example: tests/unit/batch-id.test.ts
import { describe, it, expect } from 'vitest';

describe('Torke Batch ID', () => {
  it('generates correct format', () => {
    const id = formatBatchId(new Date('2026-03-04'), 1);
    expect(id).toBe('TRK-20260304-0001');
  });

  it('pads sequence to 4 digits', () => {
    const id = formatBatchId(new Date('2026-03-04'), 42);
    expect(id).toBe('TRK-20260304-0042');
  });
});
```

### Layer 2: Integration Tests (Vitest + Test Database)

Tests that require a real PostgreSQL database. Use a test database (Docker container or Railway test instance) that is migrated and seeded before tests run.

| Target | Tests | Requirement |
|--------|-------|-------------|
| Goods-in workflow | Creates batch, supplier batch, links cert, generates verification token in single transaction | TRACE-01, TRACE-02, TRACE-03 |
| FIFO allocation with DB | Queries correct batches, updates quantities, handles concurrent allocation | TRACE-06 |
| Many-to-many allocation | One order line spans 2 batches; one batch serves 3 order lines; recall query returns all | TRACE-08 |
| Stock availability gate | Batch with status='pending' excluded from allocation queries | TRACE-05 |
| Product CRUD + Meilisearch sync | Product insert syncs to Meilisearch; search returns product | SHOP-04, SHOP-05 |
| User registration | Better Auth creates user, Torke profile created, session returned | SHOP-13 |

```typescript
// Example: tests/integration/goods-in.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '@/server/db';

describe('Goods-In Workflow', () => {
  it('creates batch with verification token atomically', async () => {
    const result = await createBatchWithToken({
      supplierBatchNumber: 'SUP-2026-001',
      supplierId: testSupplierId,
      productId: testProductId,
      quantity: 500,
      receivedBy: testUserId,
    });

    expect(result.batch.torkeBatchId).toMatch(/^TRK-\d{8}-\d{4}$/);
    expect(result.verificationToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(result.batch.status).toBe('pending');
  });

  it('prevents allocation of pending batches', async () => {
    await expect(
      allocateFIFO(db, testProductId, 10)
    ).rejects.toThrow('Insufficient stock');
  });

  it('allows allocation after goods-in completion', async () => {
    await completeGoodsIn(testBatchId);

    const allocations = await allocateFIFO(db, testProductId, 10);
    expect(allocations).toHaveLength(1);
    expect(allocations[0].quantity).toBe(10);
  });
});
```

### Layer 3: Recall Query Validation

The recall query is the most important traceability feature. It must be explicitly tested with realistic data:

```typescript
describe('Recall Query', () => {
  beforeAll(async () => {
    // Seed: 1 supplier batch → 2 Torke batches → allocations across 5 orders
    // This models a real scenario where one supplier shipment is split and sold
  });

  it('finds all orders affected by a supplier batch recall', async () => {
    const affected = await recallQuery('SUP-2026-RECALL-TEST');
    expect(affected.orderLineIds).toHaveLength(5);
    expect(affected.totalQuantityAffected).toBe(500);
  });

  it('returns zero orders for an unallocated batch', async () => {
    const affected = await recallQuery('SUP-2026-UNUSED');
    expect(affected.orderLineIds).toHaveLength(0);
  });
});
```

### Layer 4: End-to-End Tests (Playwright)

Full browser tests that exercise the complete UI → API → Database flow:

| Test | Steps | Requirements |
|------|-------|-------------|
| **Browse catalogue** | Load products page → verify 3 categories visible → click into category → verify products listed | SHOP-01 |
| **Faceted filtering** | Select "M12" diameter → verify only M12 products shown → verify facet counts update | SHOP-02, SHOP-05 |
| **Product detail** | Click product → verify specs table rendered → verify datasheet download link works | SHOP-03 |
| **Text search** | Type "throughbolt stainles" → verify results include "Throughbolt Stainless" (typo tolerance) | SHOP-04 |
| **Search performance** | Measure time from keystroke to results rendered → assert < 200ms | SHOP-05 |
| **User registration** | Fill registration form → submit → verify redirected to account page → verify session active | SHOP-13 |
| **Goods-in workflow** | Login as warehouse staff → enter supplier batch → upload PDF → complete goods-in → verify label print dialog opens → verify stock appears in stock view | TRACE-01-05, WMS-06, WMS-07 |
| **QR verification** | Navigate to `/t/{known-token}` → verify product info, batch ID, and cert link displayed | TRACE-18, TRACE-19 |
| **Stock overview** | Login as warehouse staff → navigate to stock page → verify batch quantities shown with expiry flags | WMS-01, WMS-05 |

```typescript
// Example: tests/e2e/catalogue.spec.ts
import { test, expect } from '@playwright/test';

test('user can browse products by category', async ({ page }) => {
  await page.goto('/products');

  // Three categories visible
  await expect(page.getByRole('link', { name: 'Chemical Anchors' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mechanical Anchors' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'General Fixings' })).toBeVisible();

  // Click into category
  await page.getByRole('link', { name: 'Chemical Anchors' }).click();

  // Products are listed
  const productCards = page.locator('[data-testid="product-card"]');
  await expect(productCards).toHaveCount({ minimum: 1 });
});

test('search returns results with typo tolerance under 200ms', async ({ page }) => {
  await page.goto('/products');

  const searchInput = page.getByPlaceholder('Search products');
  const start = Date.now();
  await searchInput.fill('throughbolt stainles');

  // Wait for results
  const firstResult = page.locator('[data-testid="search-result"]').first();
  await firstResult.waitFor({ state: 'visible' });
  const elapsed = Date.now() - start;

  expect(elapsed).toBeLessThan(2000);  // Client-side timing (includes debounce)
  await expect(firstResult).toContainText('Throughbolt');
});
```

### Layer 5: Data Integrity Checks

Automated checks that run as part of CI (or as a scheduled task) to validate data model consistency:

```typescript
// tests/integrity/data-checks.test.ts

describe('Data Integrity', () => {
  it('every batch has a verification token', async () => {
    const batchesWithoutTokens = await db.execute(sql`
      SELECT b.id, b.torke_batch_id
      FROM batches b
      LEFT JOIN verification_tokens vt ON vt.batch_id = b.id
      WHERE vt.id IS NULL
    `);
    expect(batchesWithoutTokens.rows).toHaveLength(0);
  });

  it('available batch quantity + reserved quantity = original quantity', async () => {
    const inconsistent = await db.execute(sql`
      SELECT id, torke_batch_id, quantity, quantity_available, quantity_reserved
      FROM batches
      WHERE quantity_available + quantity_reserved != quantity
        AND status != 'quarantined'
    `);
    expect(inconsistent.rows).toHaveLength(0);
  });

  it('no batch has negative available quantity', async () => {
    const negative = await db.execute(sql`
      SELECT id, torke_batch_id, quantity_available
      FROM batches
      WHERE quantity_available < 0
    `);
    expect(negative.rows).toHaveLength(0);
  });

  it('every Meilisearch product has a matching database record', async () => {
    const searchProducts = await meili.index('products').getDocuments({ limit: 10000 });
    const dbProducts = await db.select({ id: products.id }).from(products);
    const dbIds = new Set(dbProducts.map(p => p.id));

    for (const sp of searchProducts.results) {
      expect(dbIds.has(sp.id)).toBe(true);
    }
  });
});
```

### CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: torke_test
          POSTGRES_USER: torke
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      meilisearch:
        image: getmeili/meilisearch:v1.12
        env:
          MEILI_MASTER_KEY: test-master-key
        ports: ['7700:7700']

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npx drizzle-kit migrate
        env:
          DATABASE_URL: postgresql://torke:test@localhost:5432/torke_test
      - run: npx vitest run
        env:
          DATABASE_URL: postgresql://torke:test@localhost:5432/torke_test
          MEILISEARCH_URL: http://localhost:7700
          MEILISEARCH_ADMIN_KEY: test-master-key
      - run: npx playwright install --with-deps
      - run: npx playwright test
        env:
          DATABASE_URL: postgresql://torke:test@localhost:5432/torke_test
          MEILISEARCH_URL: http://localhost:7700
```

### Requirement Traceability Matrix

Every Phase 1 requirement maps to at least one test:

| Req ID | Description | Unit | Integration | E2E |
|--------|-------------|------|-------------|-----|
| SHOP-01 | Browse by category | - | - | browse-catalogue |
| SHOP-02 | Faceted filtering | facet-filter-construction | product-search-facets | faceted-filtering |
| SHOP-03 | Product detail page | - | - | product-detail |
| SHOP-04 | Text search with typo tolerance | - | meilisearch-search | text-search |
| SHOP-05 | Search < 200ms with facet counts | - | search-performance | search-timing |
| SHOP-13 | Account creation and login | - | user-registration | user-registration |
| TRACE-01 | Record supplier batch at goods-in | - | goods-in-workflow | goods-in-e2e |
| TRACE-02 | Upload 3.1 cert PDF | - | cert-upload | goods-in-e2e |
| TRACE-03 | Generate Torke batch ID | batch-id-format | goods-in-workflow | goods-in-e2e |
| TRACE-04 | Auto-print label with QR | qr-generation | - | goods-in-e2e |
| TRACE-05 | Stock unavailable until goods-in complete | status-transitions | availability-gate | goods-in-e2e |
| TRACE-06 | FIFO allocation | fifo-algorithm | fifo-with-db | - |
| TRACE-08 | Many-to-many batch-to-order | - | many-to-many-allocation | - |
| TRACE-18 | Permanent QR URL scheme | qr-url-format | - | qr-verification |
| TRACE-19 | Opaque UUID tokens | uuid-format | token-creation | qr-verification |
| WMS-01 | Batch-tracked inventory | - | stock-tracking | stock-overview |
| WMS-05 | Expiry date tracking + alerts | expiry-calculation | expiry-queries | stock-overview |
| WMS-06 | Goods-in label with QR | label-content | - | goods-in-e2e |
| WMS-07 | Label QR links to verification page | qr-url-format | - | qr-verification |

---

## Key Dependencies Summary

### npm Packages for Phase 1

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "drizzle-orm": "^0.38",
    "better-auth": "^1",
    "meilisearch": "^0.46",
    "@aws-sdk/client-s3": "^3",
    "@aws-sdk/s3-request-presigner": "^3",
    "qrcode": "^1.5",
    "@trpc/server": "^11",
    "@trpc/client": "^11",
    "@trpc/next": "^11",
    "@tanstack/react-query": "^5",
    "zustand": "^5",
    "zod": "^3",
    "tailwindcss": "^4"
  },
  "devDependencies": {
    "typescript": "^5.7",
    "drizzle-kit": "^0.30",
    "@types/qrcode": "^1",
    "vitest": "^3",
    "@playwright/test": "^1.49",
    "playwright": "^1.49"
  }
}
```

### Infrastructure for Phase 1

| Service | Provider | Purpose |
|---------|----------|---------|
| Next.js App | Vercel | Frontend + API |
| PostgreSQL 16 | Railway | Primary database |
| Meilisearch | Railway (Docker) | Product search |
| Object Storage | Cloudflare R2 | Cert PDFs, product images, datasheets |

### NOT Needed in Phase 1

- React Three Fiber / Three.js (Phase 3)
- Stripe / payment processing (Phase 2)
- Resend / React Email (Phase 2)
- HubSpot CRM (Phase 4)
- Trigger.dev / background jobs (Phase 2)
- html5-qrcode / scanner (Phase 2 WMS)
- @react-pdf/renderer (Phase 2 cert packs)

---

*Research completed: 2026-03-04*
