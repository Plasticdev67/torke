# Roadmap

Coarse-grained roadmap: 4 phases, dependency-ordered. Each phase delivers observable value and can be demonstrated to users.

---

## Phase 1: Foundation + Catalogue + Traceability Core ✅ COMPLETE (2026-03-04)

**Goal:** Establish the data model, product catalogue, and goods-in workflow. The batch data model is the foundation everything else depends on — get it right before building on top.

**Status:** All 19 requirements delivered across 4 plans (scaffold, scraping, catalogue UI, goods-in/traceability). Verified 2026-03-04.

**Requirements:**
- SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05 (catalogue and search)
- SHOP-13 (account creation and login)
- TRACE-01, TRACE-02, TRACE-03, TRACE-04, TRACE-05 (goods-in capture)
- TRACE-06, TRACE-08 (FIFO allocation logic and many-to-many batch model)
- TRACE-18, TRACE-19 (permanent QR URL scheme — must be locked before any label is printed)
- WMS-01, WMS-05, WMS-06, WMS-07 (batch-tracked inventory, expiry tracking, label printing)

**Success Criteria:**
1. A user can browse the product catalogue, filter by type/diameter/material/load class, and view product detail pages with technical specs
2. A warehouse operator can complete a goods-in workflow: record supplier batch, upload 3.1 cert, receive a Torke batch ID, and print a QR label
3. Stock that has not completed goods-in does not appear as available inventory
4. The batch data model correctly supports the recall query: "Supplier batch X has a quality issue — which orders received it?"

**Dependencies:** None (this is the foundation)

---

## Phase 2: E-Commerce + Order Flow + WMS

**Goal:** Enable customers to buy products and Torke to fulfil orders with full batch traceability through the order lifecycle.

**Plans:** 9/9 plans complete

Plans:
- [x] 02-00-PLAN.md — Wave 0: vitest test infrastructure and test stubs
- [x] 02-01-PLAN.md — Schema, cart store, order service foundation, and product pricing
- [x] 02-02-PLAN.md — Stock dashboard and stock adjustments
- [x] 02-03-PLAN.md — Address book and tRPC routers (addresses + orders)
- [x] 02-04-PLAN.md — WMS pick lists and dispatch workflows
- [x] 02-05-PLAN.md — PDF generation (cert packs, invoices, and BACS proforma)
- [x] 02-06-PLAN.md — Customer portal and transactional emails
- [x] 02-07-PLAN.md — Checkout wizard UI and payment integration
- [x] 02-08-PLAN.md — Gap closure: dispatch-to-certpack wiring + success page batch allocations

**Requirements:**
- SHOP-06, SHOP-07, SHOP-08, SHOP-09, SHOP-10, SHOP-11, SHOP-12 (basket, checkout, payment)
- SHOP-14, SHOP-15, SHOP-16 (order history, reorder, invoices)
- TRACE-07 (batch allocation shown on order confirmation)
- TRACE-09, TRACE-10, TRACE-11 (cert pack generation on dispatch)
- WMS-02, WMS-03, WMS-04 (FIFO enforcement, stock dashboard, adjustments)
- WMS-08, WMS-09, WMS-10 (pick lists, dispatch workflows, cert pack trigger)

**Success Criteria:**
1. A customer can add products to a basket, enter a PO number, and check out on net-30 credit terms or pay by card
2. The system allocates the oldest qualifying batch (FIFO) and shows the batch allocation on the order confirmation
3. On dispatch, the system auto-generates a cert pack PDF containing all 3.1 certs for the order and emails it to the customer
4. A customer can view their order history with batch references and download invoices

**Dependencies:** Phase 1 (catalogue, accounts, batch model, goods-in)

---

## Phase 3: Torke Design

**Goal:** Deliver the browser-based EN 1992-4 anchor calculation tool with 3D visualisation, PDF reports, and the design-to-order pipeline that connects calculations to the shop.

**Plans:** 2/6 plans executed

Plans:
- [ ] 03-01-PLAN.md — EN 1992-4 calculation engine (TDD): types, failure modes, groups, regression tests
- [ ] 03-02-PLAN.md — Schema extensions, design store, and input panel UI
- [ ] 03-03-PLAN.md — 3D WebGL visualisation with React Three Fiber
- [ ] 03-04-PLAN.md — Results panel with utilisation bars and action bar
- [ ] 03-05-PLAN.md — PDF report generation and calculations tRPC router
- [ ] 03-06-PLAN.md — Design-to-order pipeline and auth gating

**Requirements:**
- DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05 (calculation engine, all failure modes)
- DESIGN-06, DESIGN-07 (client-side + server-side execution, scope limitations stated)
- DESIGN-08, DESIGN-09, DESIGN-10 (3D WebGL visualisation with real-time updates)
- DESIGN-11, DESIGN-12, DESIGN-13 (PDF reports with Eurocode clause references)
- DESIGN-14, DESIGN-15, DESIGN-16 (design-to-order pipeline)
- DESIGN-17, DESIGN-18, DESIGN-19 (free access, gated export, shared product database)

**Success Criteria:**
1. An engineer can design an anchor connection to EN 1992-4 in the browser, see all failure mode utilisation ratios update in real time, and interact with a 3D model of the anchor plate
2. An engineer can export a PDF report with Torke branding, all inputs/outputs, and inline Eurocode clause references (e.g. "EN 1992-4 Clause 7.2.1.4")
3. After completing a calculation, the user is shown matching Torke products and can add them to their basket with the calculation reference linked to the order
4. Calculations work without login; saving and PDF export require a free account
5. The calculation engine has been independently verified by a CEng against published Eurocode worked examples

**Dependencies:** Phase 2 (order flow must exist for design-to-order pipeline; product database must be populated)

**Note:** The calc engine (`@torke/calc-engine`) should be developed as a standalone TypeScript library in parallel from Phase 1, with a regression test suite validated against PROFIS outputs and Eurocode worked examples. Integration into the UI happens in Phase 3.

---

## Phase 4: Portals + Marketing + Polish

**Goal:** Complete the traceability surface with customer and end-client portals, launch content/SEO, and activate Torke Design as a lead generation funnel.

**Requirements:**
- TRACE-12, TRACE-13, TRACE-14 (customer cert portal)
- TRACE-15, TRACE-16, TRACE-17 (end-client verification portal, QR-to-cert on product)
- MKTG-01, MKTG-02, MKTG-03, MKTG-04 (blog, schema markup, resource library, glossary)
- MKTG-05, MKTG-06, MKTG-07 (Torke Design lead gen funnel)

**Success Criteria:**
1. A contractor can search their certs by order number, batch ID, or product code and download cert packs from the customer portal
2. A contractor can generate a read-only verification link for their end-client; the end-client can view project fixings, batch numbers, and 3.1 certs without logging in
3. A site inspector can scan a QR code on a product box and see batch details and the linked 3.1 cert on their phone
4. The technical blog is live with SEO-optimised content and product pages include structured data markup
5. An engineer who uses Torke Design and creates an account is visible in the same system as e-commerce customers (single account, single funnel)

**Dependencies:** Phase 2 (orders and dispatch must exist for cert portals), Phase 3 (Torke Design must exist for lead gen funnel)

---

## v2 Backlog (post-launch)

Features explicitly deferred from v1. Prioritisation to be determined after launch learnings.

| Feature | Module | Notes |
|---------|--------|-------|
| Account-based pricing with negotiated rates | SHOP | Requires pricing engine and sales workflow |
| Multi-user accounts with roles | SHOP | Buyer, estimator, approver permissions |
| Barcode scanning workflow (goods-in, pick, pack, dispatch) | WMS | Browser-based PWA with offline support |
| Bin location management | WMS | Named locations, put-away instructions |
| Email/CRM automation | MKTG | Welcome sequences, reorder reminders, abandoned quotes |
| CPD training platform | MKTG | CIBSE/IStructE accredited seminars |
| Collaborative design (shareable links, revision history) | DESIGN | Google Docs-style sharing for calculations |
| Multi-product comparison | DESIGN | Side-by-side utilisation comparison |
| Template library | DESIGN | Pre-built common connections |
| BIM export | DESIGN | DWG, RFA file generation |

---

*Last updated: 2026-03-05 — Phase 3 plans created (6 plans, 3 waves)*
