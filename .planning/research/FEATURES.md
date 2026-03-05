# Features Research

Research into features offered by Hilti, Fischer, Rawlplug, Lindapter, Unistrut, and B2B construction e-commerce platforms. Categorised by module and competitive tier.

---

## E-Commerce Features

### Table Stakes

These are baseline expectations for any B2B fixings e-commerce platform. Missing any of these and contractors will not engage.

**Product Catalogue & Search**
- Structured product hierarchy (chemical anchors > mechanical anchors > general fixings)
- Faceted search with technical filters (material, diameter, embedment depth, approval type, corrosion class)
- Product comparison (side-by-side spec comparison of 2-4 products)
- Barcode/item-number search (Hilti supports barcode scanning on their site)
- Clear product imagery with dimensioned drawings
- Downloadable technical datasheets (PDF), ETAs, DoPs (Declaration of Performance)
- BIM/CAD file downloads per product (DWG, RFA at minimum)

**Pricing & Quoting**
- Account-based pricing (negotiated rates per customer visible on login)
- Guest browsing without prices (standard B2B practice - show specs, hide pricing until logged in)
- Online quote request for standard items (add to quote cart, submit)
- Quote-to-order conversion (customer reviews quote, clicks to convert to order)
- Volume/tier pricing visible to account holders
- PDF quote generation with Torke branding and validity period

**Ordering & Checkout**
- PO number entry at checkout (mandatory for most contractors)
- Multiple delivery addresses per account (head office vs site delivery)
- Saved addresses and delivery contacts
- Order history with reorder capability (one-click reorder of previous orders)
- Order tracking (dispatch notification, courier tracking link)
- Invoice download from account portal
- Credit account checkout (not just card payment - most contractors buy on 30-day terms)

**Account Management**
- Company account with multiple users (buyer, estimator, site manager each with own login)
- Role-based permissions (who can place orders vs who can only request quotes)
- Approval workflows for orders over a threshold (optional but common in larger contractors)
- Favourite/saved product lists per user
- Project-based ordering (assign orders to projects for internal cost tracking)

**Mobile**
- Fully responsive site (not a separate app) - site managers order from mobile on-site
- Touch-friendly interface for gloved/dirty hands (large tap targets)

### Differentiators

Features that set Torke apart from competitors and create switching costs.

**Traceability-Integrated Shopping**
- Every product listing shows "3.1 Certified" badge and traceability promise
- Order confirmation includes batch allocation (you know which batch your order is being fulfilled from before it ships)
- Digital cert pack auto-attached to order on dispatch (not something you have to chase)
- QR code on packaging links to full cert chain (not just a product page)
- Order history shows batch numbers per line item with linked certificates
- *This is the killer feature. Hilti has traceability but does not surface it this seamlessly in the e-commerce flow. Fischer, Rawlplug, and others do not offer mill-to-site traceability at all.*

**Torke TRACE Integration**
- "Design this fixing" button on product pages launches Torke TRACE with product pre-loaded
- Torke TRACE calculation output includes "Add to basket" or "Request quote" for the specified product
- Specifier's calculation reference linked to the order (engineer can verify what was ordered matches what was designed)
- *No competitor connects their design tool to their shop this tightly. Hilti PROFIS is a separate application.*

**Project Hub**
- Group orders, certs, and calculations under named projects
- Share project cert packs with end-clients directly from the platform (client gets a read-only portal link)
- Project-level spend tracking and reporting
- Export project documentation pack (all certs, all calcs, delivery notes) as a single ZIP/PDF bundle
- *Hilti has project tools for fleet/tools but not this level of integration for fixings traceability.*

**Smart Reordering**
- AI/ML-based reorder suggestions based on order patterns and project timelines
- Low-stock alerts if Torke sees a customer's typical order frequency slip
- Subscription/scheduled delivery for consumable items (e.g., monthly resin cartridge delivery)

### Anti-features

Things to deliberately NOT build, either because they destroy value, add complexity without return, or conflict with Torke's positioning.

- **Open marketplace / third-party sellers** - Torke is a curated, quality-controlled brand. Adding marketplace sellers undermines the traceability promise and brand trust.
- **Consumer/DIY checkout** - Do not add consumer-oriented features (PayPal, buy-now-pay-later, consumer returns flow). Torke is B2B. Consumer features dilute the professional positioning and add regulatory burden.
- **Public pricing** - Do not display prices without login. B2B fixings pricing is relationship-based. Showing prices publicly invites price comparison and commoditisation, which is the opposite of Torke's premium positioning.
- **Auction/bidding** - No reverse auction or competitive bidding. This is a premium brand, not a race to the bottom.
- **Live chat bot (initially)** - Do not build an AI chatbot for V1. A bad bot is worse than no bot. Use human chat or callback request instead.
- **Native mobile app** - Responsive web is sufficient. An app adds development overhead, app store approval friction, and most contractors will not download another app. Reassess if usage data shows demand.
- **Shopify/WooCommerce** - Do not bolt traceability onto a generic e-commerce platform. The batch tracking, cert chain, and WMS integration are too deeply integrated into the order flow. Custom-built is the correct call (per PROJECT.md).

---

## Traceability Features

### Table Stakes

The minimum viable traceability system that delivers on Torke's core promise.

**Goods-In Capture**
- Supplier batch number recorded at receipt (manual entry or barcode scan)
- 3.1 cert (EN 10204) uploaded and linked to supplier batch at goods-in
- Internal Torke batch ID generated and assigned
- Torke batch linked to: supplier batch, supplier name, date received, PO reference, and 3.1 cert PDF
- Label printed at goods-in with Torke batch ID + QR code for downstream scanning

**Stock & Batch Tracking**
- FIFO allocation: system always picks oldest qualifying batch first
- Batch-tracked inventory: system knows exactly how many units of each batch are in stock and where
- Pick list shows batch ID and bin location for each line item
- Dispatch records which batch was shipped against which order line

**Certificate Delivery**
- Digital cert pack auto-generated on dispatch: PDF containing all 3.1 certs for every line item in the order
- Cert pack emailed to customer with dispatch notification
- Cert pack downloadable from customer portal against order number
- Each cert clearly shows: Torke batch ID, supplier batch ID, mill/manufacturer, heat number, chemical composition, mechanical properties (as per EN 10204 3.1 requirements)

**Customer Portal**
- Contractor can search certs by: order number, Torke batch ID, product code, date range
- Cert download as individual PDFs or bundled per order
- Order history shows batch allocation per line item

### Differentiators

**End-Client Verification Portal**
- Contractor can generate a unique read-only link for their end-client (building owner, structural engineer, building control)
- End-client clicks link, sees: project name, list of fixings supplied, batch numbers, and linked 3.1 certs
- No login required for end-client - just a secure, time-limited or permanent link
- *No UK fixings supplier offers this. It directly addresses post-Grenfell accountability concerns and makes the contractor look professional to their client.*

**QR-to-Cert on Product**
- Physical QR code on every box/cartridge label (printed at goods-in)
- Scanning QR on-site takes installer/inspector to a page showing: product details, batch ID, 3.1 cert, date of manufacture, expiry (for chemical resins)
- Site inspector or building control officer can verify the fixing in the structure matches the specification without paperwork
- *This is the "scan and verify" moment that makes Torke's traceability tangible rather than theoretical.*

**Cert Chain Visualisation**
- Web UI showing the full chain: Steel Mill > Raw Material Cert > Manufacturer > Product Cert > Torke Receipt > Torke Batch > Customer Order > Site
- Interactive, not just a PDF dump
- Exportable as a single-page summary for inclusion in O&M manuals

**Expiry Tracking for Chemical Resins**
- Chemical anchors have shelf life (typically 12-18 months)
- System tracks expiry per batch and alerts: customer (before delivery of short-dated stock), warehouse (for stock rotation), and operations (for approaching-expiry inventory)
- Customer portal shows remaining shelf life for chemical products in their orders

**Regulatory Compliance Pack**
- One-click export of all documentation required for building control submission: DoPs, ETAs, 3.1 certs, calculation reports (from Torke TRACE), installation method statements
- Pre-formatted for common submission requirements (Building Regulations Part A, CDM compliance packs)

---

## Calculation Software Features (Torke TRACE)

### Table Stakes (what PROFIS does)

Hilti PROFIS Engineering is the industry standard. Its modules include:

**PROFIS Anchor (Core Module)**
- Post-installed anchor design to Eurocode 2 (EN 1992-4) and ETA guidelines (ETAG 001 / EAD 330232/330499)
- Input: anchor type, concrete class, cracked/uncracked, load combination (tension, shear, combined), edge distances, spacing, anchor plate geometry
- Checks: steel failure (tension/shear), concrete cone breakout, pullout, concrete pryout, concrete edge breakout, splitting, blowout
- Utilisation ratios per failure mode with pass/fail
- Seismic design category input (C1/C2) for anchor qualification under seismic loading
- 3D visualisation of anchor group and plate
- PDF report generation with project details, inputs, results, code references
- Supports both single anchors and anchor groups (2, 4, 6+ anchor patterns)

**PROFIS Baseplate (Add-on Module)**
- Steel baseplate design integrated with anchor design
- Baseplate bending check, weld design
- Column-to-baseplate connection design
- Grout layer consideration
- FE-based plate analysis (not just simplified hand calc)

**PROFIS Channel**
- Design of channel bolt systems (Hilti HAC/HBC channels)
- Channel loading: point loads, distributed loads
- Checks: channel lip failure, bolt bending, special fastener pull-out
- Primarily relevant for Hilti's own channel product range

**PROFIS Fire Protection**
- Firestop design for penetration seals
- Selects appropriate firestop product for the penetration type (cable, pipe, mixed)
- Fire rating calculation (EI 60, EI 90, EI 120 etc.)

**PROFIS Rebar**
- Post-installed rebar design to Eurocode 2
- Bond strength calculation for adhesive anchored rebar
- Lap length, development length checks
- Relevant for structural strengthening and extensions

**General PROFIS Features**
- Free to use for basic calculations (premium features behind login)
- Desktop application (Windows) with web version available
- Project management: save, organise, share calculations within the application
- Multi-language, multi-code (Eurocode, ACI, AS/NZS)
- Regular database updates as new products gain ETAs
- Integration with Hilti product catalogue (calculation specifies a Hilti product by code)

**Fischer Equivalent: FiXperience**
- Similar anchor design capability but narrower product range
- Web-based and mobile app
- Fischer COMPUFIX for more detailed engineering calculations
- Less polished UX than PROFIS, fewer modules
- Primarily covers their own product range only

**Rawlplug Equivalent: Rawlplug Technical Software (RTS)**
- Basic anchor design calculations
- More limited than PROFIS in scope
- Covers Rawlplug product range only
- Less widely adopted by specifiers

### Differentiators (what Torke could do better)

**Browser-First, No Install**
- PROFIS core is still a Windows desktop application. The web version exists but is less capable.
- Torke TRACE is web-native from day one. Works on Mac, Chromebook, iPad, any browser. No download, no IT department approval needed.
- *This alone removes a major friction point. Many specifiers at smaller firms cannot install PROFIS due to IT restrictions.*

**No Vendor Lock-In**
- PROFIS only designs Hilti products. Fischer tools only design Fischer products.
- Torke TRACE should design against generic ETA-approved anchor types (any M12 bonded anchor with ETA-xx/xxxx approval data) while prominently featuring Torke products.
- Allow engineers to input custom anchor data from any ETA, making it genuinely useful even if they do not buy from Torke.
- *This builds trust and adoption. Engineers will use the tool because it is better, not because they are locked in. The commercial conversion happens because Torke products are one click away.*

**Spec-to-Order Pipeline**
- Calculation output includes a "Buy this from Torke" button that adds the exact specified product to a quote/basket.
- Calculation reference number is linked to the order, so the cert pack later references the original engineering justification.
- Full loop: Design > Specify > Order > Receive > Install > Trace.
- *No competitor closes this loop. PROFIS outputs a PDF. Ordering happens separately, often weeks later, often through a distributor who has no link to the original calculation.*

**Collaborative Design**
- Share calculation links (like Google Docs sharing). Engineer sends a link to the contractor or checker, they can view or duplicate the calculation.
- Revision history: see what changed between calculation versions.
- Comment/markup on calculations (checker can flag issues without editing the calc).
- *PROFIS has no collaboration features. Calculations are shared as PDFs or .pe files that must be opened in PROFIS.*

**Modern UX**
- Real-time 3D visualisation (not the dated 2005-era PROFIS graphics)
- Interactive: drag anchor positions, resize plate, see utilisation update live
- Mobile-friendly: view calculation results on-site on a phone
- Dark mode (engineers spend hours in this tool - eye strain matters)

**Transparent Methodology**
- Show the Eurocode clause references inline next to each result (not buried in an appendix)
- "Explain this check" expandable sections that teach the engineer what the software is doing
- Open calculation methodology document published on the Torke website
- *PROFIS is a black box. Many engineers distrust it because they cannot see the working. Torke TRACE should be the opposite.*

**Multi-Product Comparison**
- Design the same connection with multiple anchor options (Torke product A vs Torke product B vs generic ETA anchor)
- Side-by-side utilisation comparison to help the specifier choose the optimal product
- Cost comparison if the specifier is logged in with pricing

**Template Library**
- Pre-built calculation templates for common connections: handrail baseplate, steel column base, M&E bracket, facade bracket
- Engineer selects template, inputs their loads, gets result in 30 seconds
- *Dramatically reduces time-to-first-result compared to PROFIS where every calculation starts from a blank canvas.*

---

## WMS Features

### Table Stakes

The minimum WMS functionality needed to deliver batch-tracked traceability from goods-in to dispatch.

**Goods-In**
- Barcode/QR scanning for receiving against purchase orders
- Supplier batch capture at receipt (scan or manual entry)
- 3.1 cert upload and linking at receipt (photo/scan of cert, or PDF upload)
- Internal batch ID generation and label printing (Torke batch QR label)
- Quarantine/inspection hold capability (hold stock until cert verified)
- Put-away instruction generation (assign received stock to bin location)

**Inventory Management**
- Bin-location tracking (warehouse divided into named locations: A-01-01 etc.)
- Batch-tracked stock levels per location
- FIFO enforcement at system level (pick lists always suggest oldest qualifying batch)
- Stock adjustment with reason codes (damage, returns, cycle count variance)
- Cycle count support (partial counts by location, not full warehouse shutdown)
- Minimum stock level alerts per product
- Expiry date tracking for chemical products

**Order Fulfilment**
- Pick list generation from orders with batch allocation pre-assigned
- Wave picking support (group multiple orders into a single pick round)
- Pick confirmation by scanning (scan bin, scan product, confirm quantity)
- Pack stage: scan items into shipment, system validates pick completeness
- Dispatch: generate shipping label, record carrier and tracking number
- Auto-generate cert pack PDF on dispatch
- Support for both small parcel (courier) and pallet (haulier) dispatch workflows

**Returns & Adjustments**
- Returns processing with batch tracking (returned stock goes back to correct batch or is quarantined)
- Damage/write-off workflow with batch reference
- Stock transfer between locations

### Differentiators

**Traceability-Native WMS**
- Most WMS systems bolt batch tracking on as an optional module. Torke's WMS is built with batch traceability as the primary concern, not an afterthought.
- Every scan, every movement, every pick is batch-recorded. There is no "skip batch" option.
- *This is not a feature so much as a design principle. The WMS exists to serve the traceability promise.*

**Cert Verification Workflow**
- Goods-in includes a cert verification step: operator uploads cert, system checks it matches the PO (correct product, correct standard, cert not expired)
- Option for a second-person verification for critical products (four-eyes principle)
- Flagging if a cert is missing or suspicious (e.g., cert date after delivery date, cert for wrong product code)

**Offline-Capable Scanning**
- Warehouse scanning should work even if internet drops (common in warehouse environments)
- Queue scans locally, sync when connection restores
- *Many cloud-only WMS systems fail in poor-connectivity warehouse environments.*

**Photo Capture at Key Stages**
- Photo of goods-in (pallet condition, label legibility) stored against receipt
- Photo of packed shipment stored against dispatch
- Provides evidence chain if disputes arise

**Dashboard & Analytics**
- Real-time warehouse KPIs: orders awaiting pick, pick accuracy rate, dispatch SLA compliance
- Batch age report: flag slow-moving batches approaching expiry
- Stock turn analysis per product
- Goods-in processing time (how long from receipt to available stock)

---

## Marketing Features

### Table Stakes

**Website & Content**
- SEO-optimised product pages with technical content (not just marketing copy)
- Technical blog: installation guides, Eurocode explainers, product comparison articles, specification guidance
- Case studies: real UK projects where Torke fixings were used, with photos and contractor testimonials
- Video content: installation videos, product demonstrations, Torke TRACE tutorials
- Resource library: downloadable technical datasheets, ETAs, DoPs, installation instructions

**Search & Discovery**
- Strong technical SEO: rank for "M12 chemical anchor ETA approved", "post-installed anchor design Eurocode", "EN 10204 3.1 fixings UK"
- Product schema markup for Google rich results
- Technical glossary pages that capture informational search traffic

**Email & CRM**
- Automated welcome sequence for new accounts
- Order confirmation and dispatch emails (transactional, but branded and professional)
- Reorder reminder emails based on typical order frequency
- New product announcements to relevant customer segments
- Abandoned quote follow-up (customer started a quote but did not convert)

**Trade Shows & Events**
- Physical presence at UK Concrete Show, UKCW (UK Construction Week), and M&E-specific events
- Hilti, Fischer, and Rawlplug all invest heavily in trade shows. Torke must be present to be credible.

### Differentiators

**Torke TRACE as Lead Generation**
- Free, no-login-required calculations drive organic traffic from engineers searching for anchor design tools
- Calculation output is gated behind account creation (free account, but captures the lead)
- Once an engineer has an account and saved calculations, they are in the funnel for purchasing
- *This is the Hilti PROFIS playbook, but executed better by removing the desktop install barrier and integrating directly with the shop.*

**CPD / Accredited Training**
- CIBSE or IStructE accredited CPD seminars (online and in-person) on topics like:
  - Post-installed anchor design to Eurocode 2
  - Batch traceability and the post-Grenfell regulatory landscape
  - Chemical anchor installation best practice
- CPD attendance tracked in the Torke platform (engineers need CPD hours; Torke provides them)
- *Hilti offers CPD seminars. Torke matching this establishes credibility. Differentiating by focusing on traceability and regulatory compliance topics that Hilti does not emphasise.*

**Specification Support Service**
- Free specification support: engineers can email/call Torke's technical team for help specifying fixings for their project
- Torke produces a written specification recommendation (product, embedment, installation method) that the engineer can include in their project spec
- This recommendation links to Torke TRACE calculations and Torke product codes
- *Lindapter and Hilti both offer this. It is a proven way to win specification at the design stage, which locks in the product for the construction stage.*

**Content Marketing Focused on Traceability**
- Thought leadership content on construction product traceability, post-Grenfell accountability, golden thread of information
- Position Torke as the authority on fixings traceability in the UK market
- Target building safety managers, principal designers, and building control officers (not just contractors)
- *No UK fixings brand owns this narrative. Post-Grenfell, it is a wide-open content opportunity.*

**Contractor Loyalty / Tiered Programme**
- Volume-based tier programme (Bronze/Silver/Gold) with benefits: faster delivery, priority technical support, extended credit terms, CPD event access
- Not a consumer-style points programme. Professional, B2B, relationship-oriented.
- *Hilti does this through their sales team relationships. Torke can systematise it through the platform.*

---

## Feature Dependencies

Features that must be built in a specific order because later features depend on earlier ones.

```
1. Product Catalogue & Search
   |
   +-- 2. Account Management & Pricing
   |      |
   |      +-- 3. Quoting & Ordering
   |             |
   |             +-- 4. Order History & Reorder
   |             |
   |             +-- 7. Project Hub
   |
   +-- 5. WMS Core (Goods-In, Batch Tracking, Pick/Pack/Dispatch)
   |      |
   |      +-- 6. Traceability (Cert Capture, Cert Delivery, QR Codes)
   |             |
   |             +-- 8. End-Client Verification Portal
   |             |
   |             +-- 9. Cert Chain Visualisation
   |
   +-- 10. Torke TRACE (Anchor Calculation Engine)
          |
          +-- 11. Design-to-Order Integration
          |
          +-- 12. Collaborative Design Features
          |
          +-- 13. Template Library
```

**Critical path for MVP:**
1. Product Catalogue + Account Management + Quoting/Ordering (the shop)
2. WMS Core with Batch Tracking (the traceability engine)
3. Cert Capture + Cert Delivery (the traceability output)
4. Torke TRACE v1 - Anchor Calculation (the lead gen tool)

**Can be deferred to v2:**
- End-client verification portal
- Cert chain visualisation
- Design-to-order integration
- Collaborative design
- Template library
- Project hub
- Loyalty programme
- CPD platform

**Key integration points:**
- WMS batch allocation must feed into order history (customer sees batch per line item)
- Dispatch event in WMS triggers cert pack generation and email
- Torke TRACE product database must be the same as the e-commerce product catalogue (single source of truth)
- CRM must receive events from: new account creation, first quote, first order, Torke TRACE calculation saved (to trigger appropriate nurture sequences)

---

*Research sources: hilti.co.uk platform features, Fischer UK (fischer.co.uk) FiXperience suite, Lindapter configurator and design services, Unistrut/Atkore BIM tools, B2B e-commerce best practices (BigCommerce). PROFIS Engineering module detail based on published Hilti documentation and industry knowledge of the Eurocode anchor design workflow. Traceability features based on EN 10204 requirements and post-Grenfell Building Safety Act obligations.*

*Last updated: 2026-03-04*
