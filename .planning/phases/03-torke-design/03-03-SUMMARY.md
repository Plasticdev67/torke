---
phase: 03-torke-design
plan: 03
subsystem: ui
tags: [react-three-fiber, three.js, webgl, 3d-visualisation, zustand, r3f]

requires:
  - phase: 03-torke-design/01
    provides: "Calc engine types, geometry/group-effects, FailureModeResult"
  - phase: 03-torke-design/02
    provides: "Design store (useDesignStore), InputPanel, design page layout"
provides:
  - "Interactive 3D R3F scene for anchor visualisation"
  - "Parametric BasePlate, AnchorBolt, ConcreteBlock, AnchorGroup components"
  - "DimensionAnnotations with live store-driven labels"
  - "FailureCone overlays colour-coded by utilisation"
  - "Cone and dimension toggle controls in design page"
affects: [03-torke-design/04, 03-torke-design/05]

tech-stack:
  added: ["@react-three/fiber", "@react-three/drei", "three", "@types/three"]
  patterns: ["React.memo + granular Zustand selectors for R3F", "dynamic import ssr:false for WebGL", "mm-to-metres scene unit conversion"]

key-files:
  created:
    - src/components/design-3d/AnchorScene.tsx
    - src/components/design-3d/BasePlate.tsx
    - src/components/design-3d/AnchorBolt.tsx
    - src/components/design-3d/ConcreteBlock.tsx
    - src/components/design-3d/AnchorGroup.tsx
    - src/components/design-3d/DimensionAnnotation.tsx
    - src/components/design-3d/FailureCone.tsx
  modified:
    - src/app/(design)/design/page.tsx

key-decisions:
  - "mm-to-metres conversion (divide by 1000) as standard scene unit scale"
  - "React.memo + granular Zustand selectors on all 3D components to avoid R3F re-render storms"
  - "Dynamic import with ssr:false for AnchorScene to prevent server-side WebGL errors"
  - "Mobile fallback message instead of 3D scene on screens below lg breakpoint"
  - "FailureCone uses CCD method 1.5*hef radius for cone breakout geometry"

patterns-established:
  - "R3F component pattern: 'use client', React.memo, individual useDesignStore selectors"
  - "Scene unit convention: all geometry in metres, inputs from store in mm"
  - "Toggle controls bar pattern: checkbox row above Canvas for overlay visibility"

requirements-completed: [DESIGN-08, DESIGN-09, DESIGN-10]

duration: 4min
completed: 2026-03-05
---

# Phase 3 Plan 03: 3D Visualisation Summary

**React Three Fiber interactive anchor scene with parametric geometry, dimension annotations, and colour-coded failure cone overlays driven by Zustand design store**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-05T08:14:59Z
- **Completed:** 2026-03-05T08:19:05Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Complete R3F scene with BasePlate, AnchorBolt (with washer/thread), semi-transparent ConcreteBlock, and AnchorGroup rendering correct bolt count from pattern
- Dimension annotations showing embedment depth, edge distances, and bolt spacing with live store updates
- Failure cone overlays (cone breakout, edge breakout, pryout) colour-coded green/amber/red by utilisation ratio
- Design page integration with dynamic import, toggle controls bar, and mobile fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Install R3F and create core 3D components** - `1a7e9e4` (feat)
2. **Task 2: Failure cone overlays and design page integration** - `faaefd4` (feat)

## Files Created/Modified
- `src/components/design-3d/AnchorScene.tsx` - R3F Canvas with lighting, camera, OrbitControls, scene composition
- `src/components/design-3d/BasePlate.tsx` - Extruded rectangular plate from store dimensions
- `src/components/design-3d/AnchorBolt.tsx` - Cylinder bolt with washer and threaded extension
- `src/components/design-3d/ConcreteBlock.tsx` - Semi-transparent concrete with wireframe overlay
- `src/components/design-3d/AnchorGroup.tsx` - Maps group pattern positions to AnchorBolt instances
- `src/components/design-3d/DimensionAnnotation.tsx` - drei Html labels + dashed dimension lines
- `src/components/design-3d/FailureCone.tsx` - Cone geometry colour-coded by utilisation threshold
- `src/app/(design)/design/page.tsx` - Integrated AnchorScene with toggle controls and mobile fallback

## Decisions Made
- Used mm-to-metres conversion (/ 1000) as standard scene unit scale -- keeps geometry proportional and R3F-friendly
- All 3D components wrapped in React.memo with granular Zustand selectors (individual fields, not whole inputs object) to prevent unnecessary R3F re-renders
- Dynamic import with ssr: false for AnchorScene since R3F requires browser WebGL APIs
- Mobile screens get a fallback message rather than the 3D scene (WebGL performance on mobile + limited screen space)
- FailureCone uses CCD method geometry: cone radius = 1.5 * hef for breakout, inverted cone point-up at bolt

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 3D scene fully integrated and driven by design store
- Results panel (Plan 04) can access same store results for utilisation display
- PDF report (Plan 05) can reference same scene for visual context

## Self-Check: PASSED

All 7 created files verified on disk. Both task commits (1a7e9e4, faaefd4) verified in git log.

---
*Phase: 03-torke-design*
*Completed: 2026-03-05*
