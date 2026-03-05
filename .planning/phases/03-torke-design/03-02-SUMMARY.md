---
phase: 03-torke-design
plan: 02
subsystem: ui, database
tags: [zustand, drizzle, collapsible, design-tool, en-1992-4, shadcn]

requires:
  - phase: 02-e-commerce-order-flow-wms
    provides: cart store, order schema, product schema
  - phase: 03-torke-design
    provides: calc-engine types (Plan 01)
provides:
  - calculations table in DB schema for saved calculations
  - orderLines.calcReference column for design-to-order linking
  - CartItem.calcReference for calc-aware cart items
  - useDesignStore Zustand store with persist, presets, input/result state
  - /design route with split-panel layout (inputs left, placeholders right)
  - InputPanel with 6 collapsible input sections and preset selector
  - CollapsibleSection reusable component
affects: [03-torke-design, calc-engine, 3d-scene, results-panel, pdf-report]

tech-stack:
  added: [shadcn-collapsible, shadcn-switch]
  patterns: [collapsible-section-pattern, field-group-pattern, design-store-pattern]

key-files:
  created:
    - src/server/db/schema/calculations.ts
    - src/stores/design.ts
    - src/app/(design)/layout.tsx
    - src/app/(design)/design/page.tsx
    - src/components/design/InputPanel.tsx
    - src/components/design/CollapsibleSection.tsx
    - src/components/design/FieldGroup.tsx
    - src/components/design/sections/ProjectInfoSection.tsx
    - src/components/design/sections/AnchorTypeSection.tsx
    - src/components/design/sections/ConcreteSection.tsx
    - src/components/design/sections/LoadsSection.tsx
    - src/components/design/sections/GeometrySection.tsx
    - src/components/design/sections/EnvironmentSection.tsx
    - src/components/ui/collapsible.tsx
    - src/components/ui/switch.tsx
  modified:
    - src/server/db/schema/orders.ts
    - src/server/db/schema/index.ts
    - src/stores/cart.ts

key-decisions:
  - "Cart items with different calcReference treated as separate line items (not merged)"
  - "5 design presets: Single M12, Single M16, 4-Bolt M12, 4-Bolt M20, Blank Slate"
  - "CollapsibleSection wrapper component for reuse across all input sections"
  - "FieldGroup wrapper for consistent label/unit/error styling"

patterns-established:
  - "CollapsibleSection: reusable collapsible card for design input groups"
  - "FieldGroup: label + unit + error wrapper for form fields in dark theme"
  - "Design store pattern: Zustand persist with setInput/setInputs/loadPreset"

requirements-completed: [DESIGN-02, DESIGN-17]

duration: 10min
completed: 2026-03-05
---

# Phase 3 Plan 02: Design Input Surface Summary

**Zustand design store with persist, DB schema for saved calcs, and /design page with 6 collapsible EN 1992-4 input sections**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-05T08:00:34Z
- **Completed:** 2026-03-05T08:10:55Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments
- calculations table defined in DB schema with calcReference, userId, inputs/results JSONB columns
- orderLines has calcReference column linking orders to saved calculations
- CartItem extended with optional calcReference; different calcRef creates separate line items
- Zustand design store with localStorage persistence, 5 presets, and typed setInput/loadPreset actions
- /design page with split-panel layout: scrollable inputs left, 3D + results placeholders right
- All 6 EN 1992-4 input sections with correct field types, inline validation, and unit labels

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema extensions and store setup** - `6d25ebd` (feat)
2. **Task 2: Input panel UI with collapsible sections** - `e5e3878` (feat)

## Files Created/Modified
- `src/server/db/schema/calculations.ts` - Saved calculations table (id, calcReference, userId, inputs JSONB, results JSONB)
- `src/server/db/schema/orders.ts` - Added calcReference column to orderLines
- `src/server/db/schema/index.ts` - Re-exports calculations schema
- `src/stores/cart.ts` - CartItem.calcReference field; items with different calcRef stay separate
- `src/stores/design.ts` - Zustand store: inputs, results, isCalculating, calcReference, 5 presets
- `src/app/(design)/layout.tsx` - Design route group layout with Header, dark theme, no footer
- `src/app/(design)/design/page.tsx` - Split-panel /design page (inputs left, placeholders right)
- `src/components/design/InputPanel.tsx` - Preset selector + 6 collapsible sections container
- `src/components/design/CollapsibleSection.tsx` - Reusable collapsible card with red icon accent
- `src/components/design/FieldGroup.tsx` - Label + unit + error wrapper for form fields
- `src/components/design/sections/ProjectInfoSection.tsx` - Project name, engineer, ref, auto-date
- `src/components/design/sections/AnchorTypeSection.tsx` - Type, diameter (M8-M30), grade, embedment (40-500mm)
- `src/components/design/sections/ConcreteSection.tsx` - Class (C20/25-C50/60), cracked toggle, thickness
- `src/components/design/sections/LoadsSection.tsx` - Tension NEd and shear VEd in kN
- `src/components/design/sections/GeometrySection.tsx` - Group pattern, spacing, edge distances, plate dims
- `src/components/design/sections/EnvironmentSection.tsx` - Dry/humid/marine with corrosion guidance
- `src/components/ui/collapsible.tsx` - shadcn Collapsible component
- `src/components/ui/switch.tsx` - shadcn Switch component

## Decisions Made
- Cart items with different calcReference are treated as separate line items (not merged by quantity) to preserve calculation traceability per order line
- 5 design presets provided: Single M12 Baseplate (default), Single M16 Heavy Duty, 4-Bolt M12 Column Base, 4-Bolt M20 Column Base, Blank Slate
- Created reusable CollapsibleSection and FieldGroup components for consistent design tool UI pattern
- Project info fields (projectName, engineerName, projectRef, date) added to DesignInputs type as UI-only metadata

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Design store and input surface ready for Plan 03 (3D visualisation) and Plan 04 (results panel)
- Schema extensions ready for Plan 05 (save/load calculations via tRPC)
- Cart calcReference ready for Plan 06 (design-to-order pipeline)
- Right panel placeholders will be replaced by R3F 3D scene and utilisation ratio bars

---
*Phase: 03-torke-design*
*Completed: 2026-03-05*
