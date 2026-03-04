# Phase 2: E-Commerce + Order Flow + WMS - Research

**Researched:** 2026-03-04
**Domain:** E-commerce checkout, payment processing, order fulfilment, PDF generation, transactional email
**Confidence:** HIGH

## Summary

Phase 2 transforms Torke from a catalogue and warehouse system into a fully functional B2B e-commerce platform with order fulfilment. The phase spans five major domains: (1) basket and checkout with three payment methods (Stripe card, credit terms, BACS), (2) a nine-stage order lifecycle pipeline, (3) WMS pick/pack/dispatch workflows, (4) PDF generation for cert packs and invoices, and (5) a customer account portal with order history and reorder.

The existing codebase provides strong foundations: FIFO allocation via `allocateFIFO()` in batch-service.ts, batch-tracked inventory with the batches/stock/allocations schema, tRPC routers with role-based access (public, protected, warehouse), Zustand already installed for client state, and established patterns for multi-step wizards (GoodsInForm). The key new dependencies are Stripe for card payments, pdf-lib for cert pack assembly (merging original supplier PDFs), React Email + Resend for transactional emails, and several new Drizzle schema tables (orders, order_lines, addresses, credit_accounts, invoices, stock_adjustments).

**Primary recommendation:** Build in order: schema + basket store, checkout flow (addresses + payment), order confirmation + allocation, WMS pick/dispatch, cert pack + invoice PDF generation, customer account portal. Use pdf-lib (not Puppeteer) because cert packs require appending original supplier PDFs unaltered -- pdf-lib handles PDF merging natively without a browser binary.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Pre-approved credit accounts only: customer must apply offline for credit terms (net-30/net-60). Admin approves in backend. New/unapproved customers must pay by card or BACS
- BACS via proforma invoice: customer places order, gets proforma with bank details. Order stays "awaiting payment" until admin manually confirms receipt. Then order progresses to pick
- Stripe for card payments with SCA compliance
- Multi-step checkout wizard: Step 1 (delivery address) -> Step 2 (PO number + payment method) -> Step 3 (review + confirm)
- Address book with site contacts: customers save multiple named addresses (e.g. "Head Office", "Site A - Manchester"), each with optional site contact name and phone number for delivery driver
- PO number entry at checkout (required for credit accounts, optional for card/BACS)
- Detailed order status pipeline: Draft -> Awaiting Payment -> Confirmed -> Allocated -> Picking -> Packed -> Dispatched -> Delivered -> Completed
- Order-by-order picking for v1 (single order per pick list, no wave picking yet)
- Pick list shows: product, quantity, Torke batch ID (FIFO-allocated), bin location (if available)
- Operator chooses dispatch type at dispatch: "parcel" (courier tracking number) or "pallet" (haulier + consignment number)
- Stock adjustments are immediate with reason codes (damage, returns, cycle count variance) -- all logged for audit trail, no approval workflow for v1
- FIFO allocation happens at order confirmation (already built in Phase 1 batch-service.ts)
- Dispatch confirmation triggers cert pack generation
- Cover page + original certs: Torke-branded cover page with order details and batch traceability summary table, followed by original supplier 3.1 cert PDFs appended unaltered
- Detailed traceability table on cover page: Line Item | Product | Qty | Torke Batch ID | Supplier Batch | Manufacturer | Heat Number | Cert Page Ref
- Generated on dispatch AND available for on-demand download from customer account
- Email delivery: attach cert pack PDF if under 10MB, otherwise include secure download link
- Dispatch notification email includes: order ref, tracking/consignment details, cert pack (attached or linked)
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

### Deferred Ideas (OUT OF SCOPE)
- Wave picking (batch picking across multiple orders) -- revisit when order volume justifies it
- Approval workflow for stock adjustments -- add if audit requirements demand it
- Auto-reconciliation for BACS payments (banking API integration) -- add when payment volume justifies it
- Product images need wiring from data/assets/images/ to product pages (Phase 1 gap -- minor, can fix during Phase 2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHOP-06 | User can add products to a basket and proceed to checkout | Zustand cart store with localStorage persistence; checkout wizard component |
| SHOP-07 | User can enter a PO number at checkout | PO number field in checkout Step 2; required for credit, optional for card/BACS |
| SHOP-08 | User can check out on credit terms (net 30 or net 60) against an approved credit account | Credit accounts schema; admin approval flow; order moves directly to Confirmed |
| SHOP-09 | User can pay by BACS bank transfer with order held until payment confirmed | Proforma invoice PDF generation; order stays Awaiting Payment; admin manual confirmation |
| SHOP-10 | User can pay by card via Stripe (with SCA compliance) | Stripe Checkout Sessions with Payment Intents API; automatic 3DS handling |
| SHOP-11 | User can select from multiple saved delivery addresses per account | Address book schema with site contacts; address CRUD in account portal |
| SHOP-12 | User receives an order confirmation email with order reference and line item summary | React Email templates + Resend for delivery |
| SHOP-14 | User can view order history with status, tracking, and batch/cert references per line item | Orders tRPC router; card-based UI with status badges |
| SHOP-15 | User can re-order a previous order with one click | Reorder mutation copies order lines to cart store |
| SHOP-16 | User can download invoices as PDF from their account portal | pdf-lib generated invoice with batch references; stored in R2 |
| TRACE-07 | Order confirmation shows the batch allocation per line item | allocateFIFO() already built; wire into order confirmation flow |
| TRACE-09 | System auto-generates a cert pack PDF on dispatch | pdf-lib cover page + pdf-lib merge of original supplier cert PDFs from R2 |
| TRACE-10 | Cert pack is emailed to the customer with the dispatch notification | Resend with attachment (< 10MB) or secure download link |
| TRACE-11 | Cert pack PDF includes traceability data per EN 10204 3.1 | Cover page table: batch ID, supplier batch, manufacturer, heat number, etc. |
| WMS-02 | System enforces FIFO at allocation -- pick lists suggest oldest qualifying batch | allocateFIFO() already handles this; pick list UI displays results |
| WMS-03 | System provides stock level dashboard showing quantities by product and batch | Extend existing stock router; add summary charts and filters |
| WMS-04 | System supports stock adjustments with reason codes | New stock_adjustments table; adjustment mutation with reason enum |
| WMS-08 | System generates pick lists from confirmed orders with batch allocation pre-assigned | Pick list page under (wms) route group; printable layout |
| WMS-09 | System supports parcel and pallet dispatch workflows | Dispatch form with type selector; tracking/consignment number fields |
| WMS-10 | Dispatch event triggers cert pack generation | Dispatch mutation calls cert pack service; stores PDF in R2 |
</phase_requirements>

## Standard Stack

### Core (New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stripe | ^17 | Card payment processing with SCA | Industry standard; Payment Intents API handles SCA/3DS automatically |
| @stripe/stripe-js | ^5 | Client-side Stripe Elements | Required for PCI-compliant card input |
| pdf-lib | ^1.17 | PDF generation and merging | Pure JS, no binary dependencies; can merge existing PDFs (critical for cert packs) |
| @react-email/components | ^0.0.31 | Email template components | React component model for emails; pairs with Resend |
| resend | ^4 | Transactional email delivery | Developer-friendly API; React Email integration; webhook support |

### Existing (Already Installed)
| Library | Version | Purpose | Phase 2 Use |
|---------|---------|---------|-------------|
| zustand | ^5.0.11 | Client state management | Cart/basket store with localStorage persist middleware |
| drizzle-orm | ^0.45.1 | Database ORM | New order/address/invoice schemas |
| @trpc/server | ^11.11.0 | API layer | New order, checkout, dispatch routers |
| zod | ^4.3.6 | Validation | Order, address, payment input validation |
| @aws-sdk/client-s3 | ^3 | R2 object storage | Store generated cert pack and invoice PDFs |
| react-hook-form | ^7.71.2 | Form state | Checkout wizard, address forms |
| sonner | ^2.0.7 | Toast notifications | Order status updates, dispatch confirmations |
| lucide-react | ^0.577.0 | Icons | Status badges, action buttons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pdf-lib | Puppeteer | Puppeteer needs headless Chrome binary (large, slow cold starts). pdf-lib is pure JS and can merge existing PDFs natively -- critical for appending original 3.1 certs unaltered |
| pdf-lib | @react-pdf/renderer | Cannot merge/append existing PDF files. Only generates new PDFs from React components. Cert pack requires appending original supplier PDFs |
| Resend | Nodemailer + SMTP | Resend has React Email integration, attachment support, webhook tracking. Nodemailer requires SMTP setup and no templating |
| Zustand persist | Server-side cart in DB | Zustand persist to localStorage is simpler for v1. DB cart adds complexity (guest cart merging, session management). Can migrate later if needed |

**Installation:**
```bash
npm install stripe @stripe/stripe-js pdf-lib @react-email/components resend
```

## Architecture Patterns

### New Route Structure
```
src/app/
├── (shop)/
│   ├── basket/page.tsx              # Basket/cart view
│   ├── checkout/
│   │   ├── page.tsx                 # Multi-step checkout wizard
│   │   ├── success/page.tsx         # Post-payment success
│   │   └── actions.ts              # Server actions for checkout
│   └── account/
│       ├── page.tsx                 # Account dashboard
│       ├── orders/
│       │   ├── page.tsx            # Order history list
│       │   └── [id]/page.tsx       # Order detail with batch refs
│       ├── addresses/page.tsx       # Address book management
│       └── invoices/[id]/page.tsx   # Invoice download
├── (wms)/
│   ├── orders/
│   │   ├── page.tsx                # Order queue (confirmed, ready to pick)
│   │   └── [id]/
│   │       ├── page.tsx            # Order detail for WMS
│   │       ├── pick/page.tsx       # Pick list view (printable)
│   │       └── dispatch/page.tsx   # Dispatch confirmation form
│   ├── stock/
│   │   ├── page.tsx                # Stock dashboard (enhanced)
│   │   └── adjustments/page.tsx    # Stock adjustment form
│   └── credit-accounts/page.tsx    # Admin credit account management
└── api/
    ├── stripe/
    │   └── webhook/route.ts        # Stripe webhook handler
    └── trpc/[trpc]/route.ts        # Existing tRPC handler
```

### New Database Schema
```
src/server/db/schema/
├── orders.ts          # orders, order_lines tables
├── addresses.ts       # delivery_addresses table
├── credit-accounts.ts # credit_accounts table
├── invoices.ts        # invoices table
├── stock-adjustments.ts # stock_adjustments table
└── (existing: products, batches, stock, verification, allocations, users)
```

### New Service Layer
```
src/server/services/
├── batch-service.ts     # Existing: completeGoodsIn, allocateFIFO
├── qr-service.ts        # Existing: QR generation
├── order-service.ts     # NEW: order creation, status transitions, allocation orchestration
├── payment-service.ts   # NEW: Stripe session creation, BACS proforma, credit validation
├── certpack-service.ts  # NEW: PDF cert pack generation (cover page + cert merge)
├── invoice-service.ts   # NEW: PDF invoice generation with batch refs
└── email-service.ts     # NEW: transactional email dispatch via Resend
```

### Pattern 1: Order Status State Machine
**What:** Enforce valid order status transitions with a state machine pattern.
**When to use:** Every order status change must go through this.
**Example:**
```typescript
// src/server/services/order-service.ts

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  draft: ["awaiting_payment", "confirmed"], // confirmed = credit account (no payment wait)
  awaiting_payment: ["confirmed", "cancelled"], // confirmed = BACS received or card paid
  confirmed: ["allocated"],
  allocated: ["picking"],
  picking: ["packed"],
  packed: ["dispatched"],
  dispatched: ["delivered"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function transitionOrder(
  tx: Transaction,
  orderId: string,
  newStatus: OrderStatus,
  metadata?: Record<string, unknown>
) {
  const order = await tx.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });
  if (!order) throw new Error("Order not found");
  if (!canTransition(order.status, newStatus)) {
    throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
  }
  await tx.update(orders).set({
    status: newStatus,
    updatedAt: new Date(),
    ...metadata,
  }).where(eq(orders.id, orderId));
}
```

### Pattern 2: Payment Method Strategy
**What:** Three payment methods with different order flow behaviour.
**When to use:** Checkout completion.
**Example:**
```typescript
// Stripe card: Create Checkout Session -> webhook confirms -> order moves to Confirmed
// Credit: Validate credit account approved -> order moves directly to Confirmed
// BACS: Generate proforma invoice PDF -> order stays Awaiting Payment -> admin confirms manually

type PaymentMethod = "card" | "credit" | "bacs";

async function processPayment(orderId: string, method: PaymentMethod, tx: Transaction) {
  switch (method) {
    case "card":
      // Create Stripe Checkout Session with order metadata
      // Redirect customer to Stripe-hosted checkout
      // Webhook handler moves order to "confirmed" on payment_intent.succeeded
      break;
    case "credit":
      // Validate customer has approved credit account with sufficient limit
      // Move order directly to "confirmed"
      // Reduce available credit limit
      break;
    case "bacs":
      // Generate proforma invoice PDF with bank details
      // Keep order at "awaiting_payment"
      // Email proforma to customer
      // Admin manually confirms when payment received
      break;
  }
}
```

### Pattern 3: Cert Pack Assembly (PDF Merging)
**What:** Generate a Torke-branded cover page and append original supplier cert PDFs.
**When to use:** Dispatch confirmation (WMS-10), on-demand download.
**Example:**
```typescript
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { GetObjectCommand } from "@aws-sdk/client-s3";

async function generateCertPack(orderId: string): Promise<Buffer> {
  // 1. Create cover page with order details and traceability table
  const coverDoc = await PDFDocument.create();
  const page = coverDoc.addPage([595, 842]); // A4
  // Draw Torke branding, order details, traceability table...

  // 2. Merge with original supplier cert PDFs
  const mergedDoc = await PDFDocument.create();

  // Copy cover page(s)
  const coverPages = await mergedDoc.copyPages(coverDoc, coverDoc.getPageIndices());
  coverPages.forEach(p => mergedDoc.addPage(p));

  // For each order line allocation, fetch original cert from R2 and append
  for (const allocation of allocations) {
    const certPdfBytes = await fetchFromR2(allocation.certKey);
    const certDoc = await PDFDocument.load(certPdfBytes);
    const certPages = await mergedDoc.copyPages(certDoc, certDoc.getPageIndices());
    certPages.forEach(p => mergedDoc.addPage(p));
  }

  return Buffer.from(await mergedDoc.save());
}
```

### Pattern 4: Zustand Cart Store with Persistence
**What:** Client-side basket with localStorage persistence and hydration safety.
**When to use:** All basket interactions.
**Example:**
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(i => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: item.quantity ?? 1 }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(i => i.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map(i =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        })),
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "torke-cart" }
  )
);
```

### Anti-Patterns to Avoid
- **Trusting client-side prices:** Always fetch prices from DB in server actions/tRPC, never from cart state. Cart stores productId and quantity only for pricing purposes.
- **Stripe webhook without idempotency:** Always check if order is already confirmed before processing `payment_intent.succeeded`. Stripe can send webhooks multiple times.
- **Blocking on PDF generation:** Cert pack generation can take seconds for large orders. Generate asynchronously after dispatch confirmation, notify when ready. Do not block the dispatch UI.
- **Modifying original cert PDFs:** Supplier 3.1 certs MUST be appended unaltered. Never re-render, resize, or reformat them. pdf-lib's `copyPages` preserves originals exactly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card payment + SCA/3DS | Custom payment form | Stripe Checkout Sessions | PCI compliance, automatic SCA, fraud detection, hosted card input |
| PDF merging | Byte-level PDF manipulation | pdf-lib copyPages + merge | PDF spec is 756 pages; edge cases in cross-references, encryption, fonts |
| Email deliverability | Raw SMTP sending | Resend | SPF/DKIM/DMARC setup, bounce handling, delivery tracking, reputation management |
| Order status transitions | Ad-hoc status updates | State machine pattern | Prevents invalid transitions, provides audit trail, centralises business rules |
| Form validation | Manual validation | Zod schemas + react-hook-form | Already established in Phase 1; consistent validation server and client side |

**Key insight:** The cert pack is the most technically complex deliverable. It requires fetching multiple PDFs from R2, generating a branded cover page, and merging them into a single document -- all without altering the originals. pdf-lib handles this in pure JavaScript. Puppeteer cannot merge existing PDFs.

## Common Pitfalls

### Pitfall 1: Stripe Webhook Security
**What goes wrong:** Webhook endpoint processes unsigned or replayed events, allowing payment fraud.
**Why it happens:** Skipping signature verification or not checking event idempotency.
**How to avoid:** Always verify webhook signatures using `stripe.webhooks.constructEvent()`. Store processed event IDs to prevent duplicate processing. Use Stripe CLI for local webhook testing (`stripe listen --forward-to localhost:3000/api/stripe/webhook`).
**Warning signs:** Orders marked as paid without corresponding Stripe dashboard entries.

### Pitfall 2: Hydration Mismatch with Zustand Persist
**What goes wrong:** Next.js SSR renders empty cart, client hydration shows filled cart, React throws hydration error.
**Why it happens:** localStorage is not available during SSR; Zustand persist middleware loads state only on client.
**How to avoid:** Use Zustand's `onRehydrateStorage` callback or a `useEffect` pattern to delay rendering cart count until after hydration. Alternatively, render cart components only on the client with `"use client"` and a mounted check.
**Warning signs:** Console errors about hydration mismatches on pages showing cart item count.

### Pitfall 3: Race Condition in Stock Allocation
**What goes wrong:** Two concurrent orders allocate the same batch stock, overselling.
**Why it happens:** Reads and writes to batch quantities are not atomic.
**How to avoid:** The existing `allocateFIFO()` runs inside a database transaction. Use `SELECT ... FOR UPDATE` or run the entire order confirmation (including allocation) in a serializable transaction. The current implementation uses Drizzle transactions which provide this.
**Warning signs:** `quantityAvailable` going negative, or sum of allocations exceeding batch quantity.

### Pitfall 4: Large Cert Pack Emails
**What goes wrong:** Cert pack PDF exceeds email attachment size limits, email bounces.
**Why it happens:** Orders with many line items across many batches can produce large PDFs (original 3.1 certs are often multi-page scans).
**How to avoid:** Check cert pack file size after generation. If over 10MB, upload to R2 with a time-limited presigned URL and include the download link in the email instead of attaching.
**Warning signs:** Email delivery failures for large orders.

### Pitfall 5: Credit Account Validation at Checkout
**What goes wrong:** Customer checks out on credit terms but their account is not approved or credit limit is exceeded.
**Why it happens:** Credit status not checked at checkout time, or checked but not enforced atomically.
**How to avoid:** Check credit account status AND available limit inside the order creation transaction. Reduce available credit atomically with order creation. If credit check fails, reject checkout with clear error message.
**Warning signs:** Orders on credit from unapproved accounts, or credit utilisation exceeding limits.

### Pitfall 6: Order Number Generation
**What goes wrong:** Duplicate order numbers under concurrent order creation.
**Why it happens:** Sequence generation outside transaction, or using application-level counters.
**How to avoid:** Use a PostgreSQL sequence (`CREATE SEQUENCE order_number_seq`) for atomic order number generation. Format as `ORD-YYYYMM-NNNNNN` for human readability.
**Warning signs:** Duplicate key errors on order number column.

## Code Examples

### Stripe Checkout Session Creation
```typescript
// src/server/services/payment-service.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

export async function createStripeCheckoutSession(
  orderId: string,
  orderRef: string,
  lineItems: { name: string; quantity: number; unitPrice: number }[],
  customerEmail: string
) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: customerEmail,
    line_items: lineItems.map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: { name: item.name },
        unit_amount: item.unitPrice, // in pence
      },
      quantity: item.quantity,
    })),
    metadata: { orderId, orderRef },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?order=${orderRef}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/basket`,
  });
  return session;
}
```

### Stripe Webhook Handler
```typescript
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      // Transition order: awaiting_payment -> confirmed
      // Then trigger FIFO allocation
    }
  }

  return NextResponse.json({ received: true });
}

// IMPORTANT: Disable body parsing for webhook route
export const config = { api: { bodyParser: false } };
```

### React Email Template
```typescript
// src/emails/order-confirmation.tsx
import { Html, Head, Body, Container, Text, Section, Row, Column } from "@react-email/components";

interface OrderConfirmationProps {
  orderRef: string;
  customerName: string;
  lines: { product: string; qty: number; batchIds: string[] }[];
}

export function OrderConfirmationEmail({ orderRef, customerName, lines }: OrderConfirmationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "Inter, sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 700 }}>Order Confirmed</Text>
          <Text>Hi {customerName}, your order {orderRef} has been confirmed.</Text>
          <Section>
            {lines.map((line, i) => (
              <Row key={i}>
                <Column>{line.product}</Column>
                <Column>Qty: {line.qty}</Column>
                <Column>Batch: {line.batchIds.join(", ")}</Column>
              </Row>
            ))}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

### Stock Adjustment with Reason Code
```typescript
// Schema pattern for stock adjustments
export const adjustmentReasonEnum = pgEnum("adjustment_reason", [
  "damage",
  "returns",
  "cycle_count_variance",
  "other",
]);

export const stockAdjustments = pgTable("stock_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  batchId: uuid("batch_id").references(() => batches.id).notNull(),
  productId: uuid("product_id").references(() => products.id).notNull(),
  quantityChange: integer("quantity_change").notNull(), // positive = increase, negative = decrease
  reason: adjustmentReasonEnum("reason").notNull(),
  notes: text("notes"),
  adjustedBy: text("adjusted_by").notNull(), // userId
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stripe Charges API | Payment Intents + Checkout Sessions | 2019+ | SCA compliance built-in; handles 3DS automatically |
| Custom card forms | Stripe-hosted Checkout or Payment Element | 2020+ | PCI scope reduced to SAQ-A; Stripe handles card input entirely |
| Nodemailer + SMTP | React Email + Resend | 2023+ | Component-based email templates; managed delivery |
| Server-side cart in session | Client-side Zustand with persist | 2023+ | No server state for anonymous users; instant UX |
| html-pdf / wkhtmltopdf | pdf-lib (pure JS) | 2020+ | No binary dependencies; works in serverless; can merge existing PDFs |

**Deprecated/outdated:**
- Stripe Charges API: replaced by Payment Intents. Do not use `stripe.charges.create()`.
- `raw: true` body parsing in Next.js: Use `req.text()` in App Router webhook handlers.

## Open Questions

1. **Product pricing source**
   - What we know: Products table has no price column currently. Phase 1 scraped product families, not SKUs with prices.
   - What's unclear: Where do product prices come from? Are they set manually in an admin panel?
   - Recommendation: Add a `price_pence` integer column to the products table. Build a minimal admin price-setting UI in the WMS route group. All prices in pence (GBP) to avoid floating point issues.

2. **VAT handling**
   - What we know: Invoice needs to show VAT. UK standard rate is 20%.
   - What's unclear: Are all products standard-rated? Is Torke VAT registered? Do they need reverse charge for EU customers?
   - Recommendation: Assume standard 20% VAT on all products for v1. Store VAT rate per order line for future flexibility. Show VAT breakdown on invoice.

3. **Order number format**
   - What we know: Needs to be human-readable for phone/email reference.
   - What's unclear: Exact format preference.
   - Recommendation: Use `ORD-YYYYMM-NNNNNN` format (e.g., ORD-202603-000042). PostgreSQL sequence for the numeric part.

4. **Credit limit tracking**
   - What we know: Pre-approved credit accounts with net-30/net-60 terms.
   - What's unclear: How credit limits are set and tracked. Is there a credit limit per account?
   - Recommendation: Add credit_limit_pence and credit_used_pence columns to credit_accounts table. Admin sets limit on approval. System checks available credit at checkout.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright ^1.58.2 (already installed) |
| Config file | None -- needs creation in Wave 0 |
| Quick run command | `npx playwright test --grep @smoke` |
| Full suite command | `npx playwright test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHOP-06 | Add to basket and proceed to checkout | e2e | `npx playwright test tests/shop/basket.spec.ts -x` | No - Wave 0 |
| SHOP-07 | Enter PO number at checkout | e2e | `npx playwright test tests/shop/checkout.spec.ts --grep "PO number" -x` | No - Wave 0 |
| SHOP-08 | Credit terms checkout | e2e | `npx playwright test tests/shop/checkout.spec.ts --grep "credit" -x` | No - Wave 0 |
| SHOP-09 | BACS payment flow | e2e | `npx playwright test tests/shop/checkout.spec.ts --grep "BACS" -x` | No - Wave 0 |
| SHOP-10 | Stripe card payment with SCA | e2e | `npx playwright test tests/shop/checkout.spec.ts --grep "card" -x` | No - Wave 0 |
| SHOP-11 | Multiple saved addresses | e2e | `npx playwright test tests/shop/addresses.spec.ts -x` | No - Wave 0 |
| SHOP-12 | Order confirmation email | unit | `npx playwright test tests/emails/order-confirmation.spec.ts -x` | No - Wave 0 |
| SHOP-14 | Order history view | e2e | `npx playwright test tests/shop/orders.spec.ts -x` | No - Wave 0 |
| SHOP-15 | One-click reorder | e2e | `npx playwright test tests/shop/reorder.spec.ts -x` | No - Wave 0 |
| SHOP-16 | Invoice PDF download | unit | `npx playwright test tests/invoices/invoice-pdf.spec.ts -x` | No - Wave 0 |
| TRACE-07 | Batch allocation on confirmation | unit | `npx playwright test tests/orders/allocation.spec.ts -x` | No - Wave 0 |
| TRACE-09 | Cert pack auto-generation | unit | `npx playwright test tests/certpack/generation.spec.ts -x` | No - Wave 0 |
| TRACE-10 | Cert pack emailed on dispatch | integration | `npx playwright test tests/dispatch/email.spec.ts -x` | No - Wave 0 |
| TRACE-11 | Cert pack traceability data | unit | `npx playwright test tests/certpack/content.spec.ts -x` | No - Wave 0 |
| WMS-02 | FIFO enforcement | unit | `npx playwright test tests/wms/fifo.spec.ts -x` | No - Wave 0 |
| WMS-03 | Stock dashboard | e2e | `npx playwright test tests/wms/stock-dashboard.spec.ts -x` | No - Wave 0 |
| WMS-04 | Stock adjustments with reason codes | e2e | `npx playwright test tests/wms/adjustments.spec.ts -x` | No - Wave 0 |
| WMS-08 | Pick list generation | e2e | `npx playwright test tests/wms/picklist.spec.ts -x` | No - Wave 0 |
| WMS-09 | Parcel and pallet dispatch | e2e | `npx playwright test tests/wms/dispatch.spec.ts -x` | No - Wave 0 |
| WMS-10 | Dispatch triggers cert pack | integration | `npx playwright test tests/wms/dispatch-certpack.spec.ts -x` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test --grep @smoke`
- **Per wave merge:** `npx playwright test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `playwright.config.ts` -- Playwright configuration with base URL and test directory
- [ ] `tests/` directory structure -- mirrors app route groups
- [ ] Test database seeding script for orders, addresses, credit accounts
- [ ] Stripe test mode API keys in `.env.test`

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/server/services/batch-service.ts` -- confirmed allocateFIFO() implementation and transaction pattern
- Existing codebase: `src/server/db/schema/` -- confirmed all schema tables, column types, and relations
- Existing codebase: `src/server/trpc/trpc.ts` -- confirmed procedure middleware pattern (public, protected, warehouse)
- Existing codebase: `package.json` -- confirmed all installed dependencies and versions
- [Stripe Payment Intents API docs](https://docs.stripe.com/payments/payment-intents) -- SCA/3DS handling
- [pdf-lib official site](https://pdf-lib.js.org/) -- PDF creation and merging capabilities
- [Resend Next.js docs](https://resend.com/docs/send-with-nextjs) -- Server Action integration pattern

### Secondary (MEDIUM confidence)
- [Stripe + Next.js 15 guide](https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/) -- Checkout Session + webhook pattern with App Router
- [Zustand cart pattern](https://hackernoon.com/how-to-build-a-shopping-cart-with-nextjs-and-zustand-state-management-with-typescript) -- persist middleware for cart state
- [pdf-merger-js](https://www.npmjs.com/package/pdf-merger-js) -- alternative if pdf-lib merge API is cumbersome (wraps pdf-lib)
- [React Email 5.0](https://resend.com/blog/new-features-in-2025) -- Tailwind 4 support, dark mode

### Tertiary (LOW confidence)
- Stripe npm package version ^17 -- inferred from recent guides; verify with `npm info stripe version` at install time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Stripe, pdf-lib, Resend are well-established with extensive documentation; Zustand already installed
- Architecture: HIGH -- building on established Phase 1 patterns (tRPC routers, Drizzle schemas, route groups, service layer)
- Pitfalls: HIGH -- Stripe webhook security, hydration mismatches, and PDF size limits are well-documented issues
- PDF merging approach: HIGH -- pdf-lib's copyPages API is the standard way to merge PDFs in pure JS; verified against official docs and multiple sources

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable libraries, 30-day validity)
