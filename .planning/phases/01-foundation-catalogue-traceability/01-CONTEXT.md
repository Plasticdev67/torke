# Phase 1: Foundation + Catalogue + Traceability Core - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the data model, product catalogue (browse/filter/search/PDP), goods-in workflow (batch capture + 3.1 cert upload + label printing), FIFO allocation logic, batch-tracked inventory, and permanent QR URL scheme. This is the foundation everything else builds on. No ordering, no checkout, no dispatch — those are Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Product catalogue structure
- 3-tier hierarchy: category > subcategory > product (e.g. Chemical Anchors > Epoxy Resin > Torke EP-500)
- Hilti-style hybrid PDP: hero image + key specs side-by-side at top, then tabbed sections below (Technical Data, Downloads, Approvals)
- Full filter set: type, diameter, material, load class, AND application context (e.g. "concrete to steel", "overhead")
- Search covers everything: product names, codes, descriptions, technical codes (M12x160), AND competitor cross-references (searching "HIT-RE 500" finds Torke equivalent)

### Goods-in workflow
- Step-by-step wizard (guided flow): 1) Select PO 2) Confirm product/qty 3) Enter supplier batch number 4) Upload 3.1 cert PDF 5) Review & confirm
- Missing cert handling: quarantine mode — operator can complete goods-in without cert, but stock is marked "quarantined" and blocked from picking. Cert can be uploaded later to release stock
- Label printing: thermal label printer (Zebra/Brother style) — prints on goods-in completion
- Multi-line deliveries: operator processes one PO line at a time through the wizard, each line gets its own batch ID and label

### Batch data model
- Tiered QR access: public page shows product name + Torke batch ID. Full cert details (manufacturer, heat number, chemical composition, mechanical properties) require a verification token or login
- Exact quantity tracking per batch allocation: "200 units of Batch B-001 allocated to Order A" — enables precise recall queries
- Many-to-many relationship: one order line can span batches, one batch can fulfil multiple orders
- Batch ID format: human-readable with TRK prefix (e.g. TRK-2026-03-00142) — warehouse staff can read and reference verbally
- FIFO allocation at order confirmation time — customer knows which batch before dispatch (per TRACE-07). Reserved stock is locked against the order
- QR verification URLs use permanent, versioned scheme (/t/{uuid}) with opaque UUIDs (not batch numbers) to prevent enumeration

### Seed data & catalogue source
- Acquisition target not confirmed yet — build system to accept product data from any source, use realistic sample/test data for Phase 1
- Expect medium range (200-1000 SKUs) across chemical, mechanical, and general fixings
- Product images: mix of both — some products will have images, some won't. System must handle both cleanly with placeholders
- Competitor cross-reference mapping: build the data model to support it, launch without populated cross-refs. Add as data enrichment task post-launch

### Claude's Discretion
- Exact thermal label layout and QR code size
- Meilisearch index configuration and typo tolerance tuning
- Database schema specifics (column types, indexes, constraints)
- Tab order and exact content of PDP tabbed sections
- Placeholder image design
- Quarantine notification/alerting mechanism

</decisions>

<specifics>
## Specific Ideas

- PDP should feel like Hilti Online — familiar to contractors who use it daily
- Competitor cross-reference search is a key differentiator: contractors search by the Hilti code they know and find the Torke equivalent
- Quarantine flow is critical: the traceability promise is only as strong as the weakest link, and missing certs are a real warehouse scenario
- QR URLs must work for 50+ years (building lifetime) — URL scheme must be permanent and versioned from day one

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing codebase

### Established Patterns
- None yet — Phase 1 establishes the patterns that all subsequent phases will follow

### Integration Points
- Research recommends: Next.js 15 App Router, Drizzle ORM, PostgreSQL, Meilisearch, Better Auth
- Phase 2 will build ordering/checkout on top of this catalogue and batch model
- Phase 3 (Torke TRACE) will reference the same product database (DESIGN-19)
- Phase 4 portals will surface the batch/cert data captured here

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-catalogue-traceability*
*Context gathered: 2026-03-04*
