# Torke

## What This Is

Torke is a UK premium fixings brand and digital platform competing with Hilti. It combines an e-commerce store for construction fixings (chemical anchors, mechanical anchors, general fixings) with **Torke TRACE**, a free browser-based structural calculation tool for engineers and specifiers. The platform's killer differentiator is full mill-to-site batch traceability with EN 10204 3.1 certification on every product — something no UK supplier outside Hilti currently offers. The business targets main contractors and M&E contractors, positioning at premium quality below Hilti pricing, with vetted global suppliers who provide mandatory 3.1 certs.

## Core Value

Every fixing sold through Torke can be traced from the steel mill to the installed location, with verifiable 3.1 certification at every step — giving contractors and their clients confidence that what's in the structure is what was specified.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**E-Commerce Platform**
- [ ] Contractor can browse product catalogue (chemical anchors, mechanical anchors, general fixings)
- [ ] Contractor can request quotes on standard items (self-serve)
- [ ] Large/bespoke orders are handled through account managers (hybrid model)
- [ ] Contractor can convert quotes to orders online
- [ ] Account-based pricing with negotiated rates per customer
- [ ] Order history with full batch/cert references per line item

**Batch Traceability & Certification**
- [ ] Goods-in process captures supplier batch number and links 3.1 cert at receipt
- [ ] Internal Torke batch ID assigned and linked to supplier batch + mill cert
- [ ] FIFO stock allocation with batch tracking — system knows which batch fulfils each order line
- [ ] QR code on every product/box links to full cert chain
- [ ] Digital cert pack auto-generated and emailed on dispatch (PDF with all 3.1 certs for the order)
- [ ] Customer portal: contractor can look up certs against their orders
- [ ] End-client portal: clients of the contractor can verify certs for fixings installed on their project

**Torke TRACE (Calculation Software)**
- [ ] Browser-based anchor design tool (Eurocode-compliant)
- [ ] Input: tension, shear, moment, edge distance, embedment depth, concrete class, corrosion environment
- [ ] 3D anchor plate visualisation
- [ ] Results: capacity checks (pass/fail), utilisation ratios, safety factors
- [ ] Export PDF calculation report with Torke branding and project info
- [ ] Free to use — no login required to calculate (login to save/export)
- [ ] Lives on the same platform as the shop — specifiers are one click from ordering what they just designed

**Warehouse Management (WMS)**
- [ ] WMS with barcode/QR scanning for goods-in, pick, pack, dispatch
- [ ] Batch-tracked FIFO stock management
- [ ] Location-based storage (bin locations)
- [ ] Pick lists generated from orders with batch allocation
- [ ] Supports both small parcel (courier) and pallet (bulk project) dispatch
- [ ] Auto-print labels with Torke batch ID + QR at goods-in
- [ ] Human-operated at launch, designed for future automation upgrades

**Marketing & Lead Generation**
- [ ] Content/SEO: technical blog, installation guides, specification guides
- [ ] Torke TRACE as lead gen funnel (use tool → create account → purchase)
- [ ] Email/CRM: automated campaigns, project follow-ups, reorder prompts
- [ ] CPD/training: accredited training content for engineers and contractors

### Out of Scope

- Own manufacturing — Torke is a brand and platform, not a manufacturer (for now)
- Channel systems / strut — not in initial product range, may add later
- Desktop application for Torke TRACE — web-first only
- Full warehouse automation (AutoStore/robotic) — start with WMS + scanning, scale hardware later
- Fire/seismic calculation modules — research needed, defer to v2
- Supply chain management system — use existing supplier processes, Torke manages from goods-in onward

## Context

**Market Gap:** Most UK fixings are Chinese-sourced with no meaningful batch traceability. Post-Grenfell regulatory scrutiny is increasing demand for provenance. Hilti offers traceability but at significant premium pricing. There is a gap for a brand that delivers Hilti-level traceability at a more competitive price point.

**Acquisition Strategy:** Founder is considering acquiring an existing UK fixings supplier to kickstart the business. This would provide an established product catalogue, existing customer base, and warehouse/stock — but not their technology platform. Torke's platform would replace whatever systems the acquired business uses.

**Competitive Positioning:** Premium but below Hilti pricing. The brand identity (red/black palette, bold angular logo, professional packaging with QR codes and load class markings) is designed to feel as premium and trustworthy as Hilti while being distinctly Torke.

**Torke TRACE Strategy:** The free calculation tool serves dual purpose — it's a genuine engineering tool that competes with Hilti PROFIS, and it's a lead generation funnel. Engineers who use the tool to specify fixings are already on the platform and one click from ordering. This mirrors the Hilti playbook of owning the specification stage.

**Brand Assets:** Logo, van livery, packaging design (structural anchors box, chemical resin bottle), site signage, and Torke TRACE UI mockup are already designed. Red/black/dark grey colour palette. "Torke Infrastructure Partners" as sub-brand.

**Domain:** proventure.co.uk (note: brand is Torke, domain is Proventure — clarify whether this needs alignment)

**Founder Status:** UK-based, pre-seed/bootstrapped. Building MVP to validate before raising.

## Constraints

- **Budget**: Pre-seed bootstrapped — must be capital-efficient, prioritise software over hardware
- **Tech Stack**: Custom-built e-commerce (not Shopify) — traceability features are too deeply integrated for a bolt-on approach
- **Regulatory**: EN 10204 3.1 certification chain must be legally defensible — this is a safety-critical product
- **Engineering Standards**: Torke TRACE calculations must comply with Eurocodes (BS EN 1992 for concrete, ETA guidelines for anchors)
- **Domain**: proventure.co.uk — may need brand/domain alignment strategy

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Custom e-commerce over Shopify | Traceability is too core to bolt onto a generic platform — batch tracking, cert chains, and WMS integration need to be first-class | — Pending |
| Web-based Torke TRACE (not desktop) | Engineers should land on the same site where purchasing happens — no install friction, better lead gen funnel | — Pending |
| WMS + scanning at launch (not full automation) | Traceability comes from the software not the hardware — keeps capex low while delivering the core value prop | — Pending |
| FIFO with batch tracking (not batch-segregated storage) | More space-efficient, scales better — software handles the complexity of tracking which batch goes to which order | — Pending |
| Vetted global suppliers with mandatory 3.1 | Not limiting to EU-only — best supplier wins, but 3.1 certification is non-negotiable | — Pending |
| Digital cert pack on dispatch (not physical per-box QR initially) | Faster to implement, delivers the traceability promise. Physical QR on packaging is a future enhancement matching the brand mockups | — Pending |
| Acquire existing supplier for catalogue/customers/warehouse | Accelerates go-to-market vs building from zero — Torke platform replaces their tech stack | — Pending |

---
*Last updated: 2026-03-04 after initialization*
