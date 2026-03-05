# Research Summary

Synthesis of the four research files. Read the detail files for rationale and sources.

---

## Recommended Stack (key choices only)

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript | SSR, API routes, and e-commerce on one deployment; Server Actions eliminate friction between calc tool and shop |
| API layer | tRPC 11 | End-to-end type safety with zero codegen; maps cleanly to domain ops (`order.create`, `batch.trace`, `cert.generate`) |
| Database | PostgreSQL 16 + Drizzle ORM | Relational data is the right model; Drizzle is leaner than Prisma with no query-engine binary overhead |
| 3D | React Three Fiber (R3F) + drei | Declarative scene graph; React state drives the 3D model — bolt diameter input updates the visualisation instantly |
| Auth | Better Auth 1.x | Users in your own DB; no per-MAU pricing; org/team structure for multi-user contractor accounts |
| Payments | Stripe | Handles card, BACS Direct Debit, invoicing on 30-day terms, and SCA in one provider |
| Search | Meilisearch (self-hosted) | Free, typo-tolerant, instant faceted filtering — no per-query pricing |
| Background jobs | Trigger.dev 3.x | Purpose-built for Next.js; handles PDF generation, email dispatch, cert pack assembly, index sync |
| File storage | Cloudflare R2 | S3-compatible; zero egress fees; cert PDFs must be accessible for building lifetimes |
| Hosting | Vercel (Next.js) + Railway (Postgres, Meilisearch) | Right-sized for pre-seed; well-documented migration path to AWS when scale demands it |

Key rejections: no Shopify/Medusa (traceability is too core), no Prisma (runtime overhead), no microservices (wrong for a solo/small team), no GraphQL (tRPC gives the same safety with less ceremony), no Redux (Zustand + TanStack Query is sufficient).

See [STACK.md](STACK.md) for full rationale and confidence levels.

---

## Table Stakes Features (must-have for launch)

**Shop:**
- Faceted product catalogue with technical filters (diameter, material, ETA approval, corrosion class)
- Account-based pricing — prices hidden without login; guest browsing shows specs only
- PO number entry at checkout (contractors require this)
- Quote-to-order workflow with credit account checkout (30-day terms, not card-only)
- Order history with reorder capability; invoice downloads; multiple delivery addresses

**Traceability:**
- Goods-in captures supplier batch number + 3.1 cert at receipt; generates Torke batch ID and label
- FIFO batch allocation at order time — system picks oldest qualifying batch automatically
- Digital cert pack auto-generated on dispatch and emailed to customer
- Customer portal: cert lookup by order number, batch ID, or product code

**WMS:**
- Bin-location stock tracking; batch-tracked quantities per location
- Pick list generation with batch ID and bin location per line
- Barcode/QR scanning for goods-in, pick, pack, dispatch (browser-based PWA — no native app)
- Quarantine workflow for unverified or cert-missing stock

**Torke TRACE:**
- Browser-based EN 1992-4 anchor calculations (tension, shear, combined, edge/spacing effects)
- Seven failure mode checks matching PROFIS scope (steel failure, concrete cone, pull-out, splitting, pryout, edge failure, interaction)
- 3D visualisation of anchor plate and bolt group
- PDF report with all inputs, outputs, code clause references, and Torke branding
- Free without login; save/export requires free account

See [FEATURES.md](FEATURES.md) for the full dependency tree and MVP critical path.

---

## Key Differentiators (what makes Torke win)

**1. Seamless traceability surface in the e-commerce flow.** Order confirmation shows batch allocation. Dispatch email carries the cert pack automatically. Order history links to certs per line item. No competitor outside Hilti offers this; even Hilti does not surface it this cleanly in the buying flow.

**2. QR-to-cert on physical product.** Every box carries a Torke QR that resolves to a public (no-login) cert chain page — batch ID, mill cert, manufacturer cert, goods-in date. A site inspector or building control officer can verify on-site in 10 seconds. No UK supplier currently does this.

**3. End-client verification portal.** Contractor generates a read-only link for their end-client (building owner, structural engineer, building control). No login required. Directly addresses post-Grenfell accountability obligations and makes the contractor look professional. No UK fixings brand offers this.

**4. Torke TRACE integrated with the shop.** "Design this fixing" from a product page pre-loads the calc tool. Calculation output has "Add to quote" for the matched product. Calculation reference is linked to the order and cert pack. PROFIS outputs a PDF; ordering happens elsewhere, weeks later, through a distributor with no link to the calculation. Torke closes the full loop: Design > Specify > Order > Receive > Install > Trace.

**5. Browser-first calc tool with no vendor lock-in.** PROFIS is still primarily a Windows desktop app requiring IT approval to install. Torke TRACE works in any browser, on any device, day one. Importantly, it accepts generic ETA data — not just Torke products — so engineers adopt it on its merits. Commercial conversion happens because Torke products are one click away, not because the engineer is trapped.

**6. Transparent methodology.** Eurocode clause references shown inline. "Explain this check" expandable sections. Published calculation methodology document. PROFIS is a black box; Torke TRACE is the opposite. This matters to engineers who need to understand and stand behind their designs.

See [FEATURES.md](FEATURES.md) for the full differentiator list across e-commerce, traceability, Torke TRACE, WMS, and marketing.

---

## Architecture Decision: Modular Monolith

**Do not start with microservices.** For a pre-seed team, microservices multiply deployment complexity, eliminate transactional consistency, and require distributed tracing and service mesh infrastructure before writing a single line of business logic.

The correct architecture is a **modular monolith**: seven domains with clear internal boundaries, a single deployable unit, one PostgreSQL database.

```
torke/
  src/
    catalogue/      # Products, pricing, search
    orders/         # Quotes, orders, lifecycle
    traceability/   # Batches, certs, verification, cert pack generation
    wms/            # Goods-in, stock, picking, packing, dispatch
    design/         # Calculation engine, product matching, reports
    accounts/       # Auth, customer accounts, roles
    common/         # Shared utilities, event bus, PDF generation
```

Cross-domain communication uses an **in-process event bus** (not external queues). The async events — `order.confirmed` → WMS, `dispatch.completed` → cert pack generation — are implemented as pub/sub within the process. Extract to separate services only when there is a proven operational reason (e.g. the calc engine needs dedicated resources, or the WMS needs independent scaling).

The traceability chain is an **append-only event log**: every batch state transition (received, put away, allocated, picked, dispatched) is a timestamped, actor-recorded event. Records are never modified. Cert documents are stored immutably in R2. QR tokens are opaque UUIDs (not batch numbers) to prevent enumeration.

The Torke TRACE calculation engine (`@torke/calc-engine`) runs **client-side for instant feedback** and is **re-run server-side for report generation** to validate integrity. The engine is a pure TypeScript library with no framework dependencies — callable from both the API and future testing tooling. Calculation IP never ships in the browser-visible source.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full data flow diagram, data model, API designs, and phased build order.

---

## Critical Pitfalls to Design Around

**Do not try to launch everything at once (BP-1).** The integration complexity between four systems is multiplicative. Each module must be independently usable with manual fallbacks. Ship e-commerce with manual cert upload first; replace with automated WMS in phase two.

**Get the batch data model right before writing code (TP-2).** Model batch as a first-class entity with a full lifecycle. Support many-to-many between batches and order lines from day one. The data model must answer the recall question: "Supplier batch X has a quality issue — which customers received it?" This schema is very expensive to change after launch.

**The goods-in process is the foundation of everything (TC-1).** If goods-in is slow, error-prone, or bypassable, the entire traceability promise collapses. Design the workflow for speed under time pressure. Enforce it in software — stock must not become pickable without completing goods-in. Test with actual warehouse staff, not at a desk.

**Get independent structural engineering verification before releasing Torke TRACE (CL-1, CL-2).** A CEng must independently verify every calculation method against published Eurocode worked examples and PROFIS outputs before public release. Version all calculation methods; maintain an audit trail of every input/output and the software version that produced it. Professional indemnity insurance must cover the calculation software.

**QR URL scheme must be permanent from day one (TP-3).** The URL `/t/{token}` (or equivalent) must resolve for decades. A breaking change to the URL structure makes every printed label in the field useless. Design this as a versioned, permanent API endpoint before printing a single label.

**Cert authenticity is not a solved problem (TC-4, RC-2).** Fraudulent or non-conforming 3.1 certs exist. Build a cert verification checklist into the goods-in flow; do not just accept a file upload. Periodic independent batch testing against UKAS-accredited labs is essential for maintaining the traceability claim.

**In an acquisition: data migration takes 3-6 months, customer disruption is real, and existing stock without certs cannot carry the Torke traceability promise (AI-1, AI-2, AI-4).** Plan a full stock take. Sell through uncertified inherited stock under the old brand or quarantine it. Maintain existing ordering channels for at least six months — digital migration should be an option, not a mandate, initially.

See [PITFALLS.md](PITFALLS.md) for the full set of 20+ pitfalls with warning signs and prevention strategies, organised by business, technical, regulatory, calculation liability, acquisition, and traceability chain categories.

---

## Compliance Requirements (EN 1992-4, ETA, post-Grenfell)

**EN 10204 Type 3.1** — the non-negotiable baseline. Every product sold by Torke must have a 3.1 cert issued by the manufacturer's authorised representative and confirmed by an independent inspection body. The cert must clearly reference the specific heat/batch delivered. Certs must be stored immutably and accessible for the building lifetime (plan for 50-100 years).

**EN 1992-4** — the Eurocode for post-installed fasteners in concrete. Torke TRACE calculations must implement all required failure mode checks for the in-scope anchor types. Any scope limitation (e.g. no seismic, no fire) must be clearly stated on every report. An independent CEng review of the calculation methods is not optional.

**ETA / UKTA marking** — post-Brexit UK operates a dual CE/UKCA regime for construction products. The transition period has been extended multiple times (currently to 2027, but verify actively). Product catalogue data must track marking status per SKU. Torke TRACE must reference the correct assessment (ETA vs UKTA) by jurisdiction. Monitor OPSS guidance continuously.

**Building Safety Act 2022 / Golden Thread** — do not claim "Building Safety Act compliant." Instead describe what the platform does: full batch traceability with EN 10204 3.1 certification, cert pack on dispatch, QR verification, end-client portal. The secondary legislation and enforcement guidance are still evolving. Subscribe to BSI, NHBC, and HSE regulatory updates. Build the traceability system to capture more data than currently required — easier to ignore fields than to add them retroactively.

**Product liability (Consumer Protection Act 1987, Construction Products Regulation)** — as a branded supplier Torke sits in the liability chain even though it is not the manufacturer. Product liability insurance with appropriate coverage for safety-critical construction products must be in place before the first sale. Document the supplier vetting process; implement a formal complaints and recall procedure from day one.

**GDPR** — separate building/product traceability data (long retention required) from personal data of installer/site workers (minimise and time-limit). Marketing consent management from launch.

---

## Recommended Build Order

Driven by feature dependencies and the principle that each phase delivers something demonstrable.

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1: Foundation + Catalogue | Weeks 1-4 | Browsable product catalogue with customer login |
| 2: Traceability Core + Goods-In | Weeks 5-8 | Warehouse receives goods, assigns batches, uploads certs, prints labels |
| 3: Order Flow + Batch Allocation | Weeks 9-12 | Customer creates quote, converts to order; FIFO batch allocation; pick lists generated |
| 4: WMS Operations | Weeks 13-16 | Full warehouse flow: goods-in > pick > pack > dispatch; scanner-confirmed |
| 5: Cert Pack + Verification | Weeks 17-20 | Customer receives cert pack on dispatch; QR codes link to cert chain; customer portal live |
| 6: Torke TRACE MVP | Weeks 21-28 | Engineer designs anchor, sees matching Torke products, adds to quote |
| 7: Polish + Scale | Weeks 29+ | End-client portal, CMS/content, email automation, advanced pricing, analytics |

Torke TRACE is built after the commerce and traceability platform because: (a) the shop can generate revenue without it, and (b) the "Add to Quote" integration in phase 6 needs a real order flow to connect to.

The calculation engine (`@torke/calc-engine`) should be developed in parallel from week 1 as a standalone library with a comprehensive regression test suite, ready to integrate into the UI in phase 6.

---

## Open Questions

1. **Domain alignment** — the brand is Torke but the domain is `proventure.co.uk`. This needs a decision before any SEO or marketing investment. Does Torke acquire `torke.co.uk`? Does the brand change? Or does proventure.co.uk become the trading domain?

2. **Acquisition timing relative to platform build** — if an acquisition completes before the platform is ready, the acquired business runs on legacy systems during the build period. What is the maximum acceptable parallel-running duration? What triggers a hard cutover?

3. **Calculation engine scope for v1** — EN 1992-4 covers a wide range of failure modes, anchor types, loading combinations, and edge cases. What is the exact in-scope boundary for launch: single anchors only, or anchor groups? Cracked concrete only, or uncracked too? What load combinations? This scope must be locked before the CEng verification engagement begins.

4. **Supplier transparency in QR cert display** — the public cert verification page can show or anonymise supplier names. What is Torke's position? Showing supplier names builds end-to-end trust but exposes supplier relationships. Anonymising protects commercial sensitivity but weakens the traceability narrative.

5. **UKCA transition timeline** — the CE/UKCA dual regime transition date has shifted multiple times. The current position (extended to 2027) needs active monitoring. What is the contingency if a key product line does not have UKCA marking at the point the transition is enforced?

6. **Cert escrow / business continuity** — if Torke ceases trading, contractors who installed Torke fixings in 2027 still need cert access in 2077. What is the escrow or archive strategy? This is worth resolving in principle at Phase 0 even if implementation is deferred.

7. **Independent testing programme** — periodic UKAS-accredited lab testing of received batches is a key defence against cert fraud. What cadence, what products, what budget? This should be part of the operational plan from launch, not added reactively.
