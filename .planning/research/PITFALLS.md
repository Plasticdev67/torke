# Pitfalls Research

Research into what commonly goes wrong in projects with Torke's profile: a UK premium fixings brand building a combined e-commerce + engineering calculation + WMS + traceability platform, with a potential acquisition as the go-to-market strategy.

Sources: industry knowledge of B2B construction platforms, EN 10204 certification chains, post-Grenfell UK construction regulation, Eurocode calculation software liability, WMS implementations, and fixings market competition. Research compiled March 2026.

---

## Business Pitfalls

### BP-1: Trying to launch everything at once

**The pitfall:** Building e-commerce + WMS + Torke Design + traceability as a single big-bang release. This is the most common killer of ambitious B2B platforms. The integration complexity between these four systems is multiplicative, not additive.

**Warning signs:**
- No single module is usable standalone after 6+ months of development
- Scope keeps expanding because "module X needs module Y to work properly"
- Team is working across all four areas simultaneously with no module fully complete
- Demo to early customers keeps getting delayed

**Prevention strategy:**
- Ship e-commerce with manual traceability first (cert PDFs uploaded by staff, not auto-generated)
- WMS can start as spreadsheet + barcode scanner with software replacing it in Phase 2
- Torke Design can launch independently as a lead-gen tool before the shop is live
- Each module must be usable with manual fallbacks for the others

**Phase:** Phase 0 (Architecture) — the sequencing decision must be made before any code is written.

---

### BP-2: Underestimating B2B purchasing complexity

**The pitfall:** B2B construction purchasing is nothing like B2C e-commerce. Contractors have negotiated pricing, credit accounts, approval workflows, call-off orders against frameworks, retentions, and multi-site delivery. Building "a shop" and expecting contractors to self-serve ignores how they actually buy.

**Warning signs:**
- Early customer feedback says "this is nice but we still need to call someone"
- Low conversion from browse to purchase despite good traffic
- Account managers are still handling most orders manually outside the platform
- Customers ask for features like: PO integration, credit limits, approval chains, project-based ordering

**Prevention strategy:**
- Treat the platform as a hybrid — digital-first but with account manager tools built in from day one
- Build quote-to-order workflow before full self-serve checkout
- Support PO numbers on orders from launch
- Talk to 10+ contractors about their actual purchasing workflow before building checkout
- Build the account manager dashboard as a first-class feature, not an afterthought

**Phase:** Phase 1 (MVP) — get the hybrid model right from the start.

---

### BP-3: Competing on price alone against Hilti

**The pitfall:** Positioning as "cheaper Hilti" invites a price war Torke cannot win. Hilti has scale, brand trust, and can selectively discount to defend accounts. Startups that compete on price in fixings/fasteners get squeezed when Hilti (or Fischer/Rawlplug) respond with targeted discounting on the same accounts.

**Warning signs:**
- Sales conversations always centre on price rather than traceability/service
- Winning deals purely on cost, not on the platform or traceability value
- Hilti or Fischer start offering discounts specifically on accounts Torke is targeting
- Gross margins are thinner than planned because every deal is negotiated down

**Prevention strategy:**
- Lead with traceability and the digital platform as the differentiator, not price
- Price premium-but-fair, not cheap — the brand design already supports this
- Build switching costs through the platform (order history, cert archives, Torke Design projects)
- Target contractors who are currently failing compliance audits and need traceability — they will pay for it
- Develop the CPD/training angle to build engineer loyalty before purchasing decisions

**Phase:** Phase 1 (Go-to-market) — positioning must be clear before first sales.

---

### BP-4: The "too many personas" trap

**The pitfall:** Torke serves site managers (ordering), engineers (specifying via Torke Design), procurement teams (commercial), warehouse staff (WMS), and end-clients (cert verification). Building for all these users simultaneously leads to a platform that is mediocre for everyone and excellent for no one.

**Warning signs:**
- UI/UX compromises that make the platform confusing for its primary users
- Feature requests pulling in contradictory directions
- No clear answer to "who is the most important user?"
- Engineers find Torke Design too basic; buyers find the shop too complex

**Prevention strategy:**
- Define a primary persona per phase: Phase 1 = the contractor buyer, Phase 2 = the specifying engineer
- Build Torke Design as a genuinely separate tool that happens to share authentication and product data
- Keep the WMS interface completely separate from customer-facing UI
- Each persona gets a distinct entry point and navigation flow

**Phase:** Phase 0 (Product strategy) — persona prioritisation before wireframing.

---

### BP-5: Overestimating contractor digital adoption

**The pitfall:** Many UK contractors, especially in the M&E and general building trades, still operate on phone calls, emailed PDFs, and credit account statements. Assuming they will adopt a digital platform quickly is a common B2B e-commerce mistake.

**Warning signs:**
- High account creation but low repeat orders
- Customers create accounts then phone in orders anyway
- "Can you just email me a price list?" is a frequent request
- Platform usage drops off after the novelty period

**Prevention strategy:**
- Build the platform to support the account manager workflow, not replace it
- Email/PDF ordering should be supported and tracked in the system
- Phone orders entered by staff should flow through the same system as self-serve orders
- Gradual digital migration: start by making cert access digital-only (pull them to the platform)
- Use Torke Design as the digital hook — engineers are more digitally native than site buyers

**Phase:** Phase 1-2 — design for hybrid from the start, measure digital adoption honestly.

---

## Technical Pitfalls

### TP-1: Custom e-commerce is harder than expected

**The pitfall:** The decision to build custom rather than use Shopify/BigCommerce is correct given the traceability requirements, but custom e-commerce platforms routinely take 3-5x longer than estimated to reach feature parity on basics: payment processing, tax calculation, shipping rate calculation, email transactional messages, account management, returns processing.

**Warning signs:**
- Spending months on checkout flow, payment integration, and email templates
- Traceability features (the actual differentiator) are deprioritised while basic e-commerce is built
- Tax/VAT edge cases consuming development time (EU sales, reverse charge VAT for construction)
- Basic features customers expect (address book, reorder, saved baskets) keep getting added to scope

**Prevention strategy:**
- Use headless commerce infrastructure where possible (Stripe for payments, a tax API for VAT, a shipping API for rates)
- Accept an ugly-but-functional checkout at launch — polish later
- Build the traceability layer first and bolt e-commerce basics around it, not the other way around
- Consider using an open-source e-commerce framework (Medusa.js, Saleor) as a starting point and extending it, rather than building from absolute zero
- Budget 2x the estimated time for "boring" e-commerce features

**Phase:** Phase 0 (Architecture) — technology choice has massive downstream impact.

---

### TP-2: Batch tracking data model mistakes

**The pitfall:** Getting the batch tracking data model wrong is extremely expensive to fix later. Common mistakes: treating batch as a simple attribute on a product rather than a first-class entity, not modelling partial batch allocations (an order might take from two batches), not handling batch splits (a supplier batch is split into multiple Torke batches during repackaging), and not tracking batch state transitions.

**Warning signs:**
- Edge cases in batch allocation are "handled manually" or "we'll fix it later"
- The data model cannot answer the question "which orders received product from supplier batch X?"
- Stock counts don't reconcile because batch quantities don't add up
- Goods-in process is slow because the system doesn't handle the actual complexity of how stock arrives

**Prevention strategy:**
- Model batch as a first-class entity with its own lifecycle: created at goods-in, allocated at pick, consumed at dispatch
- Support many-to-many between batches and order lines from day one
- Design the schema to answer the recall question: "Supplier batch X has a quality issue — which customers received it and on which orders?"
- Test with real supplier delivery notes before building — the actual data will be messier than assumed
- Include batch merging/splitting in the data model even if the UI doesn't support it yet

**Phase:** Phase 0 (Data architecture) — this is the foundation everything else builds on.

---

### TP-3: QR code and label printing as an afterthought

**The pitfall:** Physical-digital bridge (QR codes on products/boxes linking to cert chains) sounds simple but involves label design, printer integration, scanning reliability in warehouse conditions (dusty, cold, wet), URL structure that must remain stable for years, and the UX of what contractors see when they scan.

**Warning signs:**
- QR codes link to pages that require login (killing the value for site workers)
- Labels peel off, smear, or become unreadable in site/warehouse conditions
- Printer jams and label errors cause goods-in bottlenecks
- QR URL structure changes, breaking previously printed codes

**Prevention strategy:**
- Design the QR URL scheme as a permanent, versioned API endpoint (e.g., `/t/{batchid}`) — this URL must work for decades
- QR scan landing page must work without login and load fast on mobile with poor signal
- Test label adhesion and print quality in actual warehouse conditions early
- Have a fallback for when QR scanning fails (manual batch number lookup)
- Consider thermal transfer labels (not direct thermal) for durability

**Phase:** Phase 1 (MVP) — get the QR/label workflow right before scaling.

---

### TP-4: Integration complexity between modules

**The pitfall:** E-commerce, WMS, traceability, and Torke Design are four distinct systems that must work together seamlessly. The integration points are where bugs, data inconsistencies, and performance problems concentrate.

**Warning signs:**
- Order status is different in the e-commerce system vs the WMS
- Stock levels are out of sync between the shop and the warehouse
- Batch allocations made during picking don't flow back to the cert generation system
- Torke Design product recommendations don't match what's actually in stock

**Prevention strategy:**
- Define a single source of truth for each data domain: orders (e-commerce), stock/batches (WMS), certs (traceability), products (shared catalogue)
- Use event-driven architecture — when a pick is completed in the WMS, it emits an event that the traceability system consumes to generate the cert pack
- Build integration tests that simulate the full order-to-cert flow
- Accept eventual consistency where appropriate (stock display can be slightly delayed) but enforce strict consistency where it matters (batch allocation)
- Monorepo with shared types/contracts between modules

**Phase:** Phase 0 (Architecture) — integration architecture must be designed before module development.

---

### TP-5: Scaling prematurely vs. not designing for scale

**The pitfall:** Two opposite mistakes. Over-engineering for scale when you have zero customers wastes months. But building with no thought for scale means a painful rewrite when you win your first large contractor account with 50 sites and 500 orders/week.

**Warning signs (over-engineering):**
- Debating Kubernetes vs serverless before the first order is placed
- Microservices architecture for a team of 1-3 developers
- Spending weeks on CI/CD pipelines before the product works

**Warning signs (under-engineering):**
- Single-threaded batch processing that works for 10 orders/day but blocks at 100
- PDF generation that takes 30 seconds per cert pack
- Database queries that scan full tables because "we'll add indexes later"

**Prevention strategy:**
- Start with a modular monolith — one deployable unit with clear internal boundaries
- Design the data model for scale (proper indexing, batch processing capability) even if the infrastructure is simple
- Set performance budgets early: cert pack generation < 5 seconds, search < 500ms, stock sync < 1 minute
- Plan the first scaling trigger: "when we hit X orders/day, we will need to split Y"

**Phase:** Phase 0 (Architecture) for data model; Phase 2 for infrastructure scaling.

---

## Regulatory/Compliance Pitfalls

### RC-1: Post-Grenfell Building Safety Act requirements are still evolving

**The pitfall:** The Building Safety Act 2022 and the "golden thread" of building information are still being implemented. Secondary legislation, guidance documents, and enforcement practices are evolving. Building a compliance platform against today's rules risks being wrong by the time it launches.

**Warning signs:**
- Platform claims "Building Safety Act compliant" without specifying which provisions
- No process for monitoring regulatory updates and assessing impact on the platform
- Traceability features designed to a specific interpretation that hasn't been tested with regulators
- Marketing materials make compliance claims that exceed what the platform actually delivers

**Prevention strategy:**
- Do not claim "Building Safety Act compliant" — instead describe what the platform does: "full batch traceability with EN 10204 3.1 certification"
- Subscribe to BSI, NHBC, and HSE regulatory update services
- Build the traceability system to capture more data than currently required — it's easier to ignore fields than to add them
- Engage with a construction regulatory consultant (not just a lawyer) to review the traceability workflow
- Design the cert pack format to be extensible — new fields can be added without breaking existing packs
- Monitor the Building Safety Regulator's output for guidance on construction product traceability

**Phase:** Phase 0 (Requirements) and ongoing — regulatory monitoring must be continuous.

---

### RC-2: EN 10204 3.1 cert chain has weak links

**The pitfall:** EN 10204 Type 3.1 inspection certificates must be issued by the manufacturer's authorised representative, confirmed by an independent inspection body. The chain from mill to Torke to contractor has several points where the cert can become invalid, ambiguous, or uncheckable.

**Warning signs:**
- Suppliers provide 3.1 certs but they don't clearly link to the specific batch/heat number delivered
- Certs are in languages Torke staff cannot verify (Chinese, Turkish, Vietnamese)
- Cert covers a production run but the batch delivered is a subset with no clear traceability to the cert
- Some suppliers provide 3.1-style documents that are actually 2.2 (declaration without independent inspection)
- Mill cert references a steel grade standard that doesn't match the product specification

**Prevention strategy:**
- Create a cert validation checklist: correct standard reference, heat/batch number match, authorised signatory, independent inspector identified, test results within spec, date plausibility
- Require suppliers to provide certs in English or with certified translations
- Build a cert verification step into goods-in: staff must match cert batch numbers to delivery note quantities before accepting stock
- Maintain a supplier audit programme — visit key suppliers to verify their cert chain is genuine
- Store original cert PDFs alongside extracted/structured data — the original is the legal document
- Have a metallurgist or materials engineer review the cert validation process

**Phase:** Phase 1 (Goods-in process) — this is the foundation of the traceability claim.

---

### RC-3: Product liability and safety-critical supply

**The pitfall:** Fixings are safety-critical construction products. If an anchor fails and causes injury or structural damage, the supply chain faces product liability claims. As a branded supplier (even though not the manufacturer), Torke sits in the liability chain under the Consumer Protection Act 1987 and the Construction Products Regulation.

**Warning signs:**
- No product liability insurance or inadequate coverage limits
- No documented quality assurance process for supplier selection and ongoing monitoring
- Customer complaints about product quality are handled informally
- No process for product recalls or safety notices
- Relying entirely on supplier warranties without independent verification

**Prevention strategy:**
- Obtain product liability insurance with appropriate coverage for construction fixings (discuss limits with a specialist broker)
- Document the supplier vetting process: factory audits, test reports, sample testing, ongoing batch testing
- Implement a formal complaints and non-conformance process from day one
- Have a documented product recall procedure — even before launch
- Maintain batch traceability (which the platform does) as the essential tool for limiting recall scope
- Consider periodic independent testing of products (send samples to UKAS-accredited labs)
- Clear terms and conditions that define the liability boundary without attempting to exclude statutory liability

**Phase:** Phase 0 (Business setup) — insurance and supplier vetting before first order.

---

### RC-4: Construction Products Regulation (post-Brexit UKCA marking)

**The pitfall:** Post-Brexit, the UK operates a dual CE/UKCA marking regime for construction products, with transition periods that keep extending. Many fixings require European Technical Assessments (ETAs) or UK Technical Assessments (UKTAs). The regulatory picture for imported fixings with CE marking but no UKCA marking is unclear and changing.

**Warning signs:**
- Selling products in GB with only CE marking after the transition period ends (dates keep shifting — currently extended to 2027 but verify)
- Product datasheets reference only CE/ETA without considering UKCA/UKTA requirements
- Torke Design references ETAs for products that may not be legally valid in the UK market
- No monitoring of OPSS (Office for Product Safety and Standards) guidance on construction products

**Prevention strategy:**
- Track the CE/UKCA transition timeline actively — it has changed multiple times
- Ensure supplier agreements include obligations to obtain UKCA marking or UKTAs when required
- Include marking status (CE, UKCA, both) in product catalogue data
- Design Torke Design to reference the correct assessment (ETA vs UKTA) based on the jurisdiction
- Build a regulatory calendar for key compliance dates

**Phase:** Phase 1 (Product catalogue) — marking status must be tracked from launch.

---

### RC-5: GDPR and data handling in a B2B context

**The pitfall:** B2B platforms still handle personal data (contact names, emails, phone numbers of contractor employees). The traceability system may also capture installer names for site records. GDPR applies and the penalties for mishandling are significant.

**Warning signs:**
- No privacy policy or data processing agreement for business customers
- Storing personal data of installer/site workers in traceability records without consent or legitimate interest basis
- No data retention policy — cert records need to last for building lifetime but personal data doesn't
- Customer data used for marketing without proper consent/opt-in

**Prevention strategy:**
- Implement proper consent/legitimate interest basis for all personal data processing
- Separate building/product traceability data (which needs long retention) from personal data (which should be minimised)
- Data processing agreements with any third-party services handling customer data
- Marketing consent management from launch — harder to retrofit
- Consider anonymising installer names in traceability records after a defined period while retaining batch/cert data

**Phase:** Phase 1 (Launch) — data protection must be in place before collecting customer data.

---

## Calculation Software Liability

### CL-1: Professional indemnity for calculation outputs

**The pitfall:** Torke Design produces engineering calculation outputs that engineers and contractors rely on for structural decisions. If a calculation error leads to a structural failure, the question of who is liable — Torke (the software provider), the engineer (who used the tool), or the contractor (who installed based on the output) — becomes a serious legal matter. Most calculation software providers (including Hilti with PROFIS) use extensive disclaimers, but disclaimers have limits.

**Warning signs:**
- No legal review of the Torke Design terms of use and liability disclaimers
- Calculations produce outputs without clear statements about their limitations and assumptions
- No version control on calculation methods — if an error is found, you can't identify which outputs are affected
- Engineers are using Torke Design as the sole basis for design decisions without independent checking
- No professional indemnity insurance covering the calculation software

**Prevention strategy:**
- Legal review of terms of use by a lawyer experienced in engineering software liability (not a generic tech lawyer)
- Every calculation output must clearly state: the Eurocode clauses used, the assumptions made, the limitations of the calculation, and that the output should be verified by a qualified engineer
- Version control every calculation method — if a bug is found, you must know which outputs were generated by the buggy version
- Build an audit trail: store every calculation input and output with a timestamp and the software version
- Obtain professional indemnity insurance that explicitly covers the calculation software
- Include a "calculation method" document for each anchor type that references the specific Eurocode clauses and can be independently verified
- Do NOT claim the software replaces engineering judgement — it is a "design aid" not a "design tool" (language matters legally)

**Phase:** Phase 0 (Legal/insurance) for terms and insurance; Phase 1 for calculation audit trail.

---

### CL-2: Eurocode implementation errors

**The pitfall:** Implementing Eurocode calculations (EN 1992-4 for fastening design in concrete, EN 1992-1-1 for concrete design) is genuinely complex engineering. Failure modes for anchors include concrete cone failure, splitting, pull-out, combined tension/shear, pry-out, edge effects, group effects, and cracked/uncracked concrete conditions. Getting any of these wrong could produce unsafe designs.

**Warning signs:**
- Calculation results differ significantly from Hilti PROFIS or Fischer FiXperience for the same inputs
- No independent verification of the calculation methods by a qualified structural engineer
- Edge cases (close spacing, multiple edge distances, thin concrete, high-strength steel) produce implausible results
- No regression test suite against published worked examples from Eurocode guides

**Prevention strategy:**
- Engage a chartered structural engineer (CEng, MIStructE) to independently verify every calculation method before release
- Build a comprehensive regression test suite using:
  - Published worked examples from Eurocode design guides
  - Comparison outputs from Hilti PROFIS (which is the industry benchmark)
  - Hand calculations for simple cases
  - Manufacturer test data from ETAs
- Test edge cases aggressively: minimum embedment depths, minimum edge distances, group anchors with mixed tension/shear, concrete classes C12 to C50
- Version all calculation methods and maintain a changelog
- When a bug is found, generate a list of all affected calculations and notify users who saved/exported them
- Clearly state the scope of each calculation: "This tool covers single anchors and anchor groups in tension and shear in uncracked concrete per EN 1992-4. It does NOT cover: seismic loading, fire conditions, fatigue loading, post-installed rebar connections."

**Phase:** Phase 1 (Torke Design development) — independent verification before public release.

---

### CL-3: Conflict of interest: calculation tool recommends products to buy

**The pitfall:** Torke Design is both an engineering tool and a sales funnel. If the calculation tool recommends Torke products (which is the business model), there is a perceived — and potentially actual — conflict of interest. If the tool steers users toward more expensive products, or only shows Torke products when a competitor product would be more appropriate, it undermines both engineering integrity and regulatory standing.

**Warning signs:**
- Engineers complain that results feel like "advertisements" rather than engineering outputs
- The tool only shows Torke products as results, even when generic calculations would suffice
- Regulatory bodies or professional institutions (IStructE, ICE) raise concerns about vendor-locked calculation tools
- The tool recommends oversized/premium products when a standard product would pass

**Prevention strategy:**
- Design Torke Design to perform generic Eurocode calculations first, then suggest compatible Torke products as an optional step
- Allow engineers to input any anchor properties (not just Torke catalogue items) for the calculation
- Clearly separate the "engineering calculation" section from the "product recommendation" section
- Never suppress a passing result to upsell — if the cheapest Torke product passes, show it first
- Consider publishing the calculation methodology openly — transparency builds trust
- Get feedback from practising structural engineers during development, not just after launch

**Phase:** Phase 1 (Torke Design UX) — the boundary between engineering and sales must be designed deliberately.

---

### CL-4: Calculation report as a quasi-legal document

**The pitfall:** The PDF calculation report exported from Torke Design becomes part of the building's permanent record. It may be submitted to building control, included in structural engineer certifications, and referenced in the golden thread. If the report format is ambiguous, incomplete, or inconsistent with how engineers expect to see calculations presented, it will either not be used (killing the value proposition) or cause problems in approvals.

**Warning signs:**
- Building control officers reject or query Torke Design reports
- Structural engineers reformat the output into their own templates rather than using the Torke report
- Reports don't include essential information (partial factors used, load combinations, reference standards, software version)
- Old reports can't be reproduced because the software has been updated

**Prevention strategy:**
- Study Hilti PROFIS report format — it is the de facto standard that building control and engineers are familiar with
- Include on every report: software version, calculation date, all input parameters, all intermediate values, all checks with pass/fail, referenced standard clauses, assumptions, and limitations
- Include a unique report ID that links to a stored copy — Torke should be able to reproduce any report ever generated
- Consult with structural engineers and building control officers on report format before finalising
- Reports must be reproducible: given the same inputs and software version, the same output must be generated

**Phase:** Phase 1 (Torke Design) — report format must be right at launch; changing it later breaks archive consistency.

---

## Acquisition Integration Risks

### AI-1: Inheriting technical debt and messy data

**The pitfall:** Acquiring an existing fixings supplier means inheriting their product catalogue, customer records, order history, and (probably) a mess of spreadsheets, legacy systems, and undocumented processes. The most common acquisition integration failure is underestimating how long it takes to clean and migrate this data.

**Warning signs:**
- Product catalogue has inconsistent naming, duplicate SKUs, missing specifications
- Customer records have no standardised format — some are in spreadsheets, some in an old CRM, some in the owner's head
- Order history is in a system that can't export data cleanly
- Pricing is ad-hoc — different customers have different deals with no documentation of why
- Stock records don't match physical stock (they never do)

**Prevention strategy:**
- Commission a data audit as part of due diligence — before completing the acquisition
- Accept that data migration will take 3-6 months, not 2 weeks
- Plan for a parallel running period where the old and new systems operate simultaneously
- Prioritise migrating: (1) customer contact data, (2) product catalogue with specifications, (3) pricing structures, (4) open orders, (5) order history
- Do NOT migrate historical data that has no ongoing value — archive it but don't pollute the new system
- Budget for manual data cleaning — some of it can't be automated

**Phase:** Pre-acquisition (Due diligence) and Phase 1 (Migration).

---

### AI-2: Customer disruption during platform switch

**The pitfall:** The acquired company's customers are used to ordering by phone, email, or an existing system. Forcing them onto a new platform too quickly causes customer churn. This is the number one reason acquisitions lose customers: the acquirer changes too much too fast.

**Warning signs:**
- Customers start ordering less or going quiet after the acquisition announcement
- "The old system was easier" complaints
- Key accounts threaten to switch to a competitor
- Staff from the acquired company are sabotaging adoption (consciously or unconsciously) because they prefer the old way

**Prevention strategy:**
- Announce the acquisition with a "nothing changes for now" message to customers
- Maintain existing ordering channels (phone, email) for at least 6 months post-acquisition
- Introduce the Torke platform as an additional option, not a replacement, initially
- Migrate customers in cohorts: start with the most digitally savvy, learn, then migrate others
- Assign an account manager to every key customer during the transition
- Retain key staff from the acquired company — they are the customer relationship

**Phase:** Phase 1 (Post-acquisition) — customer communication plan needed before day one.

---

### AI-3: Staff knowledge loss

**The pitfall:** Small fixings suppliers run on tribal knowledge — the warehouse manager who knows where everything is, the sales person who knows every customer's preferences, the owner who handles supplier relationships personally. If these people leave after acquisition (which is common), critical knowledge is lost.

**Warning signs:**
- Key staff members are non-committal about staying post-acquisition
- Processes are undocumented — "ask Dave, he knows"
- Supplier relationships are personal to the founder/owner
- Warehouse organisation exists only in the warehouse manager's head

**Prevention strategy:**
- Identify the 3-5 key knowledge holders during due diligence
- Include retention incentives (earn-outs, retention bonuses) for critical staff
- Document processes during the transition period, not after
- Have a structured knowledge transfer programme: shadow each key person for at least 2 weeks
- Record supplier contacts, customer preferences, and process documentation before anyone leaves

**Phase:** Pre-acquisition (Due diligence) and first 3 months post-acquisition.

---

### AI-4: Warehouse and stock takeover complexity

**The pitfall:** Taking over a physical warehouse with existing stock means inheriting unlabelled inventory, unknown batch numbers, products in the wrong locations, and stock that may not meet Torke's traceability standards. The existing stock cannot suddenly gain 3.1 certification retroactively.

**Warning signs:**
- Existing stock has no batch traceability — you can't trace it back to a specific mill cert
- Stock is in unlabelled or poorly labelled locations
- Physical stock count doesn't match the system (it never does)
- Some stock is old, damaged, or from unknown suppliers

**Prevention strategy:**
- Plan a full stock take as part of the transition — this is non-negotiable
- Accept that existing stock without 3.1 certification must be handled differently:
  - Option A: Sell through as the old brand at a discount (no Torke branding, no traceability claim)
  - Option B: Quarantine and dispose/return
  - Option C: If the original supplier can retrospectively provide certs, obtain them (unlikely for old stock)
- Implement the WMS on the warehouse simultaneously with the stock take — label every location and every batch as you count
- Set a clear cut-off date: "after this date, all new stock received follows the Torke traceability process"

**Phase:** Phase 1 (Warehouse takeover) — plan the stock transition before acquisition completes.

---

### AI-5: Supplier relationship transfer

**The pitfall:** The acquired company's supplier relationships may not transfer smoothly. Suppliers may not be willing to provide 3.1 certification (it costs them more), may not meet Torke's quality requirements, or may have personal loyalty to the previous owner rather than the business.

**Warning signs:**
- Key suppliers are slow to respond to Torke's enquiries post-acquisition
- Suppliers refuse or stall on providing 3.1 certification
- Pricing increases from suppliers who sense an opportunity during the transition
- Supplier quality drops after the change of ownership (less personal accountability)

**Prevention strategy:**
- Meet key suppliers before or immediately after acquisition — in person, not by email
- Be upfront about the 3.1 certification requirement — some suppliers will self-select out
- Have alternative suppliers identified for every critical product before cutting over
- Don't change supplier terms/demands in the first 3 months — build the relationship first
- Negotiate 3.1 certification as a standard requirement in new supplier agreements, with a price adjustment if needed
- Expect to lose some suppliers who can't or won't meet the traceability standard — this is acceptable

**Phase:** Pre-acquisition (Supplier assessment) and Phase 1 (Supplier onboarding).

---

## Traceability Chain Gaps

### TC-1: The goods-in bottleneck

**The pitfall:** The goods-in process is where the traceability chain is created: supplier batch number matched to 3.1 cert, Torke batch ID assigned, labels printed, stock booked in. If this process is slow, error-prone, or easy to bypass, the entire traceability promise collapses.

**Warning signs:**
- Goods-in takes 3x longer than before (pre-traceability)
- Warehouse staff bypass the scanning process when they're busy ("I'll do it later")
- Batch numbers on delivery notes don't match batch numbers on 3.1 certs
- Certs arrive days after the physical delivery, and stock is used before being properly booked in

**Prevention strategy:**
- Design the goods-in process to be fast — minimal taps/clicks per item, auto-suggest batch numbers, pre-loaded supplier info
- Make it physically impossible to put stock into pickable locations without completing the goods-in process (system enforces this)
- Require 3.1 certs before stock is accepted — if certs don't arrive with the delivery, stock goes to quarantine
- Test the goods-in process with actual warehouse staff under time pressure — not at a desk
- Build a "quarantine" status for stock that has arrived but hasn't been fully processed
- Track and report goods-in time as a KPI — if it's increasing, the process is too complex

**Phase:** Phase 1 (WMS) — the goods-in workflow is the most critical process to get right.

---

### TC-2: Batch splitting and merging ambiguity

**The pitfall:** In reality, batches don't stay neat. A supplier delivery might contain products from multiple heats/batches. A large supplier batch might be split into multiple Torke storage locations. Two partial batches might be combined for a large order. Each of these events can break the traceability chain if not handled correctly.

**Warning signs:**
- System can't handle "one delivery, multiple batches" at goods-in
- System can't track that a customer received product from two different batches in one order line
- Batch quantities in the system don't reconcile with physical stock
- Cert pack shows a batch number that doesn't cover all the product in that line item

**Prevention strategy:**
- Model goods-in as: one delivery can contain multiple supplier batches, each of which becomes a separate Torke batch
- Model order allocation as: one order line can draw from multiple batches (FIFO)
- The cert pack must list all batch numbers and corresponding 3.1 certs for each order line
- Build reconciliation reports: sum of all batch quantities should equal total stock + total despatched
- Handle the "opened box" problem: if someone opens a box of 100 to take 30, the remaining 70 must stay tracked

**Phase:** Phase 0 (Data model) and Phase 1 (WMS implementation).

---

### TC-3: The "last mile" gap — from dispatch to installation

**The pitfall:** Torke's traceability runs from mill to dispatch. But the golden thread and post-Grenfell requirements increasingly want traceability to installation — which fixing was installed where on which project. Torke can't control this, but if the platform doesn't facilitate it, the traceability value is diminished.

**Warning signs:**
- Contractors ask "how do we link your batch numbers to our installation records?"
- End-clients expect installation-level traceability that Torke can't provide
- Competitors start offering installation tracking as a feature
- Building control or clients start requiring installation-level batch recording

**Prevention strategy:**
- Design the cert pack with a "project reference" field that contractors can populate
- Build an API or simple form where contractors can log: "Batch X installed at [location] on [project] on [date]"
- The end-client portal should allow viewing certs by project, not just by order
- This is a future enhancement but the data model should support it from launch
- Partner with or integrate with existing site management tools (Fieldwire, Procore, etc.) in the future

**Phase:** Phase 2 (Enhancement) — design for it in Phase 0, build in Phase 2.

---

### TC-4: Cert authenticity and fraud

**The pitfall:** Fraudulent or fabricated 3.1 certificates exist in the supply chain. A supplier might provide a genuine-looking PDF that is actually copied from another batch, modified from a 2.2 to look like a 3.1, or entirely fabricated. If Torke passes through a fraudulent cert, the traceability claim is worse than useless — it provides false assurance.

**Warning signs:**
- Cert formatting or language is inconsistent with the supposed issuing body
- Same cert used for multiple different batches (copy-paste fraud)
- Cert references testing standards or grades that don't match the product
- Independent test results don't match the values on the cert
- Supplier is reluctant to provide original certs or provide them in unusual formats

**Prevention strategy:**
- Build a cert verification checklist into the system (not just a file upload)
- Cross-reference cert serial numbers with the issuing test house where possible
- Periodic independent testing: send samples from received batches to a UKAS-accredited lab and compare results to the cert
- Red flags that the system should detect automatically: duplicate cert numbers, cert dates that don't match delivery dates, cert batch numbers that don't match delivery notes
- Maintain a supplier scorecard based on cert quality, consistency, and any discrepancies found
- If a fraudulent cert is detected, have a clear escalation process and consider dropping the supplier immediately

**Phase:** Phase 1 (Goods-in and supplier management) and ongoing.

---

### TC-5: Long-term cert storage and accessibility

**The pitfall:** Building lifetimes are 50-100 years. The traceability records for fixings installed in 2027 must be accessible in 2077. This creates a data storage and business continuity challenge that most startups don't plan for.

**Warning signs:**
- Cert PDFs stored on a single cloud provider with no backup strategy
- No plan for what happens to the data if Torke ceases trading
- Storage costs grow unexpectedly as the cert archive scales
- Older certs become inaccessible due to system migrations

**Prevention strategy:**
- Store cert PDFs in at least two independent locations (e.g., primary cloud storage + cold archive)
- Design a data export capability that produces a self-contained archive (no dependency on Torke's systems to read it)
- Consider an escrow arrangement: cert data held by a third party that can be accessed if Torke ceases trading
- Use stable, standard formats (PDF/A for certs, CSV/JSON for structured data) — not proprietary formats
- Include cert data export in the customer portal: contractors should be able to download their full cert archive at any time
- Budget for long-term storage costs in the business model — it's not free but it's not expensive either

**Phase:** Phase 0 (Architecture) for storage design; Phase 2 for escrow/business continuity planning.

---

## Common Mistakes by Phase

### Phase 0: Architecture and Planning

| # | Mistake | Consequence | Prevention |
|---|---------|-------------|------------|
| 1 | Not settling the data model for batches/certs before coding | Expensive rework when edge cases emerge | Spend 2-3 weeks on data modelling with real supplier delivery notes and certs as test data |
| 2 | Choosing microservices for a small team | Development speed drops 3-5x, deployment complexity explodes | Start with a modular monolith; split only when there's a proven need |
| 3 | Not engaging a structural engineer for Torke Design | Calculation errors that are expensive to find and fix later | Budget for independent engineering review from the start |
| 4 | Skipping legal review of calculation software liability | Exposure to professional liability claims without insurance or adequate disclaimers | Get specialist legal advice before the first public calculation |
| 5 | Not defining the goods-in workflow in detail | WMS build goes in the wrong direction | Map the goods-in workflow on paper with a warehouse person before coding |
| 6 | Underestimating the e-commerce basics | 6 months spent on checkout, payments, and email before building the differentiating features | Use existing infrastructure (Stripe, headless commerce frameworks) for the basics |

### Phase 1: MVP and Launch

| # | Mistake | Consequence | Prevention |
|---|---------|-------------|------------|
| 1 | Launching without the cert chain working end-to-end | The core value proposition is broken on day one | Run 10 orders through the full flow (goods-in to cert pack delivery) before going live |
| 2 | Not testing with real contractors | Platform doesn't match how contractors actually buy | Recruit 3-5 beta contractors; watch them use it; fix what confuses them |
| 3 | Forcing digital adoption on acquired customers | Customer churn in the first 6 months | Maintain existing ordering channels; make digital an option, not a mandate |
| 4 | Going live without product liability insurance | One incident could end the business | Insurance in place before first sale |
| 5 | Launching Torke Design without independent calculation verification | Engineering errors that damage brand trust and create liability | No public release until a CEng has verified every calculation method |
| 6 | No fallback for system downtime | Can't fulfil orders if the platform goes down | Phone/email ordering process documented; manual cert pack generation possible |

### Phase 2: Growth and Scaling

| # | Mistake | Consequence | Prevention |
|---|---------|-------------|------------|
| 1 | Adding product categories without updating the calculation engine | Torke Design doesn't cover the products being sold | Align product roadmap with Torke Design development |
| 2 | Scaling the warehouse without scaling the goods-in process | Traceability becomes the bottleneck | Invest in goods-in efficiency (better scanning, pre-booking, auto cert matching) before scaling volume |
| 3 | Expanding to new customer segments without adapting the platform | Self-builders, small contractors, and main contractors have very different needs | Build separate user journeys or decide not to serve certain segments |
| 4 | Neglecting the cert archive as it grows | Storage costs surprise, access slows down, search becomes painful | Implement archive tiering and efficient search early; budget for ongoing storage |
| 5 | Ignoring regulatory changes (BSA secondary legislation, UKCA transitions) | Products or platform become non-compliant | Assign ongoing responsibility for regulatory monitoring; budget time for compliance updates |
| 6 | Trying to build fire/seismic calculation modules without deep specialist input | These are substantially more complex than static anchor design; errors have higher consequences | Budget for specialist engineering consultancy and extended verification for each new calculation module |

### Phase 3: Maturity and Expansion

| # | Mistake | Consequence | Prevention |
|---|---------|-------------|------------|
| 1 | Building a second acquisition on the assumption the first integration was easy | Every acquisition is different; the second may have worse data, different products, incompatible processes | Treat each acquisition as a new integration project with its own timeline and budget |
| 2 | Assuming the platform is "done" and reducing development investment | Competitors catch up, customers churn, regulations change | Maintain a product development team and roadmap even when the platform feels mature |
| 3 | Losing the engineering integrity of Torke Design under commercial pressure | Sales team pushing for faster/easier calculations that skip safety checks | Keep engineering verification independent from commercial decisions; the CEng reviewer should have veto power |
| 4 | Not preparing for internationalisation when expanding beyond UK | Date formats, units, standards (Eurocodes vs. other standards), languages, tax regimes | If international expansion is planned, build i18n capability early but don't prematurely optimise for it |

---

*This document should be reviewed and updated as the project progresses. Each pitfall should be tracked against the relevant project phase and revisited at phase transitions.*

*Last updated: 2026-03-04*
