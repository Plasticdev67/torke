# Phase 3: Torke TRACE - Research

**Researched:** 2026-03-05
**Domain:** EN 1992-4 anchor calculation engine, 3D WebGL visualisation, PDF engineering reports, design-to-order pipeline
**Confidence:** HIGH

## Summary

Phase 3 delivers the browser-based EN 1992-4 anchor design tool -- the core differentiator for Torke. The implementation spans four distinct domains: (1) a pure TypeScript calculation engine implementing all EN 1992-4 failure modes, (2) a React Three Fiber 3D visualisation with dimension annotations and failure cone overlays, (3) a pdf-lib-based engineering report generator following the established project pattern, and (4) a design-to-order pipeline connecting calculations to the existing e-commerce cart.

The calc engine is the highest-risk component. EN 1992-4 defines 7 failure modes plus combined interaction checks, each with multi-factor formulas involving geometric modification factors (psi factors), projected area ratios, and concrete/steel material properties. The engine must be a standalone library (`@torke/calc-engine`) with comprehensive regression tests validated against PROFIS outputs and Eurocode worked examples. Client-side execution provides instant feedback; server-side re-execution validates integrity before PDF generation.

**Primary recommendation:** Build the calc engine as a pure TypeScript library with zero UI dependencies, exhaustively tested against known PROFIS outputs, then layer the UI (split-panel + R3F + PDF) on top. Use the existing pdf-lib pattern from certpack-service.ts and invoice-service.ts for report generation. Use React Three Fiber v9 with drei for the 3D scene.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Split-panel layout: inputs on the left (scrollable), 3D model + results on the right
- Live updates: results and 3D model update in real time as parameters change (debounced ~300ms)
- Inputs grouped in collapsible sections: Project Info, Anchor Type, Concrete, Loads, Geometry, Environment -- all expanded by default
- Presets available: 3-5 common starting points plus blank slate
- Schematic/technical illustration style 3D -- not photorealistic
- Concrete block rendered semi-transparent so bolt embedment is visible
- Dimension annotations always visible on 3D model (toggleable if cluttered)
- Failure mode cones toggleable per failure mode, colour-coded by utilisation (green/amber/red)
- React Three Fiber for WebGL rendering
- Utilisation ratios as horizontal bars (0-100%) with green/amber/red colour transitions
- Clicking a bar expands to show full calculation breakdown with EN 1992-4 clause references
- Overall pass/fail status and governing failure mode at bottom of results
- Sticky action bar: "Export PDF" and "Save Calculation" buttons always visible
- Traditional engineering calculation report format (not screen mirror)
- Cover page, TOC, inputs summary, per-failure-mode sections with formulas/clauses, summary page
- Scope limitations clearly stated on every output (no seismic, no fire)
- Inline product cards below results: "Recommended Products" showing 1-3 matching Torke products
- Quantity pre-filled from anchor group size
- Calculation reference (CALC-2026-NNNNNN) visible on order line item and cert pack
- "Add to Cart" uses existing cart store from Phase 2
- Calculations work without login -- no friction
- Inline sign-up modal when unauthenticated user tries to save or export
- Same Better Auth system as the shop

### Claude's Discretion
- Calc engine library structure and internal architecture (@torke/calc-engine)
- React Three Fiber scene setup, lighting, camera defaults
- Debounce timing and performance optimisation strategy
- Loading states and skeleton UI during calculation
- Exact preset configurations and which common connections to include
- Mobile responsive behaviour (likely simplified view without 3D on small screens)
- Saved calculations list/management UI

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DESIGN-01 | Design a post-installed anchor connection to EN 1992-4 | Calc engine architecture, EN 1992-4 failure mode formulas |
| DESIGN-02 | Input: anchor type, concrete class, cracked/uncracked, loads, edge distances, spacing, embedment, environment | Input parameter types and validation rules |
| DESIGN-03 | Check all failure modes: steel tension/shear, cone breakout, pull-out, pryout, edge breakout, splitting, combined interaction | Complete formula set with clause references below |
| DESIGN-04 | Display utilisation ratio (0-100%) per failure mode with pass/fail | Utilisation = NEd/NRd or VEd/VRd as percentage |
| DESIGN-05 | Support single anchors and anchor groups (2, 4, 6+ patterns) | Group factors: Ac,N/Ac,N^0 area ratios, eccentricity factors |
| DESIGN-06 | Client-side instant feedback + server-side re-run for validation | Pure TS library runs in both environments |
| DESIGN-07 | Scope limitations clearly stated | Hardcoded disclaimer on all outputs |
| DESIGN-08 | 3D interactive WebGL visualisation (React Three Fiber) | R3F v9 + drei v10, schematic rendering approach |
| DESIGN-09 | 3D model updates in real time with parameter changes | React state drives R3F scene, debounced updates |
| DESIGN-10 | Rotate, zoom, pan the 3D model | drei OrbitControls |
| DESIGN-11 | Export PDF calculation report with Torke branding | pdf-lib following existing certpack/invoice pattern |
| DESIGN-12 | PDF includes all inputs, all results, inline Eurocode clause refs | Multi-section report structure |
| DESIGN-13 | PDF includes summary pass/fail and governing failure mode | Summary page pattern |
| DESIGN-14 | Recommend matching Torke products from calculation output | Product query by anchor type + diameter |
| DESIGN-15 | Add recommended product to basket from calculation result | Existing useCartStore with calcReference extension |
| DESIGN-16 | Calculation reference linked to resulting order | New calcReference column on orderLines |
| DESIGN-17 | Calculations work without login | No auth guard on /design route or calc engine |
| DESIGN-18 | Free account required to save or export PDF | Auth gate on save/export actions only |
| DESIGN-19 | Same product database as e-commerce catalogue | Existing products table and tRPC product queries |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-three/fiber | ^9.5.0 | React renderer for Three.js | Standard R3F for React 19, declarative 3D |
| @react-three/drei | ^10.7.7 | R3F helper components (OrbitControls, Html, Line) | De facto companion lib for R3F |
| three | ^0.172.0 | 3D rendering engine (peer dep of R3F) | Required peer dependency |
| pdf-lib | ^1.17.1 | PDF generation (already installed) | Already used for certpack + invoice; zero native deps |
| react-hook-form | ^7.71.2 | Form state management (already installed) | Already used project-wide for forms |
| zod | ^4.3.6 | Input validation (already installed) | Already used project-wide |
| zustand | ^5.0.11 | Client state for calc inputs/results (already installed) | Already used for cart store |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-three/drei Html | (included) | HTML overlay annotations on 3D model | Dimension labels, failure mode labels |
| @react-three/drei Line | (included) | Dimension lines in 3D space | Edge distance / spacing dimension lines |
| @react-three/drei OrbitControls | (included) | Camera orbit/zoom/pan | DESIGN-10 interactive camera |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pdf-lib | pdfmake | pdfmake has declarative table API but would add a new dependency; pdf-lib already proven in this codebase |
| Custom 3D geometry | Pre-built GLTF models | GLTF adds asset management; parametric geometry from code is better for live updates |
| Separate calc API | tRPC mutation | tRPC mutation for server-side validation is correct; but core engine must be importable directly |

**Installation:**
```bash
npm install @react-three/fiber @react-three/drei three @types/three
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    calc-engine/              # @torke/calc-engine - pure TS, zero UI deps
      index.ts                # Public API: calculateAnchorDesign(inputs) => results
      types.ts                # Input/output type definitions
      constants.ts            # EN 1992-4 k-factors, concrete classes, partial safety factors
      failure-modes/
        steel-tension.ts      # NRk,s = c * As * fuk (Cl. 7.2.1.3)
        steel-shear.ts        # VRk,s (Cl. 7.2.2.3)
        concrete-cone.ts      # NRk,c with psi factors (Cl. 7.2.1.4)
        pull-out.ts           # NRk,p (Cl. 7.2.1.5)
        concrete-pryout.ts    # VRk,cp = k * NRk,c (Cl. 7.2.2.4)
        concrete-edge.ts      # VRk,c with psi factors (Cl. 7.2.2.5)
        splitting.ts          # NRk,sp (Cl. 7.2.1.6)
        combined.ts           # Tension-shear interaction (Table 7.3)
      geometry/
        projected-areas.ts    # Ac,N, Ac,V area calculations
        group-effects.ts      # Anchor group geometry, eccentricity
      validation.ts           # Input validation with Zod
      presets.ts              # 3-5 starter configurations
  components/
    design/
      DesignPage.tsx          # Split-panel layout container
      InputPanel.tsx          # Left panel with collapsible sections
      ResultsPanel.tsx        # Utilisation bars, expandable breakdowns
      ProductRecommendations.tsx  # Inline product cards
      ActionBar.tsx           # Sticky Export PDF / Save buttons
      AuthGateModal.tsx       # Sign-up modal for unauthenticated save/export
      sections/               # Individual input section components
        ProjectInfoSection.tsx
        AnchorTypeSection.tsx
        ConcreteSection.tsx
        LoadsSection.tsx
        GeometrySection.tsx
        EnvironmentSection.tsx
    design-3d/
      AnchorScene.tsx         # Canvas + lighting + camera
      BasePlate.tsx           # Extruded plate geometry
      AnchorBolt.tsx          # Cylindrical bolt with embedment
      ConcreteBlock.tsx       # Semi-transparent concrete
      DimensionAnnotation.tsx # Edge distance / spacing labels
      FailureCone.tsx         # Toggleable breakout cone overlay
      UtilisationOverlay.tsx  # Colour-coded cone surfaces
  stores/
    design.ts                 # Zustand store for calc inputs + results
  server/
    trpc/routers/
      calculations.ts         # Save/load calculations, server-side validation
    db/schema/
      calculations.ts         # Saved calculations table
    services/
      calc-report-service.ts  # PDF report generation (pdf-lib)
  app/
    (design)/                 # Route group for /design
      design/
        page.tsx              # Main design tool page
        saved/
          page.tsx            # Saved calculations list (authenticated)
```

### Pattern 1: Pure Calc Engine with No Side Effects
**What:** The calc engine is a pure function: `calculateAnchorDesign(inputs: DesignInputs): DesignResults`. No React, no database, no API calls. Takes typed inputs, returns typed results with all failure mode checks, utilisation ratios, and intermediate calculation values.
**When to use:** Always. This is the foundational pattern for the entire phase.
**Example:**
```typescript
// src/lib/calc-engine/types.ts
export interface DesignInputs {
  anchorType: 'chemical' | 'mechanical';
  anchorDiameter: number;        // mm
  embedmentDepth: number;        // mm (hef)
  concreteClass: ConcreteClass;  // e.g. 'C30/37'
  crackedConcrete: boolean;
  tensionLoad: number;           // kN (NEd)
  shearLoad: number;             // kN (VEd)
  edgeDistances: EdgeDistances;  // c1, c2 in mm
  spacing: AnchorSpacing;        // s1, s2 in mm
  groupPattern: GroupPattern;    // single, 2x1, 2x2, 3x2, etc.
  steelGrade: SteelGrade;
  environment: 'dry' | 'humid' | 'marine';
  plateThickness: number;        // mm
  plateWidth: number;            // mm
  plateDepth: number;            // mm
}

export type ConcreteClass =
  | 'C20/25' | 'C25/30' | 'C30/37' | 'C35/45'
  | 'C40/50' | 'C45/55' | 'C50/60';

export interface FailureModeResult {
  name: string;
  clauseRef: string;           // e.g. "EN 1992-4 Cl. 7.2.1.4"
  designLoad: number;          // kN
  designResistance: number;    // kN
  utilisation: number;         // 0-1 (displayed as 0-100%)
  pass: boolean;
  intermediateValues: Record<string, { label: string; value: number; unit: string }>;
  formula: string;             // LaTeX or plain text formula
}

export interface DesignResults {
  failureModes: FailureModeResult[];
  combinedInteraction: FailureModeResult;
  overallPass: boolean;
  governingMode: string;
  governingUtilisation: number;
  scopeLimitations: string[];
}
```

### Pattern 2: Reactive Calc Pipeline (Input -> Debounce -> Calc -> UI Update)
**What:** Zustand store holds inputs. On change, debounced recalculation triggers. Results flow to both the results panel and R3F scene.
**When to use:** For the live-update behaviour required by DESIGN-06/09.
**Example:**
```typescript
// src/stores/design.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DesignInputs, DesignResults } from '@/lib/calc-engine/types';
import { calculateAnchorDesign } from '@/lib/calc-engine';

interface DesignState {
  inputs: DesignInputs;
  results: DesignResults | null;
  isCalculating: boolean;
  setInput: <K extends keyof DesignInputs>(key: K, value: DesignInputs[K]) => void;
  setInputs: (partial: Partial<DesignInputs>) => void;
  loadPreset: (preset: Partial<DesignInputs>) => void;
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      inputs: DEFAULT_INPUTS,
      results: null,
      isCalculating: false,
      setInput: (key, value) => {
        set((state) => ({
          inputs: { ...state.inputs, [key]: value },
        }));
        // Debounced recalculation handled by useEffect in DesignPage
      },
      setInputs: (partial) => {
        set((state) => ({
          inputs: { ...state.inputs, ...partial },
        }));
      },
      loadPreset: (preset) => {
        set((state) => ({
          inputs: { ...DEFAULT_INPUTS, ...preset },
        }));
      },
    }),
    { name: 'torke-design' }
  )
);
```

### Pattern 3: R3F Parametric Geometry from Calc Inputs
**What:** 3D scene components read from the design store and generate geometry procedurally. No GLTF files needed -- everything is boxes, cylinders, and cones driven by input parameters.
**When to use:** For all 3D model components.
**Example:**
```typescript
// src/components/design-3d/AnchorBolt.tsx
import { useDesignStore } from '@/stores/design';

export function AnchorBolt({ index, position }: { index: number; position: [number, number, number] }) {
  const diameter = useDesignStore((s) => s.inputs.anchorDiameter);
  const embedment = useDesignStore((s) => s.inputs.embedmentDepth);
  const radius = diameter / 2 / 1000; // Convert mm to scene units (metres)
  const height = embedment / 1000;

  return (
    <mesh position={position}>
      <cylinderGeometry args={[radius, radius, height, 16]} />
      <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.3} />
    </mesh>
  );
}
```

### Pattern 4: Server-Side Validation Before PDF
**What:** When user exports PDF, a tRPC mutation re-runs the calc engine server-side with the same inputs. If results match, generate PDF. If they don't, flag tampering.
**When to use:** For DESIGN-06 server-side validation.
**Example:**
```typescript
// In calculations.ts tRPC router
exportPdf: protectedProcedure
  .input(designInputsSchema)
  .mutation(async ({ input, ctx }) => {
    // Re-run calc server-side
    const serverResults = calculateAnchorDesign(input);
    // Generate PDF with validated results
    const pdfBytes = await generateCalcReport(input, serverResults, ctx.session.user);
    // Upload to R2
    const key = `calc-reports/${calcRef}.pdf`;
    await uploadFile(key, Buffer.from(pdfBytes));
    return { downloadUrl: await getSignedUrl(key) };
  }),
```

### Anti-Patterns to Avoid
- **Mixing calc logic with UI state:** The calc engine must be a pure function library. No React hooks, no stores, no API calls inside the engine.
- **Hardcoding formulas without clause references:** Every formula implementation must reference its EN 1992-4 clause number in comments and expose it in the result object.
- **Loading 3D models from files:** For parametric engineering visualisation, procedural geometry from code is far better than GLTF imports. Parameters change continuously; regenerating geometry from dimensions is trivial with R3F.
- **Generating PDF on the client:** PDF generation should be server-side only (via tRPC mutation) to prevent tampering and to keep the pdf-lib bundle out of the client.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 3D camera controls | Custom mouse/touch handlers | drei OrbitControls | Handles all edge cases: touch, pinch, momentum, limits |
| HTML overlays in 3D | Manual CSS positioning | drei Html component | Auto-projects 3D position to screen coordinates |
| Dimension lines | Custom line drawing | drei Line + Html | Combines 3D lines with positioned text labels |
| Form state management | useState per field | react-hook-form + zod | 20+ input fields need validation, error state, dirty tracking |
| PDF tables | Manual x/y coordinate math | Extract existing helper pattern from certpack/invoice | Reuse the table-drawing helpers already in the codebase |
| Debouncing | setTimeout wrappers | A small useDebouncedCallback hook or zustand middleware | Proper cleanup on unmount, correct stale closure handling |
| Auth check for save/export | Manual session checks | useSession() from Better Auth (already in project) | Consistent with existing auth pattern |

**Key insight:** The existing codebase already solves PDF generation (pdf-lib), auth (Better Auth), cart (Zustand), forms (react-hook-form), and API (tRPC). This phase adds only two genuinely new domains: the EN 1992-4 calc engine and the R3F 3D scene.

## Common Pitfalls

### Pitfall 1: Incorrect Partial Safety Factors
**What goes wrong:** Using gamma_Mc = 1.5 for all failure modes when different values apply to different modes and different anchor qualifications.
**Why it happens:** EN 1992-4 Table 4.1 has different gamma values for steel (gamma_Ms) vs concrete (gamma_Mc) failure modes.
**How to avoid:** Create a constants file mapping each failure mode to its correct partial safety factor. Steel failure gamma_Ms = 1.2 (ductile) or 1.5 (brittle). Concrete failure gamma_Mc = 1.5 (cracked) or 1.8 (non-cracked where relevant).
**Warning signs:** Results not matching PROFIS validation cases.

### Pitfall 2: Projected Area Calculations for Groups Near Edges
**What goes wrong:** The Ac,N / Ac,N^0 ratio is wrong for anchor groups near edges where individual cones overlap and are truncated.
**Why it happens:** The projected area must account for both overlap between anchors AND edge truncation simultaneously. This is geometrically complex for asymmetric groups.
**How to avoid:** Implement projected area as a geometric calculation (rectangle intersection), not a lookup table. Test extensively with edge cases: single anchor at edge, 4-bolt group at corner, asymmetric edge distances.
**Warning signs:** Cone breakout utilisation doesn't match PROFIS for edge/corner cases.

### Pitfall 3: R3F Performance with Live Updates
**What goes wrong:** Re-rendering the entire 3D scene on every keystroke causes jank.
**Why it happens:** React re-renders propagate into the R3F tree if store selectors are too broad.
**How to avoid:** Use granular Zustand selectors (select individual fields, not the whole inputs object). Debounce input changes at 300ms. Use React.memo on geometry components. The R3F Canvas has its own render loop -- only React reconciliation costs matter.
**Warning signs:** Visible lag when typing in input fields.

### Pitfall 4: pdf-lib Font Embedding for Engineering Symbols
**What goes wrong:** EN 1992-4 formulas use Greek letters (psi, gamma), subscripts, and superscripts that StandardFonts don't render.
**Why it happens:** pdf-lib StandardFonts (Helvetica, Times) have limited character coverage.
**How to avoid:** Use plain text representations of formulas in the PDF (e.g., "psi_s,N" not "psi_s,N"). For the formula display, use descriptive text rather than trying to render mathematical notation. The existing certpack/invoice services use StandardFonts successfully -- follow the same approach.
**Warning signs:** Missing or garbled characters in PDF output.

### Pitfall 5: Splitting Failure Mode Complexity
**What goes wrong:** Splitting is the most complex failure mode and depends on manufacturer-specific data from ETAs.
**Why it happens:** EN 1992-4 Cl. 7.2.1.6 requires minimum member thickness and edge distance values from the product ETA, which vary by product.
**How to avoid:** For v1, implement splitting as a simplified check using the minimum values from EN 1992-4 Table 7.2 (generic values for post-installed anchors). Flag that product-specific ETA values may give different results. This aligns with DESIGN-07 scope limitations.
**Warning signs:** Splitting results that are overly conservative compared to PROFIS (which uses product-specific ETA data).

### Pitfall 6: Cart Integration -- Missing calcReference Field
**What goes wrong:** Adding a product to cart from the design tool doesn't carry the calculation reference through to the order.
**Why it happens:** The existing CartItem interface doesn't have a calcReference field.
**How to avoid:** Extend CartItem interface to include optional `calcReference?: string`. Add a `calcReference` column to orderLines schema. Wire the reference through the entire chain: cart -> order creation -> cert pack.
**Warning signs:** Orders placed from the design tool have no link back to the calculation.

## Code Examples

### EN 1992-4 Concrete Cone Breakout (Cl. 7.2.1.4)
```typescript
// src/lib/calc-engine/failure-modes/concrete-cone.ts
// Source: EN 1992-4:2018 Clause 7.2.1.4

interface ConeConeInputs {
  hef: number;        // Embedment depth (mm)
  fck: number;        // Characteristic concrete strength (MPa)
  cracked: boolean;
  edgeDistances: { c1: number; c2: number; c3?: number; c4?: number }; // mm
  spacing: { s1?: number; s2?: number }; // mm between anchors
  numAnchors: number;
}

interface ConeBreakoutResult {
  NRk_c_0: number;    // Single anchor, uninfluenced (kN)
  Ac_N: number;       // Actual projected area (mm^2)
  Ac_N_0: number;     // Reference projected area (mm^2)
  psi_s_N: number;    // Edge effect factor
  psi_re_N: number;   // Shell spalling factor
  psi_ec_N: number;   // Eccentricity factor
  NRk_c: number;      // Characteristic resistance (kN)
  NRd_c: number;      // Design resistance (kN)
}

export function concreteConeBreakout(inputs: ConeConeInputs): ConeBreakoutResult {
  const { hef, fck, cracked, edgeDistances, spacing, numAnchors } = inputs;

  // k1 factor: EN 1992-4 Cl. 7.2.1.4, Table 7.1
  // Post-installed: 7.7 (cracked), 11.0 (uncracked)
  const k1 = cracked ? 7.7 : 11.0;

  // Base resistance: N^0_Rk,c = k1 * sqrt(fck) * hef^1.5
  const NRk_c_0 = k1 * Math.sqrt(fck) * Math.pow(hef, 1.5) / 1000; // Convert N to kN

  // Reference projected area: A^0_c,N = s_cr,N^2 = (3 * hef)^2
  const s_cr_N = 3 * hef;
  const Ac_N_0 = s_cr_N * s_cr_N;

  // Actual projected area: geometric calculation considering edges and spacing
  const Ac_N = calculateProjectedArea(hef, edgeDistances, spacing, numAnchors);

  // Edge effect factor: psi_s,N = 0.7 + 0.3 * c / c_cr,N where c_cr,N = 1.5 * hef
  const c_cr_N = 1.5 * hef;
  const cMin = Math.min(edgeDistances.c1, edgeDistances.c2, edgeDistances.c3 ?? Infinity, edgeDistances.c4 ?? Infinity);
  const psi_s_N = Math.min(1.0, 0.7 + 0.3 * cMin / c_cr_N);

  // Shell spalling factor: psi_re,N = 0.5 + hef/200 <= 1.0
  const psi_re_N = Math.min(1.0, 0.5 + hef / 200);

  // Eccentricity factor (single anchor or concentric group = 1.0)
  const psi_ec_N = 1.0; // Simplified for concentric loading

  // Characteristic resistance
  const NRk_c = NRk_c_0 * (Ac_N / Ac_N_0) * psi_s_N * psi_re_N * psi_ec_N;

  // Design resistance: gamma_Mc = 1.5 for concrete failure
  const gamma_Mc = 1.5;
  const NRd_c = NRk_c / gamma_Mc;

  return { NRk_c_0, Ac_N, Ac_N_0, psi_s_N, psi_re_N, psi_ec_N, NRk_c, NRd_c };
}
```

### R3F Scene with Parametric Anchor Model
```typescript
// src/components/design-3d/AnchorScene.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import { useDesignStore } from '@/stores/design';

export function AnchorScene() {
  return (
    <Canvas camera={{ position: [0.3, 0.3, 0.3], fov: 50 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <ConcreteBlock />
      <BasePlate />
      <AnchorBolts />
      <DimensionAnnotations />
      <FailureCones />
      <OrbitControls enableDamping dampingFactor={0.1} />
    </Canvas>
  );
}

function ConcreteBlock() {
  const hef = useDesignStore((s) => s.inputs.embedmentDepth);
  const scale = 1 / 1000; // mm to scene metres
  const blockSize = hef * 2 * scale; // Proportional to embedment

  return (
    <mesh position={[0, -blockSize / 2, 0]}>
      <boxGeometry args={[blockSize * 1.5, blockSize, blockSize * 1.5]} />
      <meshStandardMaterial color="#999999" transparent opacity={0.3} side={2} />
    </mesh>
  );
}
```

### PDF Report Generation (following existing pattern)
```typescript
// src/server/services/calc-report-service.ts
import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from 'pdf-lib';

// Reuse established constants from certpack/invoice services
const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const MARGIN = 50;
const TORKE_RED = rgb(196 / 255, 30 / 255, 58 / 255);

export async function generateCalcReport(
  inputs: DesignInputs,
  results: DesignResults,
  user: { name: string; email: string },
  calcReference: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Cover page with Torke branding
  drawCoverPage(doc, { calcReference, projectInfo: inputs, user, helvetica, helveticaBold });

  // Page 2: Table of contents
  drawTableOfContents(doc, results, helvetica, helveticaBold);

  // Page 3: Inputs summary table
  drawInputsSummary(doc, inputs, helvetica, helveticaBold);

  // Pages 4+: One page per failure mode
  for (const mode of results.failureModes) {
    drawFailureModeSection(doc, mode, helvetica, helveticaBold);
  }

  // Combined interaction page
  drawFailureModeSection(doc, results.combinedInteraction, helvetica, helveticaBold);

  // Summary page
  drawSummaryPage(doc, results, helvetica, helveticaBold);

  // Scope limitations on every page footer
  // (handled by shared footer helper)

  return doc.save();
}
```

### Saved Calculations Schema
```typescript
// src/server/db/schema/calculations.ts
import { pgTable, uuid, text, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const calculations = pgTable('calculations', {
  id: uuid('id').primaryKey().defaultRandom(),
  calcReference: varchar('calc_reference', { length: 50 }).notNull().unique(),
  userId: text('user_id').notNull(),
  projectName: varchar('project_name', { length: 255 }),
  engineerName: varchar('engineer_name', { length: 255 }),
  inputs: jsonb('inputs').notNull(),           // DesignInputs JSON
  results: jsonb('results').notNull(),         // DesignResults JSON
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

## EN 1992-4 Failure Mode Reference

Complete mapping of failure modes to EN 1992-4 clauses (verified via IDEA StatiCa documentation):

| Failure Mode | Type | Clause | Formula | Key Factors |
|-------------|------|--------|---------|-------------|
| Steel failure (tension) | Tension | Cl. 7.2.1.3 | NRd,s = NRk,s / gamma_Ms | NRk,s = c * As * fuk |
| Concrete cone breakout | Tension | Cl. 7.2.1.4 | NRd,c = NRk,c / gamma_Mc | NRk,c^0 = k1 * sqrt(fck) * hef^1.5 |
| Pull-out | Tension | Cl. 7.2.1.5 | NRd,p = NRk,p / gamma_Mc | Product-specific from ETA |
| Splitting | Tension | Cl. 7.2.1.6 | NRd,sp = NRk,sp / gamma_Msp | Minimum member thickness |
| Steel failure (shear) | Shear | Cl. 7.2.2.3 | VRd,s = VRk,s / gamma_Ms | With/without lever arm |
| Concrete pryout | Shear | Cl. 7.2.2.4 | VRd,cp = VRk,cp / gamma_Mc | VRk,cp = k * NRk,c |
| Concrete edge breakout | Shear | Cl. 7.2.2.5 | VRd,c = VRk,c / gamma_Mc | Multiple psi factors |
| Combined interaction | Combined | Table 7.3 | Steel: (N/Nr)^2 + (V/Vr)^2 <= 1; Concrete: (N/Nr)^1.5 + (V/Vr)^1.5 <= 1 | Separate steel/concrete checks |

### Concrete Classes (EN 1992-1-1 Table 3.1)
| Class | fck (MPa) | fck,cube (MPa) |
|-------|-----------|----------------|
| C20/25 | 20 | 25 |
| C25/30 | 25 | 30 |
| C30/37 | 30 | 37 |
| C35/45 | 35 | 45 |
| C40/50 | 40 | 50 |
| C45/55 | 45 | 55 |
| C50/60 | 50 | 60 |

### k1 Factors (EN 1992-4 Table 7.1)
| Anchor Type | Cracked | Uncracked |
|-------------|---------|-----------|
| Cast-in headed (with washer) | 8.9 | 12.7 |
| Post-installed (straight) | 7.7 | 11.0 |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CEN/TS 1992-4 (5 parts) | EN 1992-4:2018 (single document) | 2018 | Consolidated standard, simplified clause numbering |
| Desktop-only tools (PROFIS) | Browser-based WebGL tools | 2020+ | Torke TRACE targets this modern approach |
| Server-rendered 3D | Client-side R3F with React 19 | 2024-2025 | @react-three/fiber v9 supports React 19 |

**Deprecated/outdated:**
- CEN/TS 1992-4-1 through 4-5: Replaced by EN 1992-4:2018
- react-three-fiber v8: Use v9 for React 19 compatibility
- drei v9: Use v10 for React 19 compatibility

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts (exists) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DESIGN-01 | Full EN 1992-4 calculation produces valid results | unit | `npx vitest run src/__tests__/calc-engine/calc-engine.test.ts -t "full calculation"` | Wave 0 |
| DESIGN-03 | All 7 failure modes + interaction checked | unit | `npx vitest run src/__tests__/calc-engine/failure-modes.test.ts` | Wave 0 |
| DESIGN-04 | Utilisation ratios 0-100% with pass/fail | unit | `npx vitest run src/__tests__/calc-engine/utilisation.test.ts` | Wave 0 |
| DESIGN-05 | Single anchors and groups (2,4,6+) | unit | `npx vitest run src/__tests__/calc-engine/groups.test.ts` | Wave 0 |
| DESIGN-06 | Client/server results match | unit | `npx vitest run src/__tests__/calc-engine/deterministic.test.ts` | Wave 0 |
| DESIGN-11 | PDF report generates without error | unit | `npx vitest run src/__tests__/calc-report/calc-report.test.ts` | Wave 0 |
| DESIGN-12 | PDF contains clause references | unit | `npx vitest run src/__tests__/calc-report/calc-report.test.ts -t "clause refs"` | Wave 0 |
| DESIGN-14 | Product recommendation returns matching products | unit | `npx vitest run src/__tests__/design/product-match.test.ts` | Wave 0 |
| DESIGN-16 | calcReference wired to order line | unit | `npx vitest run src/__tests__/design/calc-reference.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/calc-engine/` directory -- all calc engine tests
- [ ] `src/__tests__/calc-engine/failure-modes.test.ts` -- covers DESIGN-03
- [ ] `src/__tests__/calc-engine/groups.test.ts` -- covers DESIGN-05
- [ ] `src/__tests__/calc-engine/deterministic.test.ts` -- covers DESIGN-06
- [ ] `src/__tests__/calc-report/calc-report.test.ts` -- covers DESIGN-11, DESIGN-12
- [ ] `src/__tests__/design/product-match.test.ts` -- covers DESIGN-14
- [ ] `src/__tests__/design/calc-reference.test.ts` -- covers DESIGN-16
- [ ] Regression test fixtures: validated PROFIS output values for known input sets

## Open Questions

1. **Pull-out resistance values for Torke products**
   - What we know: NRk,p depends on product-specific ETA data (characteristic bond strength, embedment depth)
   - What's unclear: Torke's actual product ETAs may not be in the system yet; current product schema has `etaReference` field but no detailed technical parameters
   - Recommendation: For v1, use generic EN 1992-4 values for post-installed chemical/mechanical anchors. Add product-specific ETA data as product schema fields in a future iteration.

2. **Splitting failure simplification**
   - What we know: Splitting (Cl. 7.2.1.6) requires manufacturer-specific minimum member thickness and edge distances from ETA
   - What's unclear: Whether simplified generic values are acceptable for a design tool
   - Recommendation: Implement with generic minimum values and clearly flag "splitting check uses generic values -- consult product ETA for specific limits" as a scope limitation per DESIGN-07.

3. **PROFIS validation data**
   - What we know: The calc engine needs regression tests validated against PROFIS outputs
   - What's unclear: Whether PROFIS output data is available to create test fixtures
   - Recommendation: Create 5-10 reference calculation cases manually using PROFIS, export results, and use as regression test fixtures. Cover: single anchor centre, single anchor edge, 4-bolt group centre, 4-bolt group corner, high utilisation, low utilisation.

4. **Calculation reference number format**
   - What we know: Format should be CALC-YYYY-NNNNNN
   - What's unclear: Whether sequence should be global or per-user
   - Recommendation: Global sequence (same pattern as ORD- numbers) for simplicity and uniqueness. Use MAX-query-in-transaction pattern established in Phase 2.

## Sources

### Primary (HIGH confidence)
- IDEA StatiCa EN 1992-4 anchor check documentation -- complete failure mode list with clause references
- CivilWeb Spreadsheets -- concrete cone failure formulas and modification factors
- npm registry -- @react-three/fiber v9.5.0, @react-three/drei v10.7.7 versions confirmed
- Existing codebase -- pdf-lib patterns in certpack-service.ts and invoice-service.ts

### Secondary (MEDIUM confidence)
- Hilti ILNAS-EN 1992-4:2018 reference -- k1 factor values for cracked/uncracked concrete
- Wikipedia concrete cone failure -- CCD method background and 35-degree failure angle
- sbcode.net R3F tutorials -- drei Html annotation usage patterns
- Eurocodeapplied.com -- concrete class fck values

### Tertiary (LOW confidence)
- EN 1992-4 partial safety factor values -- verified from multiple sources but exact values should be confirmed against the purchased standard document

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries either already in use or well-established (R3F v9 confirmed React 19 compatible)
- Architecture: HIGH -- follows established project patterns (tRPC, Drizzle, pdf-lib, Zustand)
- EN 1992-4 formulas: MEDIUM -- clause references verified via IDEA StatiCa; exact factor values from multiple sources but should be validated against PROFIS outputs
- Pitfalls: HIGH -- based on common engineering software development challenges and R3F performance patterns

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable domain -- EN 1992-4 doesn't change frequently; R3F v9 is current stable)
