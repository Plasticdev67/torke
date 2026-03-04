# Requirements

All v1 requirements are specific and testable. Each has a unique REQ-ID grouped by module.

**Status key:** Unchecked = not started | Checked = validated in production

---

## SHOP — E-Commerce Platform

### Product Catalogue & Search

- [ ] **SHOP-01**: User can browse products organised by category hierarchy (chemical anchors, mechanical anchors, general fixings)
- [ ] **SHOP-02**: User can filter products by faceted search: type, diameter, material, and load class
- [ ] **SHOP-03**: User can view a product detail page showing technical specifications, dimensioned drawings, and downloadable datasheet PDF
- [ ] **SHOP-04**: User can perform a text search across product names, codes, and descriptions with typo tolerance (Meilisearch)
- [ ] **SHOP-05**: Search results return in under 200ms with correct facet counts

### Ordering & Checkout

- [ ] **SHOP-06**: User can add products to a basket and proceed to checkout
- [ ] **SHOP-07**: User can enter a PO (purchase order) number at checkout
- [ ] **SHOP-08**: User can check out on credit terms (net 30 or net 60) against an approved credit account
- [ ] **SHOP-09**: User can pay by BACS bank transfer with order held until payment confirmed
- [ ] **SHOP-10**: User can pay by card via Stripe (with SCA compliance)
- [ ] **SHOP-11**: User can select from multiple saved delivery addresses per account
- [ ] **SHOP-12**: User receives an order confirmation email with order reference and line item summary

### Account & Order History

- [ ] **SHOP-13**: User can create an account and log in (email/password via Better Auth)
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

- [ ] **TRACE-01**: Warehouse operator can record supplier batch number against a purchase order line at goods-in
- [ ] **TRACE-02**: Warehouse operator can upload a 3.1 cert PDF and link it to the supplier batch at goods-in
- [ ] **TRACE-03**: System generates a unique internal Torke batch ID on goods-in and links it to the supplier batch, supplier name, date received, PO reference, and 3.1 cert
- [ ] **TRACE-04**: System auto-prints a label at goods-in with Torke batch ID and QR code
- [ ] **TRACE-05**: Stock does not become available for picking until goods-in is fully completed (batch ID assigned and cert uploaded)

### FIFO Batch Allocation

- [ ] **TRACE-06**: System allocates stock using FIFO — oldest qualifying batch is always picked first
- [ ] **TRACE-07**: Order confirmation shows the batch allocation per line item (customer knows which batch before dispatch)
- [ ] **TRACE-08**: System supports many-to-many between batches and order lines (one order line can span batches; one batch can fulfil multiple orders)

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

- [ ] **TRACE-18**: QR verification URLs use a permanent, versioned scheme (e.g. `/t/{token}`) that will resolve for the lifetime of the building (50+ years)
- [ ] **TRACE-19**: QR tokens are opaque UUIDs (not batch numbers) to prevent enumeration

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

- [ ] **WMS-01**: System maintains batch-tracked inventory with quantity per batch per product
- [ ] **WMS-02**: System enforces FIFO at allocation — pick lists always suggest the oldest qualifying batch
- [ ] **WMS-03**: System provides stock level dashboard showing quantities by product and batch
- [ ] **WMS-04**: System supports stock adjustments with reason codes (damage, returns, cycle count variance)
- [ ] **WMS-05**: System tracks expiry dates for chemical products (resins) and alerts when batches approach expiry

### Label Printing

- [ ] **WMS-06**: System auto-prints a goods-in label with Torke batch ID, product code, quantity, and QR code when goods-in is completed
- [ ] **WMS-07**: Label QR code links to the batch verification page (same URL scheme as TRACE-18)

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

*Last updated: 2026-03-04*
