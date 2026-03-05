# Phase 2: E-Commerce + Order Flow + WMS - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable customers to buy products and Torke to fulfil orders with full batch traceability through the order lifecycle. Covers: basket, checkout (card + credit + BACS), order history, reorder, invoices, FIFO batch allocation at pick, pick lists, dispatch workflows (parcel + pallet), auto-generated cert pack PDFs on dispatch, and stock management dashboard with adjustments.

Does NOT include: customer cert portal (Phase 4), end-client verification portal (Phase 4), marketing/SEO (Phase 4), Torke TRACE (Phase 3).

</domain>

<decisions>
## Implementation Decisions

### Checkout & payment flow
- Pre-approved credit accounts only: customer must apply offline for credit terms (net-30/net-60). Admin approves in backend. New/unapproved customers must pay by card or BACS
- BACS via proforma invoice: customer places order, gets proforma with bank details. Order stays "awaiting payment" until admin manually confirms receipt. Then order progresses to pick
- Stripe for card payments with SCA compliance
- Multi-step checkout wizard: Step 1 (delivery address) → Step 2 (PO number + payment method) → Step 3 (review + confirm)
- Address book with site contacts: customers save multiple named addresses (e.g. "Head Office", "Site A - Manchester"), each with optional site contact name and phone number for delivery driver
- PO number entry at checkout (required for credit accounts, optional for card/BACS)

### Order lifecycle & dispatch
- Detailed order status pipeline: Draft → Awaiting Payment → Confirmed → Allocated → Picking → Packed → Dispatched → Delivered → Completed
- Order-by-order picking for v1 (single order per pick list, no wave picking yet)
- Pick list shows: product, quantity, Torke batch ID (FIFO-allocated), bin location (if available)
- Operator chooses dispatch type at dispatch: "parcel" (courier tracking number) or "pallet" (haulier + consignment number)
- Stock adjustments are immediate with reason codes (damage, returns, cycle count variance) — all logged for audit trail, no approval workflow for v1
- FIFO allocation happens at order confirmation (already built in Phase 1 batch-service.ts)
- Dispatch confirmation triggers cert pack generation

### Cert pack generation
- Cover page + original certs: Torke-branded cover page with order details and batch traceability summary table, followed by original supplier 3.1 cert PDFs appended unaltered
- Detailed traceability table on cover page: Line Item | Product | Qty | Torke Batch ID | Supplier Batch | Manufacturer | Heat Number | Cert Page Ref
- Generated on dispatch AND available for on-demand download from customer account
- Email delivery: attach cert pack PDF if under 10MB, otherwise include secure download link
- Dispatch notification email includes: order ref, tracking/consignment details, cert pack (attached or linked)

### Customer account portal
- Card-based order list: each order as a card with status badge, key info, and line item preview
- One-click reorder adds all items to basket (customer can adjust quantities before checkout)
- Invoice PDF includes batch references: standard commercial invoice (company details, PO, lines, VAT, payment terms) PLUS Torke batch ID per line item
- Full account dashboard: order history, saved addresses, spending summary (monthly/yearly + top products), recent cert downloads, credit account status

### Claude's Discretion
- Exact order status transition logic and validation rules
- Email template design and transactional email provider choice
- PDF generation library (e.g. @react-pdf/renderer, puppeteer, pdfkit)
- Stock dashboard chart types and layout
- Pick list print layout
- Basket persistence strategy (DB vs localStorage)
- Credit application form fields and approval workflow UX

</decisions>

<specifics>
## Specific Ideas

- Invoice with batch references is a Torke differentiator — no other fixings supplier links their financial documents to traceability data
- Cert pack must be legally defensible: original 3.1 certs appended unaltered (not re-interpreted or reformatted)
- Checkout should feel professional and trade-oriented, not consumer e-commerce. PO number is front and centre
- Address book with site contacts reflects how construction projects work — deliveries go to sites, not offices, and the driver needs a site contact

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `batch-service.ts`: `allocateFIFO()` already implements FIFO allocation with cross-batch splitting — Phase 2 wires this into order confirmation
- `qr-service.ts`: QR code generation for labels and verification pages
- `src/server/db/schema/`: Full batch, stock, allocation, verification, and user schemas already in place
- `src/server/trpc/routers/batches.ts` and `stock.ts`: Existing tRPC routers for batch and stock operations
- `src/components/wms/`: GoodsInForm, BatchLabel, StockTable, ExpiryAlerts — WMS component patterns established
- `src/components/ui/`: shadcn components (Button, DropdownMenu, etc.) for consistent UI
- Better Auth already configured with email/password login

### Established Patterns
- tRPC routers with Zod validation (public, protected, warehouse role-based)
- Route groups: `(shop)` for catalogue, `(auth)` for login, `(wms)` for warehouse
- Drizzle ORM with PostgreSQL for all data operations
- Server actions for file uploads (cert upload pattern from goods-in)
- Dark theme with red #C41E3A accents, diagonal slash brand elements
- Multi-step wizard pattern (GoodsInForm) — reusable for checkout

### Integration Points
- Order creation hooks into existing FIFO allocation (`allocateFIFO()`)
- Cert pack generation reads from existing batch/cert data (batches table + R2 cert storage)
- Customer portal extends existing (shop) route group with authenticated account pages
- WMS pick/dispatch extends existing (wms) route group
- Stock adjustments modify existing stock table schema
- Invoice/cert pack PDFs stored in R2 alongside existing cert uploads

</code_context>

<deferred>
## Deferred Ideas

- Wave picking (batch picking across multiple orders) — revisit when order volume justifies it
- Approval workflow for stock adjustments — add if audit requirements demand it
- Auto-reconciliation for BACS payments (banking API integration) — add when payment volume justifies it
- Product images need wiring from `data/assets/images/` to product pages (Phase 1 gap — minor, can fix during Phase 2)

</deferred>

---

*Phase: 02-e-commerce-order-flow-wms*
*Context gathered: 2026-03-04*
