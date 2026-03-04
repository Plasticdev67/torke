# Phase 1 Context: Foundation + Catalogue + Traceability Core

## Decisions

### Product Data Source
- Scrape proventure.co.uk for product catalogue data (names, specs, categories, images, datasheets)
- Clean and restructure into Torke's data model
- Rebrand all product documentation with Torke identity

### Visual Design
- Match the existing brand mockups: red (#C41E3A-ish) / black / dark grey palette
- Torke logo with angular "T" monogram
- Professional, premium feel — competing with Hilti's polish
- Reference images: `Torke - Branding.jpeg`, `Torke - Packaging.jpeg`, `Torke - Concrete Calc.jpeg`

### Tech Stack (from research)
- Next.js 15 (App Router) + React 19 + TypeScript
- PostgreSQL 16 + Drizzle ORM
- Meilisearch for product search
- Better Auth for authentication
- Vercel for hosting, Railway for DB/search
- Cloudflare R2 for cert PDF and image storage

### Catalogue Structure
- Three top-level categories: Chemical Anchors, Mechanical Anchors, General Fixings
- Faceted filtering: type, diameter, material, load class, finish
- Each product has: name, SKU, description, technical specs, images, datasheet PDF, ETA reference

### Goods-In Workflow
- Operator records: supplier name, supplier batch number, product SKU, quantity
- Uploads 3.1 cert PDF (linked to supplier batch)
- System generates internal Torke batch ID (format: TRK-YYYYMMDD-NNNN)
- Auto-prints QR label with Torke batch ID
- Stock only becomes "available" after goods-in is complete

### QR URL Scheme
- Permanent URLs: proventure.co.uk/cert/{uuid} (or torke domain TBD)
- UUID-based, not batch numbers (opaque tokens for security)
- Must be locked before any label is printed — these URLs last 50-100 years

### Batch Data Model
- Products → Batches → Supplier Batches → Mill Certs (linked chain)
- Many-to-many: one order line can span multiple batches, one batch serves multiple orders
- FIFO allocation logic built into the model
- Support recall query: "Supplier batch X — which orders got it?"

## Deferred Ideas
- Account-based pricing (v2)
- Multi-user accounts with roles (v2)

---
*Created: 2026-03-04*
