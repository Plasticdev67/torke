# Phase 3: Torke TRACE - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Browser-based EN 1992-4 anchor calculation tool with 3D WebGL visualisation, PDF reports, and design-to-order pipeline. Calculations work without login; saving and PDF export require a free account. The calc engine runs client-side for instant feedback and server-side for report validation.

</domain>

<decisions>
## Implementation Decisions

### Calculation Input Flow
- Split-panel layout: inputs on the left (scrollable), 3D model + results on the right
- Live updates: results and 3D model update in real time as parameters change (debounced ~300ms)
- Inputs grouped in collapsible sections: Project Info, Anchor Type, Concrete, Loads, Geometry, Environment — all expanded by default, user can collapse completed sections
- Presets available: 3-5 common starting points (e.g., "Single M12 baseplate", "4-bolt M16 column base") plus blank slate option

### 3D Visualisation
- Schematic/technical illustration style — extruded plate, cylindrical bolts, concrete block. Not photorealistic
- Concrete block rendered semi-transparent so bolt embedment is visible through it
- Dimension annotations always visible on the 3D model (edge distances, bolt spacing, embedment depth) — toggleable if cluttered
- Failure mode cones toggleable per failure mode — concrete cone breakout, edge breakout, pryout surfaces overlaid on model, colour-coded by utilisation (green/amber/red)
- React Three Fiber for WebGL rendering (per DESIGN-08 requirement)

### Results & Reporting
- Utilisation ratios displayed as horizontal bars (0-100%) with colour transitions: green (<60%), amber (60-90%), red (>90%)
- Each bar shows failure mode name, utilisation percentage, and pass/fail
- Clicking a bar expands to show full calculation breakdown: design load, resistance, formula, EN 1992-4 clause reference
- Overall pass/fail status and governing failure mode shown at bottom of results
- Sticky action bar below results: "Export PDF" and "Save Calculation" buttons always visible

### PDF Report Format
- Traditional engineering calculation report format (not screen mirror)
- Cover page with Torke branding, project info, engineer name, date
- Table of contents
- Inputs summary table
- Each failure mode as a dedicated section with formulas, intermediate values, clause references (e.g., "EN 1992-4 Clause 7.2.1.4"), and result
- Summary page with all utilisation ratios and governing failure mode
- Scope limitations clearly stated (no seismic, no fire per DESIGN-07)

### Design-to-Order Pipeline
- Inline product cards below the results panel: "Recommended Products" section shows 1-3 matching Torke products as cards (image, name, price, "Add to Cart")
- Quantity pre-filled from anchor group size (e.g., 4-bolt group = qty 4), user can adjust
- Calculation reference (e.g., CALC-2026-000042) visible on order line item and in cert pack PDF — full design-to-site traceability chain
- "Add to Cart" uses existing cart store from Phase 2, with calculation reference attached to the cart item

### Access & Authentication
- Calculations work without login — no friction for first-time users
- Inline sign-up modal when unauthenticated user tries to save or export: "Create a free account to save and export." Email + password form in modal overlay. Calculation state preserved in browser. Action completes immediately after sign-up
- Same Better Auth system as the shop (DESIGN-17/18/19)

### Claude's Discretion
- Calc engine library structure and internal architecture (@torke/calc-engine)
- React Three Fiber scene setup, lighting, camera defaults
- Debounce timing and performance optimisation strategy
- Loading states and skeleton UI during calculation
- Exact preset configurations and which common connections to include
- Mobile responsive behaviour (likely simplified view without 3D on small screens)
- Saved calculations list/management UI

</decisions>

<specifics>
## Specific Ideas

- Split-panel layout inspired by PROFIS — the industry standard engineers are familiar with
- Failure cone visualisation is a key differentiator vs PROFIS (which doesn't do this interactively)
- PDF report should look like a formal engineering submission document — not a tool export
- The design-to-order pipeline is the unique Torke value prop: specify → design → order → trace. No competitor offers this seamless chain
- Calc reference on cert packs closes the loop: building inspector can trace from installed fixing back to the engineering justification

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `pdf-lib`: Already used in certpack-service.ts (529 lines) and invoice-service.ts (600+ lines) — proven pattern for PDF generation. Can reuse for calc report PDFs
- `useCartStore` (src/stores/cart.ts): Zustand cart with persist — "Add to Cart" from design tool uses same store
- `src/server/trpc/routers/products.ts`: Product queries for matching recommended products
- `src/server/db/schema/products.ts`: Product schema with pricePence — needed for product card pricing
- shadcn/ui components: Established component library for forms, buttons, cards
- Better Auth (src/lib/auth-client.ts): Authentication system for save/export gating

### Established Patterns
- tRPC for all API calls (src/server/trpc/) — new calculation routers should follow this pattern
- Drizzle ORM for database (new calculations table needed for saved calcs)
- Dark theme (#0A0A0A background) with red accents (#C41E3A) — Torke TRACE UI must match
- react-hook-form for form inputs (used in AddressForm, CheckoutWizard)
- Fire-and-forget async pattern for non-blocking operations (email, cert pack generation)

### Integration Points
- Navigation: New /design route in the app — likely under (shop) or its own route group
- Product matching: Query products by anchor type and diameter to find matching Torke products
- Cart integration: addItem() from useCartStore with calcReference field added to cart item type
- Order schema: orders/orderLines need a calcReference column to link calculation to order
- Auth: useSession() hook from Better Auth for save/export gating

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-torke-design*
*Context gathered: 2026-03-05*
