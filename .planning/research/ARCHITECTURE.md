# Architecture Research

Research into how platforms like Torke are typically structured — drawing from B2B construction e-commerce (Hilti Online, Wurth, Fastenal), batch traceability / supply chain systems (steel mill cert chains, pharmaceutical track-and-trace), engineering calculation tools (Hilti PROFIS, Simpson Strong-Tie CFS), and WMS integration patterns.

---

## System Components

A system like Torke decomposes into **seven core domains**, each with distinct responsibilities:

### 1. Product Catalogue & Pricing Service
- Master product data: SKUs, specifications, technical datasheets, images, categorisation
- Account-based pricing engine (negotiated rates per customer, volume tiers, contract pricing)
- Product-to-certification mapping (which ETAs, which standards each product conforms to)
- Product configuration rules (e.g. M12 x 120mm in A4 stainless — valid combinations)

**How B2B platforms do this:** Unlike B2C e-commerce where pricing is public, B2B construction platforms (Hilti, Wurth, Fastenal) use a "request quote / see your price" model. The catalogue is public, but pricing requires authentication. Torke mirrors this with self-serve quotes on standard items and account manager handling for large/bespoke orders. The pricing engine typically sits as a separate service because pricing rules are complex (customer tier + quantity + contract + project-specific rates).

### 2. Order Management Service
- Quote creation, conversion to order, order lifecycle (placed → confirmed → allocated → picking → dispatched → delivered)
- Line-item level batch allocation (which batch fulfils which line)
- Integration with WMS for fulfilment
- Integration with cert service for dispatch pack generation

**How B2B platforms do this:** Order management in B2B construction is more complex than B2C because of the quote-to-order workflow, partial deliveries, call-off orders against framework contracts, and the need for line-item level metadata (batch numbers, cert references). Systems like SAP Business One or purpose-built order management services handle this. For Torke, this is custom because the batch allocation at order-line level is the differentiator.

### 3. Batch Traceability & Certification Service
- The core differentiator — this is the service that maintains the entire cert chain
- Manages: supplier batches, mill certs (EN 10204 3.1), Torke internal batch IDs, cert document storage
- Provides cert lookup by batch ID, order reference, or QR code token
- Generates digital cert packs (aggregated PDFs per order)

**How traceability systems work:** In steel/construction, EN 10204 3.1 certificates are issued by the manufacturer with third-party validation. The traceability chain is: raw material (mill cert) → manufacturer (3.1 cert with material properties, chemical composition, mechanical test results) → distributor (Torke) → end user. Pharmaceutical track-and-trace (EU FMD, US DSCSA) provides the closest architectural parallel — each unit has a unique identifier, and the system records every custody transfer. The key architectural pattern is an **append-only event log** per batch: received → stored at location → allocated to order → picked → dispatched → delivered. This creates an auditable chain.

### 4. Torke TRACE (Calculation Engine)
- Browser-based Eurocode-compliant anchor design calculations
- Computation engine for tension, shear, combined loading, edge/spacing effects
- 3D visualisation of anchor plate configurations
- Report generation (branded PDF)
- Product recommendation engine (calculation output → matching Torke product)

**How engineering calc tools work:** Hilti PROFIS, Simpson CFS, and Dewalt anchoring tools all follow a similar architecture: a **deterministic computation kernel** (no ML, pure engineering formulas from Eurocodes/ETAs) wrapped in a UI layer. The kernel takes structured input (loads, geometry, material, environment) and produces structured output (capacity values, utilisation ratios, pass/fail per failure mode). PROFIS runs client-side for responsiveness with server-side validation for report generation. The computation is stateless — given the same inputs, you always get the same outputs.

### 5. Warehouse Management Service (WMS)
- Goods-in with batch capture and cert linking
- Bin location management
- FIFO batch-tracked stock with quantity tracking per batch per location
- Pick list generation with batch allocation
- Pack and dispatch with label printing
- Barcode/QR scanning integration

**How WMS integrates:** WMS systems (Manhattan, Blue Yonder, or purpose-built) typically communicate with order management via an event-driven interface. Orders flow in, the WMS allocates stock (respecting FIFO and batch rules), generates pick lists, and emits events as items are picked, packed, and dispatched. The critical integration point for Torke is that the WMS must emit batch-level allocation events — "order line X was fulfilled from batch Y, picked from location Z" — which feed the traceability service.

### 6. Customer Portal & Authentication
- Customer accounts, authentication, role-based access
- Order history with cert access
- Project-based organisation (contractor groups orders by project/site)
- End-client verification portal (contractor's client can verify certs)

### 7. Content & Marketing Platform
- CMS for technical content, blog, installation guides
- SEO-optimised product pages
- CPD/training content delivery
- Email/CRM integration for lead nurture

---

## Data Flow

### Primary Data Flows

```
SUPPLIER SIDE                    TORKE OPERATIONS                     CUSTOMER SIDE
─────────────                    ────────────────                     ─────────────

Supplier ships goods     ──→     Goods-In Process
+ 3.1 cert docs                  ├─ Scan supplier batch barcode
                                 ├─ Upload/link 3.1 cert PDF
                                 ├─ Assign Torke batch ID
                                 ├─ Print Torke label (batch + QR)
                                 ├─ Put away to bin location
                                 └─ Stock record created
                                        │
                                        ▼
                                 Stock Available
                                 (batch-tracked, FIFO-ordered)
                                        │
                         ┌──────────────┼──────────────┐
                         │              │              │
                         ▼              ▼              ▼
                    Customer browses    Engineer uses    Account manager
                    catalogue + quotes  Torke TRACE     creates quote
                         │              │              │
                         │              ▼              │
                         │         Calculation done    │
                         │         → product match     │
                         │         → "Add to Quote"    │
                         │              │              │
                         └──────────────┼──────────────┘
                                        │
                                        ▼
                                 Order Placed
                                        │
                                        ▼
                                 Batch Allocation (FIFO)
                                 ├─ System selects oldest batch
                                 │  with sufficient qty
                                 ├─ Reserves qty from batch
                                 └─ Records allocation
                                        │
                                        ▼
                                 Pick List Generated
                                 ├─ Batch ID per line
                                 ├─ Bin location per line
                                 └─ Sent to WMS / scanner
                                        │
                                        ▼
                                 Pick → Pack → Dispatch
                                 ├─ Scanner confirms picks
                                 ├─ Packing slip with batch refs
                                 └─ Dispatch event emitted
                                        │
                                        ▼
                                 Cert Pack Generated              ──→  Customer receives
                                 ├─ Aggregates all 3.1 certs            ├─ Goods + packing slip
                                 │  for batches in this order            ├─ Digital cert pack (email)
                                 ├─ Generates cover sheet                └─ QR codes → cert lookup
                                 ├─ Assembles branded PDF
                                 └─ Emails to customer
                                                                          │
                                                                          ▼
                                                                   Customer Portal
                                                                   ├─ View order history
                                                                   ├─ Download cert packs
                                                                   ├─ Assign to project/site
                                                                   └─ Share with end-client
                                                                          │
                                                                          ▼
                                                                   End-Client Verification
                                                                   ├─ Scan QR on product
                                                                   ├─ View cert chain
                                                                   └─ Verify batch provenance
```

### Information Flow Summary

1. **Inbound:** Supplier cert docs → Torke batch record → stock
2. **Catalogue:** Product data + pricing → customer-facing catalogue
3. **Design:** Engineering inputs → calculation → product recommendation → quote
4. **Ordering:** Quote → order → batch allocation → pick/pack/dispatch
5. **Outbound:** Dispatch → cert pack generation → customer delivery → portal access
6. **Verification:** QR scan → cert lookup API → cert chain display

---

## Traceability Chain Architecture

The traceability chain is Torke's core IP. It must be **append-only, auditable, and tamper-evident**.

### Chain Structure

```
Mill Cert (Level 0)
│  Who: Steel mill (e.g. Acerinox, Outokumpu)
│  What: Chemical composition, mechanical properties of the heat/cast
│  Doc: EN 10204 3.1 certificate
│  ID: Heat number / cast number
│
└──→ Manufacturer Cert (Level 1)
     │  Who: Fastener manufacturer (Torke's vetted supplier)
     │  What: Product test results, dimensional checks, coating verification
     │  Doc: EN 10204 3.1 certificate referencing mill heat number
     │  ID: Manufacturer batch number
     │
     └──→ Torke Goods-In Record (Level 2)
          │  Who: Torke warehouse operative
          │  What: Receipt confirmation, visual inspection, qty verified
          │  Doc: Goods-in record with photos (optional)
          │  ID: Torke batch ID (auto-generated, e.g. TK-240301-001)
          │  Links: Supplier batch number → Mill heat number
          │
          └──→ Stock Location Record (Level 3)
               │  Who: WMS system
               │  What: Put-away location, current qty, FIFO position
               │  ID: Bin location code (e.g. A-03-02)
               │
               └──→ Order Allocation Record (Level 4)
                    │  Who: Order management system (FIFO allocation)
                    │  What: Qty allocated from this batch to this order line
                    │  ID: Order number + line number
                    │
                    └──→ Dispatch Record (Level 5)
                         │  Who: Warehouse operative (scanner confirmed)
                         │  What: Picked, packed, dispatched with tracking
                         │  ID: Dispatch reference / tracking number
                         │
                         └──→ Customer Cert Pack (Level 6)
                              │  Who: System (auto-generated)
                              │  What: Aggregated cert chain for all items in order
                              │  Doc: Branded PDF with all linked 3.1 certs
                              │
                              └──→ Verification Record (Level 7)
                                   Who: End-client / building control
                                   What: QR scan → full cert chain displayed
                                   Access: Public (by QR token) or authenticated
```

### Data Model for Traceability

The chain is modelled as a **directed graph of linked records**:

```
mill_certs
  id, heat_number, mill_name, document_url, chemical_composition (JSON),
  mechanical_properties (JSON), created_at

supplier_batches
  id, supplier_id, supplier_batch_number, mill_cert_id (FK),
  manufacturer_cert_url, product_sku, quantity_received,
  production_date, created_at

torke_batches
  id, torke_batch_id (e.g. "TK-240301-001"), supplier_batch_id (FK),
  goods_in_date, received_by, inspection_notes, quantity,
  status (active/quarantined/depleted), created_at

stock_locations
  id, torke_batch_id (FK), bin_location, quantity_available,
  quantity_reserved, created_at, updated_at

order_allocations
  id, order_id (FK), order_line_id (FK), torke_batch_id (FK),
  quantity_allocated, allocated_at, picked_at, dispatched_at

cert_packs
  id, order_id (FK), document_url, generated_at, emailed_at

verification_tokens
  id, token (UUID — used in QR code URL), torke_batch_id (FK),
  order_id (nullable FK), created_at, last_accessed_at
```

### Architectural Principles for Traceability

1. **Append-only records.** Once a goods-in record is created, it is never modified — only new events are added. This mirrors how pharmaceutical serialisation works (DSCSA/FMD).

2. **Every state change is an event.** Batch received, batch put away, batch allocated, batch picked, batch dispatched — each is a timestamped event with the actor recorded. This gives full audit trail.

3. **Cert documents are immutable.** 3.1 cert PDFs are stored in immutable object storage (e.g. S3 with versioning). The system stores references (URLs), not the documents inline. Documents are never overwritten.

4. **QR tokens are opaque.** The QR code contains a URL like `verify.torke.co.uk/c/a8f3e2b1` — the token is a random UUID, not the batch number. This prevents enumeration and gives Torke control over what is displayed.

5. **No blockchain needed.** The trust model here is centralised — Torke is the trusted intermediary. A well-designed relational database with append-only event tables and immutable document storage provides the same guarantees without the complexity. Blockchain adds no value when there is a single trusted authority.

---

## Torke TRACE Integration

### How Engineering Calculation Tools Are Architected

Tools like Hilti PROFIS, Simpson CFS, and Rawlplug RAWL-CALC follow a common pattern:

**Computation Kernel:**
- Pure functions implementing Eurocode formulas (EN 1992-4 for post-installed anchors)
- Input: structured data (loads, geometry, material properties, safety factors)
- Output: structured results (capacity per failure mode, utilisation ratios, pass/fail)
- Deterministic — same inputs always produce same outputs
- No database access, no side effects — purely computational

**Failure Modes Calculated (for post-installed anchors in concrete):**
- Steel failure (tension and shear)
- Concrete cone failure (tension)
- Pull-out failure (tension)
- Concrete splitting (tension)
- Concrete edge failure (shear)
- Concrete pryout (shear)
- Combined tension + shear interaction

**UI Layer:**
- Input forms with engineering-appropriate validation
- 3D visualisation (typically WebGL / Three.js for browser-based tools)
- Results display with colour-coded pass/fail per failure mode
- Report generation (PDF with all inputs, outputs, code references)

### Torke TRACE Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser Client                    │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Input Forms  │  │ 3D Viewer    │  │ Results    │ │
│  │ (React)      │  │ (Three.js)   │  │ Panel      │ │
│  └──────┬───────┘  └──────────────┘  └─────┬──────┘ │
│         │                                   │        │
│  ┌──────▼───────────────────────────────────▼──────┐ │
│  │          Calculation Engine (TypeScript)         │ │
│  │   Runs client-side for instant feedback         │ │
│  │   Eurocode formulas as pure functions            │ │
│  └──────┬──────────────────────────────────────────┘ │
│         │                                            │
└─────────┼────────────────────────────────────────────┘
          │
          │  (on "Generate Report" or "Find Product")
          ▼
┌─────────────────────────────────────────────────────┐
│                    Server API                        │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Calculation   │  │ Product      │  │ Report     │ │
│  │ Validation    │  │ Matcher      │  │ Generator  │ │
│  │ (re-run on    │  │ (calc output │  │ (PDF with  │ │
│  │  server for   │  │  → matching  │  │  branding) │ │
│  │  report       │  │  Torke SKU)  │  │            │ │
│  │  integrity)   │  │              │  │            │ │
│  └──────────────┘  └──────┬───────┘  └────────────┘ │
│                           │                          │
└───────────────────────────┼──────────────────────────┘
                            │
                            ▼
                    Product Catalogue
                    (matched product → "Add to Quote")
```

### Design-to-Order Flow

1. Engineer enters design parameters (loads, concrete, geometry, environment)
2. Calculation engine runs client-side — instant results, no round-trip
3. Results show capacity checks per failure mode with utilisation ratios
4. System identifies matching Torke products (based on anchor type, diameter, embedment, material)
5. "Add to Quote" button appears next to matching products with the calculation reference
6. Quote carries the calculation reference — contractor can show their client that the specified product matches the engineering design
7. Calculation can be saved to user's account (requires login) for future reference
8. PDF report includes: project info, all inputs/outputs, code clause references, Torke branding, matching product recommendation

### Product Matching Logic

The product matcher maps calculation outputs to catalogue SKUs:

```
Calculation outputs:
  - Required anchor type (mechanical / chemical)
  - Required diameter (M8, M10, M12, M16, M20, M24)
  - Required embedment depth (mm)
  - Required material grade (carbon steel, A2, A4 stainless)
  - Required ETA (which approval the product needs)

Catalogue query:
  - Filter by: type, diameter, min embedment, material, valid ETA
  - Sort by: price (default), utilisation ratio (best fit)
  - Return: matching SKUs with current availability and price
```

---

## WMS Integration

### How WMS Integrates with E-Commerce Order Flow

The WMS is an operational system that bridges digital orders and physical warehouse actions. The integration pattern used by systems like Manhattan Associates, Peoplevox, and Mintsoft follows an **event-driven, loosely-coupled** model:

### Integration Architecture

```
Order Management                WMS                        Traceability
Service                         Service                    Service
─────────────                   ───────                    ──────────

Order confirmed ──────────→  Order received
                             │
                             ▼
                          Batch allocation
                          (FIFO algorithm)
                             │
                             ├──→ Allocation event ──────→ Record batch→order link
                             │
                             ▼
                          Pick list generated
                          (batch + bin location per line)
                             │
                             ▼
                          Operative picks
                          (scanner confirms each pick)
                             │
                             ├──→ Pick confirmed event ──→ Record pick timestamp
                             │
                             ▼
                          Pack + generate labels
                          (packing slip with batch refs)
                             │
                             ▼
                          Dispatch
                          (carrier integration)
                             │
                             ├──→ Dispatch event ────────→ Trigger cert pack
                             │                             generation + email
                             ▼
                          Tracking number ──────────→ Order updated with tracking
```

### Key WMS Design Decisions for Torke

**1. FIFO Batch Allocation Algorithm:**
```
Given: Order line for SKU X, quantity 50

1. Query stock: all torke_batches for SKU X where quantity_available > 0
2. Order by goods_in_date ASC (FIFO)
3. Allocate from oldest batch first
4. If oldest batch has qty 30, allocate 30 from batch A, 20 from batch B
5. A single order line can span multiple batches (split allocation)
6. Record each allocation as a separate order_allocation record
```

**2. Goods-In Workflow (the critical entry point for traceability):**
```
1. Delivery arrives with supplier paperwork
2. Operative scans supplier barcode (or enters supplier batch number)
3. System looks up expected deliveries (PO matching)
4. Operative uploads or links 3.1 cert documents (photo/scan/PDF)
5. System generates Torke batch ID (auto-increment per day: TK-YYMMDD-NNN)
6. System prints Torke label: batch ID + QR code + product description
7. Operative applies label to stock
8. Operative scans bin location for put-away
9. Stock record created: batch → location → quantity
```

**3. Scanner Integration:**
- Barcode scanners (Zebra TC series or similar) running a web-based scanning app
- The WMS UI is a progressive web app optimised for scanner devices
- Each scan event (goods-in, put-away, pick, pack, dispatch) is recorded with timestamp and operative ID
- No native app needed — browser-based PWA works on Android-based scanners

**4. Dual Dispatch Modes:**
- **Small parcel:** Courier integration (Royal Mail, DPD, DHL) — carrier API for label generation and tracking
- **Pallet/bulk:** Freight carrier integration — booking system for pallet collection, POD tracking
- Both modes trigger the same cert pack generation on dispatch

---

## API Design

### Public API: Cert Verification (QR Code Scan)

This is the outward-facing API that makes the traceability chain accessible.

```
GET /api/v1/verify/{token}

Response (200):
{
  "product": {
    "name": "Torke M12 x 120mm Chemical Anchor Stud — A4 Stainless",
    "sku": "TK-CA-M12-120-A4",
    "eta": "ETA-20/0987",
    "standard": "EN 1992-4"
  },
  "torke_batch": {
    "id": "TK-240301-001",
    "goods_in_date": "2024-03-01",
    "quantity_in_batch": 500
  },
  "supplier": {
    "name": "Vetted Supplier Ltd",        // may be anonymised
    "batch_number": "SUP-2024-0142",
    "production_date": "2024-02-15"
  },
  "certifications": [
    {
      "type": "EN 10204 3.1 — Manufacturer Certificate",
      "issuer": "Vetted Supplier Ltd",
      "document_url": "/api/v1/certs/doc/abc123.pdf",
      "covers": "Mechanical properties, dimensional inspection, coating"
    },
    {
      "type": "EN 10204 3.1 — Mill Certificate",
      "issuer": "Acerinox S.A.",
      "document_url": "/api/v1/certs/doc/def456.pdf",
      "covers": "Chemical composition, heat treatment, mechanical tests"
    }
  ],
  "chain_summary": "This product was manufactured by a Torke-vetted supplier using steel from heat 284719 (Acerinox S.A., Spain). It was received by Torke on 2024-03-01, inspected, and assigned batch TK-240301-001. Full EN 10204 3.1 certification is available for every stage of the supply chain."
}
```

**Design notes:**
- The token is a UUID, not sequential — prevents enumeration
- Supplier name may be shown or anonymised depending on commercial sensitivity
- Cert document URLs are signed/time-limited to prevent hotlinking
- No authentication required for basic verification (the QR code IS the access token)
- Rate-limited to prevent scraping

### Internal APIs

**Order Service → WMS:**
```
POST /internal/wms/orders
{
  "order_id": "ORD-2024-00142",
  "lines": [
    { "line_id": 1, "sku": "TK-CA-M12-120-A4", "quantity": 50 },
    { "line_id": 2, "sku": "TK-MA-M10-80-ZP", "quantity": 200 }
  ],
  "dispatch_type": "parcel",  // or "pallet"
  "shipping_address": { ... }
}
```

**WMS → Traceability (event):**
```
POST /internal/traceability/events
{
  "event_type": "batch_allocated",  // or "picked", "dispatched"
  "order_id": "ORD-2024-00142",
  "order_line_id": 1,
  "torke_batch_id": "TK-240301-001",
  "quantity": 50,
  "bin_location": "A-03-02",
  "operative_id": "WH-007",
  "timestamp": "2024-03-15T14:32:00Z"
}
```

**Torke TRACE → Product Catalogue:**
```
POST /api/v1/products/match
{
  "anchor_type": "chemical",
  "diameter": "M12",
  "min_embedment_mm": 110,
  "material": "A4",
  "required_tension_kn": 25.4,
  "required_shear_kn": 12.8,
  "calculation_id": "calc-uuid-here"
}

Response:
{
  "matches": [
    {
      "sku": "TK-CA-M12-120-A4",
      "name": "Torke M12 x 120mm Chemical Anchor Stud — A4 Stainless",
      "embedment_mm": 120,
      "tension_capacity_kn": 32.1,
      "shear_capacity_kn": 18.7,
      "utilisation_tension": 0.79,
      "utilisation_shear": 0.68,
      "price": null,  // requires authentication
      "in_stock": true,
      "add_to_quote_url": "/quote/add?sku=TK-CA-M12-120-A4&calc=calc-uuid-here"
    }
  ]
}
```

---

## Component Boundaries

### What Talks to What

```
┌──────────────────────────────────────────────────────────────────────┐
│                         PUBLIC INTERNET                              │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ Storefront   │  │ Torke       │  │ Customer    │  │ Cert       │ │
│  │ (browse,     │  │ Design      │  │ Portal      │  │ Verify     │ │
│  │  quote,      │  │ (calc tool) │  │ (orders,    │  │ (QR scan   │ │
│  │  order)      │  │             │  │  certs)     │  │  landing)  │ │
│  └──────┬───────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                 │                │               │         │
└─────────┼─────────────────┼────────────────┼───────────────┼─────────┘
          │                 │                │               │
          ▼                 ▼                ▼               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                                 │
│         (authentication, rate limiting, routing)                     │
└──────┬────────────┬────────────┬────────────┬───────────┬────────────┘
       │            │            │            │           │
       ▼            ▼            ▼            ▼           ▼
┌───────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐
│ Product   │ │ Order    │ │ Trace-   │ │ WMS     │ │ Auth /   │
│ Catalogue │ │ Mgmt     │ │ ability  │ │ Service │ │ Account  │
│ + Pricing │ │ Service  │ │ + Certs  │ │         │ │ Service  │
└─────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ └──────────┘
      │            │            │            │
      └────────────┴────────────┴────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │   PostgreSQL DB   │
              │   (single DB,     │
              │   schema-per-     │
              │   domain)         │
              └────────┬─────────┘
                       │
              ┌────────▼─────────┐
              │  Object Storage   │
              │  (cert PDFs,      │
              │   reports, images)│
              └──────────────────┘
```

### Boundary Rules

| From | To | Communication | Why |
|------|----|---------------|-----|
| Storefront | Product Catalogue | Sync REST/GraphQL | Browsing needs instant response |
| Storefront | Order Mgmt | Sync REST | Quote/order operations need confirmation |
| Order Mgmt | WMS | Async event (queue) | Decouples order placement from fulfilment |
| WMS | Traceability | Async event (queue) | Traceability events are fire-and-forget from WMS perspective |
| WMS | Order Mgmt | Async event (queue) | Status updates (allocated, picked, dispatched) |
| Traceability | Object Storage | Sync | Cert document retrieval |
| Torke TRACE | Product Catalogue | Sync REST | Product matching needs instant response |
| Cert Verify | Traceability | Sync REST | QR scan lookup needs instant response |
| Dispatch event | Cert Pack Generator | Async event | PDF generation can be slightly delayed |

### Monolith-First Strategy

**Critical for a bootstrapped pre-seed startup:** Do NOT start with microservices.

The component boundaries above are **logical boundaries within a single deployable application** (a modular monolith). The domains are separated by module/package structure, not by network calls. This gives:
- Simpler deployment (one thing to run)
- No distributed systems complexity (no service mesh, no distributed tracing needed)
- Transactional consistency (batch allocation + order update in one DB transaction)
- Easier debugging

The async events (order → WMS, WMS → traceability) can be implemented as **in-process event bus** (e.g. simple pub/sub within the app) rather than external message queues. Extract to separate services only when there is a clear operational reason (e.g. WMS needs independent scaling, or the calc engine needs GPU resources).

**Recommended structure:**
```
torke/
  src/
    catalogue/        # Product data, pricing, search
    orders/           # Quotes, orders, order lifecycle
    traceability/     # Batches, certs, verification, cert pack generation
    wms/              # Goods-in, stock, picking, packing, dispatch
    design/           # Calculation engine, product matching, reports
    accounts/         # Auth, customer accounts, roles
    content/          # CMS, blog, guides
    common/           # Shared utilities, event bus, PDF generation
```

---

## Suggested Build Order

The build order is driven by **dependency chains** and **value delivery**. Each phase should produce something demonstrable.

### Phase 1: Foundation + Catalogue (Weeks 1-4)
**Build:**
- Database schema (core tables: products, customers, batches, orders)
- Authentication / account system
- Product catalogue with search and filtering
- Basic storefront UI (browse products, view specs)

**Why first:** Everything depends on the product catalogue and auth. You cannot demo anything without products to show.

**Deliverable:** A browsable product catalogue with customer login.

### Phase 2: Traceability Core + Goods-In (Weeks 5-8)
**Build:**
- Batch data model (mill certs → supplier batches → Torke batches)
- Goods-in workflow (scan, assign batch, upload cert, print label)
- Cert document storage
- QR code generation for batches
- Basic stock tracking (batch + location + quantity)

**Why second:** This is the core differentiator. Without traceability, Torke is just another fixings website. The goods-in workflow is the entry point for all traceability data.

**Deliverable:** Warehouse operative can receive goods, assign batches, upload certs, and print labels. Stock levels are visible.

### Phase 3: Order Flow + Batch Allocation (Weeks 9-12)
**Build:**
- Quote creation and management
- Order placement (convert quote to order)
- FIFO batch allocation algorithm
- Pick list generation with batch + bin location
- Order status tracking

**Why third:** Orders depend on having stock (Phase 2) and products (Phase 1). Batch allocation is the bridge between traceability and order fulfilment.

**Deliverable:** Customer can create a quote, convert to order. System allocates batches via FIFO and generates pick lists.

### Phase 4: WMS Operations (Weeks 13-16)
**Build:**
- Scanner-based picking workflow (confirm picks via barcode scan)
- Pack workflow (packing slip generation with batch refs)
- Dispatch workflow (carrier integration, tracking number capture)
- Dispatch event triggers cert pack generation

**Why fourth:** WMS operations depend on the pick lists from Phase 3. This phase completes the physical fulfilment chain.

**Deliverable:** Full warehouse workflow: goods-in → stock → order → pick → pack → dispatch.

### Phase 5: Cert Pack + Verification (Weeks 17-20)
**Build:**
- Cert pack PDF generator (aggregates all 3.1 certs for an order)
- Automated email on dispatch with cert pack attached
- QR code verification API (public endpoint)
- Verification landing page (scan QR → see cert chain)
- Customer portal: order history with cert access

**Why fifth:** Cert packs depend on dispatch events (Phase 4) and cert storage (Phase 2). This phase delivers the customer-facing traceability promise.

**Deliverable:** Customer receives cert pack on dispatch. QR codes on products link to full cert chain. Customer portal shows order history with certs.

### Phase 6: Torke TRACE MVP (Weeks 21-28)
**Build:**
- Calculation engine (Eurocode EN 1992-4 formulas for post-installed anchors)
- Input UI (loads, geometry, concrete, environment)
- Results display (pass/fail per failure mode, utilisation ratios)
- Product matching (calculation output → Torke SKU)
- Basic 3D visualisation
- PDF report generation
- "Add to Quote" integration with order flow

**Why sixth:** Torke TRACE is a powerful differentiator but it is not on the critical path for selling fixings. The e-commerce + traceability platform can operate and generate revenue without the calc tool. Building the calc tool after the commerce platform means the "Add to Quote" integration has a real target to connect to.

**Deliverable:** Engineer can design an anchor, see matching Torke products, and add to a quote — all in the browser.

### Phase 7: Polish + Scale (Weeks 29+)
**Build:**
- End-client verification portal (contractor's client can verify)
- Content/CMS for blog, guides, CPD
- Email/CRM automation
- Advanced pricing (contract rates, project pricing)
- Reporting and analytics
- Performance optimisation
- Physical QR labels on product packaging (matching brand mockups)

---

## Data Model Considerations

### Database Choice

**PostgreSQL** is the right choice for this system:
- Strong relational integrity for the cert chain (foreign keys enforce the traceability links)
- JSONB columns for semi-structured data (cert metadata, calculation inputs/outputs)
- Full-text search for product catalogue (or layer Meilisearch/Typesense for faceted search)
- Row-level security can support multi-tenant patterns if needed later
- Mature, battle-tested, free

### Key Schema Design Decisions

**1. Batch-to-order is many-to-many.**
A single order line can be fulfilled from multiple batches (when the oldest batch doesn't have enough). A single batch can fulfil multiple order lines. The `order_allocations` table is the join table.

**2. Cert documents are stored by reference, not inline.**
The database stores metadata and a URL/key to the document in object storage. This keeps the database lean and allows cert PDFs to be served directly from a CDN.

**3. Product technical data needs a flexible schema.**
Chemical anchors have different technical properties (cure time, temperature range, resin type) than mechanical anchors (expansion type, torque value, drill diameter). Use a combination of:
- Fixed columns for universal properties (diameter, length, material, ETA reference)
- JSONB column for type-specific technical data
- A `product_type` discriminator

**4. Pricing is separated from product data.**
Price lists are per-customer (or per-customer-group) and change over time. The pricing model should be:
```
price_lists
  id, customer_id (nullable — null = default), valid_from, valid_to

price_list_items
  id, price_list_id (FK), sku, unit_price, min_quantity, currency
```
This allows overlapping price lists (default + customer-specific), quantity breaks, and time-bound pricing.

**5. Calculation results are immutable snapshots.**
When a Torke TRACE calculation is saved, it stores a complete snapshot of all inputs and outputs — not references to live product data. This ensures that a calculation report remains valid even if product data changes later. Stored as a JSONB document:
```
calculations
  id, user_id (nullable), project_name, created_at,
  inputs (JSONB), outputs (JSONB), matched_products (JSONB array),
  report_url (nullable — generated PDF)
```

**6. Event log for audit trail.**
An append-only `events` table records every significant action:
```
events
  id, event_type, entity_type, entity_id, actor_id, actor_type,
  payload (JSONB), created_at
```
This serves both operational needs (debugging, support) and compliance needs (auditing the traceability chain).

**7. Multi-tenancy is NOT needed at launch.**
Torke is a single brand, single warehouse operation. Do not over-engineer for multi-tenancy. If Torke acquires a supplier, the acquired business operates under the Torke brand and platform — it is not a separate tenant.

### Estimated Data Volumes (Year 1)

| Entity | Estimated Volume | Growth Pattern |
|--------|-----------------|----------------|
| Products (SKUs) | 500-2,000 | Slow (catalogue expansion) |
| Customers | 100-500 | Steady |
| Orders | 2,000-10,000 | Accelerating |
| Torke Batches | 1,000-5,000 | Proportional to goods-in |
| Cert Documents | 2,000-10,000 | Proportional to batches |
| Order Allocations | 5,000-25,000 | Proportional to orders |
| Calculations (Design) | 5,000-50,000 | Can grow independently |
| Events | 50,000-200,000 | Proportional to all activity |

These volumes are trivially small for PostgreSQL. No sharding, partitioning, or exotic databases needed. A single well-indexed PostgreSQL instance handles this easily for the first several years.

---

*Researched 2026-03-04. Based on architectural patterns from B2B construction e-commerce (Hilti, Wurth, Fastenal), pharmaceutical serialisation (EU FMD, DSCSA), engineering calculation platforms (PROFIS, CFS), and WMS integration patterns (Manhattan, Peoplevox).*
