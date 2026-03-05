---
phase: 03-torke-design
verified: 2026-03-05T00:00:00Z
status: passed
score: 19/19 must-haves verified
gaps: []
human_verification:
  - test: "Visit /design and run a calculation"
    expected: "3D model renders in right panel; changing inputs (diameter, embedment, pattern) updates 3D geometry in real time; utilisation bars appear below with correct green/amber/red colours"
    why_human: "WebGL rendering and real-time reactivity cannot be verified statically"
  - test: "Test OrbitControls in 3D scene"
    expected: "Mouse drag rotates, scroll wheel zooms, right-click drag pans the 3D model"
    why_human: "Browser interaction required"
  - test: "Export PDF as an authenticated user"
    expected: "PDF downloads with Torke red header bar, all inputs table, per-failure-mode sections with clause references, and summary page showing pass/fail and governing mode"
    why_human: "PDF visual quality and content correctness requires human review"
  - test: "Click Export PDF as an unauthenticated user"
    expected: "AuthGateModal opens; after sign-up, PDF export triggers automatically; /design/saved shows the saved calculation"
    why_human: "Auth flow and post-auth callback requires interactive testing"
  - test: "Add recommended product to cart from design tool"
    expected: "Cart item includes calcReference linking design to order; order placed from this cart has calcReference on its order lines"
    why_human: "End-to-end pipeline from design to order requires manual verification"
---

# Phase 3: Torke TRACE Verification Report

**Phase Goal:** Deliver the browser-based EN 1992-4 anchor calculation tool with 3D visualisation, PDF reports, and the design-to-order pipeline that connects calculations to the shop.
**Verified:** 2026-03-05
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `calculateAnchorDesign(inputs)` returns results with all 7 failure modes + combined interaction | VERIFIED | `src/lib/calc-engine/index.ts` L36-52 runs all 7 modes; L55 runs combined; test in `calc-engine.test.ts` asserts `failureModes.length === 7` |
| 2 | Each failure mode returns utilisation ratio (0-1), pass/fail, clause reference, formula, intermediate values | VERIFIED | `FailureModeResult` interface in `types.ts` defines all fields; `concrete-cone.ts` demonstrates full implementation with all required fields |
| 3 | Single anchor and group patterns (2x1, 2x2, 3x2) produce geometrically correct area ratios | VERIFIED | `geometry/projected-areas.ts` + `geometry/group-effects.ts` implement bounding-box-union-clip approach; `groups.test.ts` tests all patterns including symmetry assertions |
| 4 | Same inputs produce identical results in any JS runtime (deterministic, pure function) | VERIFIED | `deterministic.test.ts` exists; `calculateAnchorDesign` is a pure function with no side effects; `index.ts` has zero stateful dependencies |
| 5 | Scope limitations array always includes 'No seismic design' and 'No fire design' | VERIFIED | `constants.ts` L88-89 contains both strings; `index.ts` L80 spreads `SCOPE_LIMITATIONS` into every result |
| 6 | Input validation rejects invalid concrete classes, negative loads, zero embedment | VERIFIED | `validation.ts` uses Zod with `.min(40)` on embedmentDepth, `.min(0)` on loads, and `concreteClassSchema` enum |
| 7 | User can see the design page at /design without logging in | VERIFIED | `src/app/(design)/design/page.tsx` has no auth guard; `src/app/(design)/layout.tsx` exists |
| 8 | User can enter all EN 1992-4 input parameters via grouped collapsible sections | VERIFIED | `InputPanel.tsx` renders 6 section components (ProjectInfo, AnchorType, Concrete, Loads, Geometry, Environment); all sections exist under `src/components/design/sections/` |
| 9 | Input changes update the Zustand design store with localStorage persistence | VERIFIED | `design.ts` uses `zustand/persist` with `name: "torke-design"`; all sections read/write via `useDesignStore` |
| 10 | User sees a 3D interactive model that updates in real time | VERIFIED | `AnchorScene.tsx` uses R3F Canvas + OrbitControls; `AnchorGroup`, `BasePlate`, `ConcreteBlock` all use granular `useDesignStore` selectors; page.tsx has 300ms debounced recalculation wired to `setResults` |
| 11 | User sees utilisation bars (0-100%) with green/amber/red colouring and expandable detail | VERIFIED | `ResultsPanel.tsx` renders `FailureModeBar` + `FailureModeDetail` for each mode; colouring thresholds at 0.6/0.9 in `FailureModeBar.tsx` |
| 12 | Overall pass/fail status and governing failure mode shown | VERIFIED | `OverallStatus.tsx` reads `results.overallPass` and `results.governingMode` from design store |
| 13 | Scope limitations displayed in results | VERIFIED | `ResultsPanel.tsx` L39-54 renders amber banner with `results.scopeLimitations` bullet list |
| 14 | PDF report generates with Torke branding, all inputs, all failure mode sections with clause references, and summary page | VERIFIED | `calc-report-service.ts` is 625 lines; implements cover page, TOC, inputs table, per-mode sections, combined section, summary page; every page footer includes scope text |
| 15 | Server re-runs calculation before PDF generation and save | VERIFIED | `calculations.ts` L98-99 calls `calculateAnchorDesign(designInputs)` before insert; L189+ `exportPdf` does same before PDF generation |
| 16 | PDF export and save require authentication | VERIFIED | Both use `protectedProcedure` in `calculations.ts`; `ActionBar.tsx` checks `isAuthenticated` and opens `AuthGateModal` if not |
| 17 | After calculation, user sees 1-3 matching Torke product cards; user can add to cart with calcReference | VERIFIED | `ProductRecommendations.tsx` queries `trpc.products.list` with `categorySlug` and `diameter` filter; `handleAddToCart` passes `calcReference` from design store |
| 18 | Calculation reference linked to resulting order | VERIFIED | `order-service.ts` L207 passes `calcReference: line.calcReference ?? null` into `orderLines` insert; orders router accepts `calcReference` on cart items |
| 19 | Saved calculations page shows list with load/delete | VERIFIED | `src/app/(design)/design/saved/page.tsx` uses `trpc.calculations.list`, `trpc.calculations.delete`, and `utils.calculations.load.fetch` |

**Score:** 19/19 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/calc-engine/index.ts` | Public API: `calculateAnchorDesign(inputs)` | VERIFIED | Exports function + all types; imports all 8 failure mode modules |
| `src/lib/calc-engine/types.ts` | Type definitions: DesignInputs, DesignResults, FailureModeResult, etc. | VERIFIED | All 9 required exports present |
| `src/lib/calc-engine/constants.ts` | EN 1992-4 k-factors, concrete classes, partial safety factors | VERIFIED | CONCRETE_CLASSES, K1_FACTORS, PARTIAL_SAFETY_FACTORS, SCOPE_LIMITATIONS all present |
| `src/lib/calc-engine/validation.ts` | Zod schema for input validation | VERIFIED | `designInputsSchema` exported; validates all fields with correct constraints |
| `src/lib/calc-engine/presets.ts` | 3-5 starter configurations | VERIFIED | 5 presets (Blank, Single M12, 4-Bolt M16, 2-Bolt M20, 6-Bolt M24) |
| `src/lib/calc-engine/failure-modes/` | All 8 failure mode files | VERIFIED | steel-tension, steel-shear, concrete-cone, pull-out, concrete-pryout, concrete-edge, splitting, combined all exist with substantive EN 1992-4 implementations |
| `src/lib/calc-engine/geometry/projected-areas.ts` | Projected area calculation with edge clipping | VERIFIED | Rectangle-intersection approach with group bounding box |
| `src/lib/calc-engine/geometry/group-effects.ts` | Anchor position layouts for standard patterns | VERIFIED | `getAnchorPositions` covers single/2x1/2x2/3x2/custom |
| `src/stores/design.ts` | Zustand design store with inputs, results, setInput, loadPreset | VERIFIED | All actions present; persist middleware with `"torke-design"` key |
| `src/server/db/schema/calculations.ts` | Saved calculations table | VERIFIED | id, calcReference (unique), userId, projectName, engineerName, inputs (jsonb), results (jsonb), timestamps |
| `src/server/db/schema/orders.ts` | calcReference column on orderLines | VERIFIED | `calcReference: varchar("calc_reference", { length: 50 })` present |
| `src/components/design/InputPanel.tsx` | Left panel with 6 collapsible input sections | VERIFIED | All 6 sections imported and rendered |
| `src/app/(design)/design/page.tsx` | Design tool page at /design | VERIFIED | No auth guard; 3D scene, results panel, product recommendations, action bar all wired |
| `src/components/design-3d/AnchorScene.tsx` | R3F Canvas with lighting, camera, OrbitControls | VERIFIED | 116 lines; Canvas, OrbitControls, all sub-components rendered |
| `src/components/design-3d/BasePlate.tsx` | Extruded rectangular plate geometry | VERIFIED | Uses `useDesignStore` granular selectors for plate dimensions |
| `src/components/design-3d/AnchorBolt.tsx` | Cylindrical bolt with diameter and embedment | VERIFIED | Reads `anchorDiameter` and `embedmentDepth` from store |
| `src/components/design-3d/ConcreteBlock.tsx` | Semi-transparent concrete block | VERIFIED | Reads embedment + plate dimensions; transparent material |
| `src/components/design-3d/FailureCone.tsx` | Concrete cone breakout overlay, colour-coded | VERIFIED | Props: type, visible, utilisation; colour by utilisation threshold |
| `src/components/design/ResultsPanel.tsx` | Right-panel results with all failure mode bars | VERIFIED | 81 lines; reads store results; renders FailureModeBar + FailureModeDetail for all modes |
| `src/components/design/FailureModeBar.tsx` | Horizontal utilisation bar with expand/collapse | VERIFIED | Colour thresholds at 0.6/0.9; chevron toggle |
| `src/components/design/OverallStatus.tsx` | Overall pass/fail and governing mode display | VERIFIED | Reads `results.overallPass` and `results.governingMode` |
| `src/components/design/ActionBar.tsx` | Sticky Export PDF and Save Calculation buttons | VERIFIED | Both buttons call tRPC mutations; auth check opens AuthGateModal |
| `src/server/services/calc-report-service.ts` | PDF report generator using pdf-lib | VERIFIED | 625 lines; cover page, TOC, inputs summary, per-mode sections, summary page, footer with scope text |
| `src/server/trpc/routers/calculations.ts` | tRPC router for save/load/export calculations | VERIFIED | save, load, list, exportPdf, delete procedures — all protectedProcedure |
| `src/components/design/ProductRecommendations.tsx` | Inline product cards matching calculation parameters | VERIFIED | 204 lines; queries `trpc.products.list` with categorySlug + diameter; passes calcReference to cart |
| `src/components/design/AuthGateModal.tsx` | Inline sign-up/login modal for save/export gating | VERIFIED | Dialog with signup/signin toggle; calls `signUp.email` / `signIn.email` from auth-client |
| `src/app/(design)/design/saved/page.tsx` | Saved calculations list page | VERIFIED | Auth-guards with redirect; lists, loads, and deletes calculations |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/calc-engine/index.ts` | `failure-modes/*.ts` | imports each failure mode | WIRED | L14-21: 8 named imports from failure-modes directory |
| `concrete-cone.ts` | `geometry/projected-areas.ts` | uses `calculateProjectedArea` | WIRED | L14-17 import; L34-39 used in calculation |
| `design.ts` | `calc-engine/types.ts` | imports `DesignInputs` type | WIRED | L5: `import type { DesignInputs, DesignResults } from "@/lib/calc-engine/types"` |
| `InputPanel.tsx` | `design.ts` | reads/writes `useDesignStore` | WIRED | L10 import; L19 `loadPreset`; all 6 sections use store |
| `src/stores/cart.ts` | `CartItem.calcReference` | optional field | WIRED | L12: `calcReference?: string`; L57 passed on addItem |
| `AnchorScene.tsx` | `design.ts` | Zustand selectors | WIRED | Sub-components (AnchorBolt, ConcreteBlock, AnchorGroup) all use `useDesignStore` granular selectors |
| `design/page.tsx` | `AnchorScene.tsx` | rendered in right panel | WIRED | L14-30 dynamic import with `ssr: false`; rendered at L129 |
| `ResultsPanel.tsx` | `design.ts` | reads results from store | WIRED | L10: `useDesignStore((s) => s.results)` |
| `FailureModeBar.tsx` | `calc-engine/types.ts` | renders FailureModeResult | WIRED | L4: `import type { FailureModeResult }` |
| `calculations.ts` (router) | `calc-engine/index.ts` | re-runs `calculateAnchorDesign` | WIRED | L12 import; L99 server-side execution before save; L193+ before PDF |
| `calculations.ts` (router) | `calc-report-service.ts` | calls `generateCalcReport` | WIRED | L14 import; L223 call in `exportPdf` procedure |
| `calculations.ts` (router) | `db/schema/calculations.ts` | CRUD on calculations table | WIRED | L11 import; L105 insert, L142-153 select |
| `ProductRecommendations.tsx` | `products.ts` router | queries products by anchor type/diameter | WIRED | L40: `trpc.products.list.useQuery` with `categorySlug` + `diameter` |
| `ProductRecommendations.tsx` | `cart.ts` | `addItem` with calcReference | WIRED | L31 import; L68-75 `addItem({ ..., calcReference })` |
| `AuthGateModal.tsx` | `auth-client.ts` | `signUp`/`signIn` | WIRED | L11: `import { signUp, signIn } from "@/lib/auth-client"`; L46 and L59 used in handler |
| `calculationsRouter` | `router.ts` (main) | registered in app router | WIRED | `router.ts` L8 import; L20 `calculations: calculationsRouter` |
| `order-service.ts` | `orderLines` insert | passes `calcReference` | WIRED | L207: `calcReference: line.calcReference ?? null` spreads into order line insert |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| DESIGN-01 | Plan 01 | User can design a post-installed anchor connection to EN 1992-4 | SATISFIED | `calculateAnchorDesign` implements full EN 1992-4 check; `/design` page accessible |
| DESIGN-02 | Plan 01, 02 | User can input all specified parameters | SATISFIED | All 15+ input fields in `DesignInputs` interface; all rendered in 6 InputPanel sections |
| DESIGN-03 | Plan 01 | System checks all required failure modes | SATISFIED | 7 failure modes + combined interaction confirmed in `index.ts` and tests |
| DESIGN-04 | Plan 04 | System displays utilisation ratio for each failure mode | SATISFIED | `FailureModeBar` renders utilisation percentage with colour coding |
| DESIGN-05 | Plan 01 | System supports single anchors and anchor groups | SATISFIED | GroupPattern type covers single/2x1/2x2/3x2; geometry module handles all |
| DESIGN-06 | Plan 05 | Calc engine runs client-side; server re-runs for report generation | SATISFIED | Client: `page.tsx` L55 calls `calculateAnchorDesign`; server: `calculations.ts` L99, L193 re-run before save/export |
| DESIGN-07 | Plan 01, 04, 05 | Scope limitations clearly stated on every output | SATISFIED | SCOPE_LIMITATIONS in constants; embedded in every DesignResults; shown in ResultsPanel banner, ActionBar disclaimer, and PDF footer |
| DESIGN-08 | Plan 03 | User can see 3D interactive WebGL visualisation (R3F) | SATISFIED | `AnchorScene.tsx` uses `@react-three/fiber` Canvas |
| DESIGN-09 | Plan 03 | 3D model updates in real time as parameters change | SATISFIED | All 3D components use granular Zustand selectors; `page.tsx` debounced recalculation on every input change |
| DESIGN-10 | Plan 03 | User can rotate, zoom, and pan the 3D model | SATISFIED | `OrbitControls` from `@react-three/drei` with `enableDamping` at `AnchorScene.tsx` L73 |
| DESIGN-11 | Plan 05 | User can export a PDF with Torke branding and project info | SATISFIED | `calc-report-service.ts` 625 lines; red header bar, project info, Torke branding on cover page |
| DESIGN-12 | Plan 05 | PDF includes all inputs, all failure mode results with clause references | SATISFIED | Per-mode sections with clause ref and intermediate values table; inputs summary page |
| DESIGN-13 | Plan 05 | PDF includes summary pass/fail and governing failure mode | SATISFIED | Summary page renders all modes with governing mode highlighted and overall PASS/FAIL |
| DESIGN-14 | Plan 06 | Calculation output recommends matching Torke products | SATISFIED | `ProductRecommendations.tsx` queries same product DB by anchor type + diameter |
| DESIGN-15 | Plan 06 | User can add recommended product to basket from calculation result | SATISFIED | "Add to Cart" button calls `useCartStore.addItem` with quantity pre-filled from group size |
| DESIGN-16 | Plan 06 | Calculation reference linked to resulting order | SATISFIED | `calcReference` flows: design store → cart item → order router input → `order-service.ts` L207 → orderLines DB column |
| DESIGN-17 | Plan 02 | User can perform calculations without logging in | SATISFIED | `/design` page has no auth guard; `calculateAnchorDesign` runs client-side unconditionally |
| DESIGN-18 | Plan 05, 06 | User must create account to save or export | SATISFIED | All calculations router procedures use `protectedProcedure`; ActionBar gates behind `AuthGateModal` |
| DESIGN-19 | Plan 06 | Torke TRACE uses same product database as e-commerce | SATISFIED | `ProductRecommendations.tsx` queries `trpc.products.list` — the identical products tRPC router used by e-commerce |

**All 19 Phase 3 requirements (DESIGN-01 through DESIGN-19) are SATISFIED.**

No orphaned requirements detected. The traceability table in REQUIREMENTS.md maps exactly DESIGN-01 to DESIGN-19 to Phase 3, all of which are covered by Plans 01-06.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None found | — | — | — |

Scan performed across `src/lib/calc-engine/`, `src/components/design/`, `src/components/design-3d/`, and `src/server/services/calc-report-service.ts`. The only `placeholder` occurrences are HTML `placeholder=""` attributes on input fields — appropriate and not code stubs. `return null` appears only as legitimate conditional renders when `results` is not yet available.

---

## Human Verification Required

### 1. 3D Scene Renders Correctly

**Test:** Open `/design` in a browser; change anchor diameter, embedment depth, and group pattern
**Expected:** 3D model updates in real time showing correct bolt geometry, plate size, and number of bolts; concrete block is semi-transparent; dimension annotations show correct values
**Why human:** WebGL rendering and real-time reactivity cannot be verified statically

### 2. OrbitControls Interaction

**Test:** On the 3D scene, left-drag, scroll, and right-drag
**Expected:** Left-drag rotates model, scroll zooms in/out, right-drag pans
**Why human:** Browser mouse interaction required

### 3. PDF Report Visual Quality

**Test:** Authenticate, run a calculation, click "Export PDF"
**Expected:** PDF opens with Torke red header bar on cover, project name and engineer name on cover, one section per failure mode with EN 1992-4 clause reference (e.g. "EN 1992-4 Cl. 7.2.1.4"), intermediate values table, summary page with highlighted governing mode, scope limitations in every page footer
**Why human:** PDF content and layout quality requires visual review

### 4. Auth Gate Preserves Calculation State

**Test:** Without logging in, run a calculation, click "Export PDF", complete sign-up in the modal
**Expected:** Modal closes, PDF export triggers automatically, calculation inputs are unchanged
**Why human:** Auth flow and post-auth callback behaviour requires interactive testing

### 5. Design-to-Order Pipeline End-to-End

**Test:** Run a calculation for M16 chemical anchor; add recommended product to cart; complete checkout; check order lines in WMS or admin
**Expected:** Order line has `calc_reference` populated matching the design; cert pack for that order references the calculation
**Why human:** End-to-end pipeline across design, cart, checkout, and WMS requires manual verification

---

## Summary

Phase 3 goal is fully achieved. All 19 DESIGN requirements are implemented and wired:

**Calculation engine (Plans 01):** Pure TypeScript EN 1992-4 engine with all 7 failure modes plus combined interaction, Zod validation, deterministic pure-function design, and scope limitations embedded in every result.

**Input UI and data layer (Plan 02):** `/design` page accessible without login; all 15+ EN 1992-4 input fields present across 6 collapsible sections; Zustand store with localStorage persistence; `calculations` DB table and `calcReference` column on `orderLines` ready.

**3D visualisation (Plan 03):** React Three Fiber Canvas with OrbitControls (rotate/zoom/pan); parametric geometry (plate, bolts, concrete block) driven by design store selectors; failure cone overlays toggleable and colour-coded by utilisation; lazy-loaded with `next/dynamic, ssr: false`.

**Results panel (Plan 04):** Utilisation bars per failure mode with green/amber/red colouring; expandable detail with clause references, formulas, and intermediate values; overall pass/fail with governing mode; scope limitations banner; sticky action bar.

**PDF reports and save/load (Plan 05):** 625-line `calc-report-service.ts` generates multi-page PDFs with Torke branding; server-side re-execution validates integrity before save/export; all operations behind authentication.

**Design-to-order pipeline (Plan 06):** Product recommendations query the same product database as e-commerce; `calcReference` flows from design store through cart items into order lines; `AuthGateModal` gates save/export behind inline sign-up while preserving calculation state; saved calculations page with load/delete.

---

_Verified: 2026-03-05_
_Verifier: Claude (gsd-verifier)_
