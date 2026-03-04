# Requirements

All v1 requirements are specific and testable. Each has a unique REQ-ID grouped by module.

**Status key:** Unchecked = not started | Checked = validated in production

---

## SHOP — E-Commerce Platform

### Product Catalogue & Search

- [x] **SHOP-01**: User can browse products organised by category hierarchy (chemical anchors, mechanical anchors, general fixings)
- [x] **SHOP-02**: User can filter products by faceted search: type, diameter, material, and load class
- [x] **SHOP-03**: User can view a product detail page showing technical specifications, dimensioned drawings, and downloadable datasheet PDF
- [x] **SHOP-04**: User can perform a text search across product names, codes, and descriptions with typo tolerance (Meilisearch)
- [x] **SHOP-05**: Search results return in under 200ms with correct facet counts

### Ordering & Checkout

- [ ] **SHOP-06**: User can add products to a basket and proceed to checkout
- [ ] **SHOP-07**: User can enter a PO (purchase order) number at checkout
- [ ] **SHOP-08**: User can check out on credit terms (net 30 or net 60) against an approved credit account
- [ ] **SHOP-09**: User can pay by BACS bank transfer with order held until payment confirmed
- [ ] **SHOP-10**: User can pay by card via Stripe (with SCA compliance)
- [ ] **SHOP-11**: User can select from multiple saved delivery addresses per account
- [ ] **SHOP-12**: User receives an order confirmation email with order reference and line item summary

### Account & Order History

- [x] **SHOP-13**: User can create an account and log in (email/password via Better Auth)
- [ ] **SHOP-14**: User can view order history with status, tracking, and batch/cert references per line item
- [ ] **SHOP-15**: User can re-order a previous order with one click
- [ ] **SHOP-16**: User can download invoices as PDF from their account portal

### v2 Deferred (not in scope for v1)

- Account-based pricing with negotiated rates per customer
- Multi-user accounts with role-based permissions (buyer, estimator, approver)
- Approval workflows for orders above a threshold
- Project hub (grouping orders, certs, and calcs under named projects)

---

## TRACE — Batch Traceability & Certification

### Goods-In Capture

- [x] **TRACE-01**: Warehouse operator can record supplier batch number against a purchase order line at goods-in
- [x] **TRACE-02**: Warehouse operator can upload a 3.1 cert PDF and link it to the supplier batch at goods-in
- [x] **TRACE-03**: System generates a unique internal Torke batch ID on goods-in and links it to the supplier batch, supplier name, date received, PO reference, and 3.1 cert
- [x] **TRACE-04**: System auto-prints a label at goods-in with Torke batch ID and QR code
- [x] **TRACE-05**: Stock does not become available for picking until goods-in is fully completed (batch ID assigned and cert uploaded)

### FIFO Batch Allocation

- [x] **TRACE-06**: System allocates stock using FIFO — oldest qualifying batch is always picked first
- [ ] **TRACE-07**: Order confirmation shows the batch allocation per line item (customer knows which batch before dispatch)
- [x] **TRACE-08**: System supports many-to-many between batches and order lines (one order line can span batches; one batch can fulfil multiple orders)

### Digital Cert Pack

- [ ] **TRACE-09**: System auto-generates a cert pack PDF on dispatch containing all 3.1 certs for every line item in the order
- [ ] **TRACE-10**: Cert pack is emailed to the customer with the dispatch notification
- [ ] **TRACE-11**: Cert pack PDF includes: Torke batch ID, supplier batch ID, manufacturer name, heat number, chemical composition, and mechanical properties per EN 10204 3.1

### Customer Cert Portal

- [ ] **TRACE-12**: Contractor can search their certs by order number, Torke batch ID, product code, or date range
- [ ] **TRACE-13**: Contractor can download individual cert PDFs or a bundled cert pack per order
- [ ] **TRACE-14**: Order history page shows batch allocation per line item with linked cert downloads

### End-Client Verification Portal

- [ ] **TRACE-15**: Contractor can generate a unique read-only verification link for their end-client (building owner, structural engineer, building control)
- [ ] **TRACE-16**: End-client can view project name, list of fixings supplied, batch numbers, and linked 3.1 certs via the verification link without logging in
- [ ] **TRACE-17**: QR code on physical product label resolves to a public verification page showing product details, batch ID, 3.1 cert, and goods-in date

### Permanent URL Scheme

- [x] **TRACE-18**: QR verification URLs use a permanent, versioned scheme (e.g. `/t/{token}`) that will resolve for the lifetime of the building (50+ years)
- [x] **TRACE-19**: QR tokens are opaque UUIDs (not batch numbers) to prevent enumeration

---

## DESIGN — Torke Design (Calculation Software)

### Calculation Engine

- [ ] **DESIGN-01**: User can design a post-installed anchor connection to EN 1992-4
- [ ] **DESIGN-02**: User can input: anchor type, concrete class (C20/25 to C50/60), cracked or uncracked concrete, tension load, shear load, edge distances, spacing, embedment depth, and corrosion environment
- [ ] **DESIGN-03**: System checks all required failure modes: steel failure (tension and shear), concrete cone breakout, pull-out, concrete pryout, concrete edge breakout, splitting, and combined tension-shear interaction
- [ ] **DESIGN-04**: System displays utilisation ratio (0-100%) for each failure mode with pass/fail indication
- [ ] **DESIGN-05**: System supports both single anchors and anchor groups (2, 4, 6+ patterns)
- [ ] **DESIGN-06**: Calculation engine runs client-side for instant feedback (sub-second parameter updates) and re-runs server-side for report generation to validate integrity
- [ ] **DESIGN-07**: Any scope limitation (e.g. no seismic, no fire) is clearly stated on every calculation output and report

### 3D Visualisation

- [ ] **DESIGN-08**: User can see a 3D interactive WebGL visualisation of the anchor plate and bolt group (React Three Fiber)
- [ ] **DESIGN-09**: 3D model updates in real time as the user changes input parameters (diameter, spacing, edge distance, plate size)
- [ ] **DESIGN-10**: User can rotate, zoom, and pan the 3D model

### PDF Reports

- [ ] **DESIGN-11**: User can export a PDF calculation report with Torke branding and project info
- [ ] **DESIGN-12**: PDF report includes all inputs, all failure mode results with utilisation ratios, and inline Eurocode clause references (e.g. "EN 1992-4 Clause 7.2.1.4")
- [ ] **DESIGN-13**: PDF report includes a summary pass/fail status and governing failure mode

### Design-to-Order Pipeline

- [ ] **DESIGN-14**: Calculation output recommends matching Torke products based on the specified anchor type and size
- [ ] **DESIGN-15**: User can add the recommended Torke product to their basket or quote directly from the calculation result
- [ ] **DESIGN-16**: Calculation reference number is linked to the resulting order so the cert pack references the original engineering justification

### Access & Accounts

- [ ] **DESIGN-17**: User can perform calculations without logging in (free, no login required)
- [ ] **DESIGN-18**: User must create a free account to save calculations or export PDF reports
- [ ] **DESIGN-19**: Torke Design uses the same product database as the e-commerce catalogue (single source of truth)

### v2 Deferred (not in scope for v1)

- Collaborative design (shareable links, revision history, comments)
- Multi-product comparison (side-by-side utilisation comparison)
- Template library (pre-built common connections)
- BIM/CAD export (DWG, RFA)

---

## WMS — Warehouse Management System (Lean)

### Batch-Tracked Stock Management

- [x] **WMS-01**: System maintains batch-tracked inventory with quantity per batch per product
- [ ] **WMS-02**: System enforces FIFO at allocation — pick lists always suggest the oldest qualifying batch
- [ ] **WMS-03**: System provides stock level dashboard showing quantities by product and batch
- [ ] **WMS-04**: System supports stock adjustments with reason codes (damage, returns, cycle count variance)
- [x] **WMS-05**: System tracks expiry dates for chemical products (resins) and alerts when batches approach expiry

### Label Printing

- [x] **WMS-06**: System auto-prints a goods-in label with Torke batch ID, product code, quantity, and QR code when goods-in is completed
- [x] **WMS-07**: Label QR code links to the batch verification page (same URL scheme as TRACE-18)

### Pick Lists & Dispatch

- [ ] **WMS-08**: System generates pick lists from confirmed orders with batch allocation pre-assigned (FIFO)
- [ ] **WMS-09**: System supports both small parcel (courier) and pallet (bulk project) dispatch workflows
- [ ] **WMS-10**: Dispatch event triggers cert pack generation (links to TRACE-09)

### v2 Deferred (not in scope for v1)

- Barcode/QR scanning workflow for goods-in, pick, pack, and dispatch (browser-based PWA)
- Bin location management (named locations, put-away instructions)
- Wave picking (group multiple orders into a single pick round)
- Offline-capable scanning (queue scans locally, sync on reconnect)
- Photo capture at goods-in and dispatch

---

## MKTG — Marketing & Lead Generation

### Content & SEO

- [ ] **MKTG-01**: Platform includes a CMS-driven technical blog with SEO-optimised articles (installation guides, Eurocode explainers, specification guidance)
- [ ] **MKTG-02**: Product pages include structured data (schema markup) for Google rich results
- [ ] **MKTG-03**: Platform includes a resource library with downloadable technical datasheets, ETAs, and DoPs per product
- [ ] **MKTG-04**: Platform includes a technical glossary section targeting informational search queries

### Torke Design as Lead Gen

- [ ] **MKTG-05**: Torke Design is accessible without login to maximise organic traffic from engineers searching for anchor design tools
- [ ] **MKTG-06**: Saving or exporting a calculation requires free account creation, capturing the lead (email, name, company)
- [ ] **MKTG-07**: Account creation from Torke Design feeds into the e-commerce account system (single account across design and shop)

### Document Rebranding

- [ ] **MKTG-08**: All existing Proventure product datasheets, technical docs, installation guides, and ETA reference documents are rebranded with Torke identity (logo, colours, typography, contact details)
- [ ] **MKTG-09**: Rebranded documents are available as downloadable PDFs on the product detail pages
- [ ] **MKTG-10**: Document templates exist for future products to be added with consistent Torke branding

### v2 Deferred (not in scope for v1)

- Email/CRM automation (welcome sequences, reorder reminders, abandoned quote follow-up)
- CPD/accredited training platform (CIBSE/IStructE accredited seminars)
- Loyalty/tiered programme
- Specification support service

---

## Out of Scope (all versions)

- Own manufacturing (Torke is a brand and platform, not a manufacturer)
- Channel systems / strut (not in initial product range)
- Desktop application for Torke Design (web-first only)
- Full warehouse automation (AutoStore, robotic picking)
- Fire/seismic calculation modules
- Supply chain management system (Torke manages from goods-in onward)
- Native mobile apps (responsive web is sufficient)
- AI chatbot
- Marketplace / third-party sellers

---

---

## Requirement-to-Phase Traceability

Every v1 requirement is mapped to exactly one roadmap phase.

| Phase | REQ-IDs |
|-------|---------|
| **Phase 1:** Foundation + Catalogue + Traceability Core | SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05, SHOP-13, TRACE-01, TRACE-02, TRACE-03, TRACE-04, TRACE-05, TRACE-06, TRACE-08, TRACE-18, TRACE-19, WMS-01, WMS-05, WMS-06, WMS-07 |
| **Phase 2:** E-Commerce + Order Flow + WMS | SHOP-06, SHOP-07, SHOP-08, SHOP-09, SHOP-10, SHOP-11, SHOP-12, SHOP-14, SHOP-15, SHOP-16, TRACE-07, TRACE-09, TRACE-10, TRACE-11, WMS-02, WMS-03, WMS-04, WMS-08, WMS-09, WMS-10 |
| **Phase 3:** Torke Design | DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05, DESIGN-06, DESIGN-07, DESIGN-08, DESIGN-09, DESIGN-10, DESIGN-11, DESIGN-12, DESIGN-13, DESIGN-14, DESIGN-15, DESIGN-16, DESIGN-17, DESIGN-18, DESIGN-19 |
| **Phase 4:** Portals + Marketing + Polish | TRACE-12, TRACE-13, TRACE-14, TRACE-15, TRACE-16, TRACE-17, MKTG-01, MKTG-02, MKTG-03, MKTG-04, MKTG-05, MKTG-06, MKTG-07 |

**Totals:** Phase 1 = 19 reqs | Phase 2 = 20 reqs | Phase 3 = 19 reqs | Phase 4 = 13 reqs | **v1 total = 71 requirements**

---

*Last updated: 2026-03-04*
