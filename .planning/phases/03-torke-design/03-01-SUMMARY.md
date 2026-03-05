---
phase: 03-torke-design
plan: 01
subsystem: calc-engine
tags: [en-1992-4, anchor-design, zod, vitest, pure-function, typescript]

requires:
  - phase: none
    provides: standalone pure library with no dependencies on prior phases
provides:
  - calculateAnchorDesign(inputs) => DesignResults pure function
  - All 7 EN 1992-4 failure modes + combined interaction
  - DesignInputs, DesignResults, FailureModeResult type exports
  - Input validation via Zod schema (designInputsSchema)
  - 5 engineering presets for quick-start
  - Projected area geometry for edge/corner/group cases
affects: [03-02, 03-03, 03-04, 03-05, 03-06]

tech-stack:
  added: []
  patterns: [pure-function-calc-engine, failure-mode-per-file, geometric-area-clipping]

key-files:
  created:
    - src/lib/calc-engine/index.ts
    - src/lib/calc-engine/types.ts
    - src/lib/calc-engine/constants.ts
    - src/lib/calc-engine/validation.ts
    - src/lib/calc-engine/presets.ts
    - src/lib/calc-engine/geometry/projected-areas.ts
    - src/lib/calc-engine/geometry/group-effects.ts
    - src/lib/calc-engine/failure-modes/steel-tension.ts
    - src/lib/calc-engine/failure-modes/steel-shear.ts
    - src/lib/calc-engine/failure-modes/concrete-cone.ts
    - src/lib/calc-engine/failure-modes/pull-out.ts
    - src/lib/calc-engine/failure-modes/concrete-pryout.ts
    - src/lib/calc-engine/failure-modes/concrete-edge.ts
    - src/lib/calc-engine/failure-modes/splitting.ts
    - src/lib/calc-engine/failure-modes/combined.ts
    - src/__tests__/calc-engine/failure-modes.test.ts
    - src/__tests__/calc-engine/groups.test.ts
    - src/__tests__/calc-engine/deterministic.test.ts
    - src/__tests__/calc-engine/calc-engine.test.ts
  modified: []

key-decisions:
  - "All Torke products treated as post-installed (k1 = 7.7 cracked / 11.0 uncracked)"
  - "Pull-out for mechanical anchors uses Infinity resistance (governed by cone breakout)"
  - "Splitting uses generic hmin = max(2*hef, 100mm) with scope limitation disclaimer"
  - "Combined interaction checks both steel (exponent 2) and concrete (exponent 1.5) separately"
  - "Governing mode determined across all 7 modes + combined (can be Combined Interaction)"
  - "Project info fields (projectName, engineerName, etc.) added to DesignInputs for PDF reports"

patterns-established:
  - "Pure function per failure mode: each file exports one function returning FailureModeResult"
  - "Projected area uses geometric rectangle-intersection clipping to concrete boundaries"
  - "Scope limitations array embedded in every result via SCOPE_LIMITATIONS constant"

requirements-completed: [DESIGN-01, DESIGN-02, DESIGN-03, DESIGN-04, DESIGN-05, DESIGN-06, DESIGN-07]

duration: 8min
completed: 2026-03-05
---

# Phase 3 Plan 01: EN 1992-4 Calc Engine Summary

**Pure TypeScript calculation engine implementing all 7 EN 1992-4 failure modes plus combined tension-shear interaction, with Zod validation, 5 presets, and 47 passing tests**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-05T08:00:34Z
- **Completed:** 2026-03-05T08:08:29Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Complete EN 1992-4 anchor design engine as pure function with zero UI dependencies
- All 7 failure modes (steel tension/shear, concrete cone, pull-out, pryout, edge breakout, splitting) plus combined interaction
- Projected area geometry handles single anchors, groups (2x1, 2x2, 3x2), edge truncation, and corner clipping
- 47 tests passing: failure modes, groups/geometry, deterministic consistency (100 runs), full pipeline, validation, presets

## Task Commits

Each task was committed atomically:

1. **Task 1: Types, constants, geometry, and test scaffolds** - `22fb64b` (feat)
2. **Task 2: All failure mode implementations and full test suite** - `468fc3b` (feat)

## Files Created/Modified
- `src/lib/calc-engine/index.ts` - Public API: calculateAnchorDesign(inputs) => DesignResults
- `src/lib/calc-engine/types.ts` - DesignInputs, DesignResults, FailureModeResult, type unions
- `src/lib/calc-engine/constants.ts` - EN 1992-4 k-factors, concrete classes, safety factors, steel properties
- `src/lib/calc-engine/validation.ts` - Zod schema rejecting invalid inputs (negative loads, bad diameters, etc.)
- `src/lib/calc-engine/presets.ts` - 5 presets: Blank, M12 Baseplate, M16 Column Base, M20 Bracket, M24 Heavy Base
- `src/lib/calc-engine/geometry/projected-areas.ts` - Ac,N calculation with edge clipping and group union
- `src/lib/calc-engine/geometry/group-effects.ts` - Anchor position layouts and eccentricity factor
- `src/lib/calc-engine/failure-modes/steel-tension.ts` - Cl. 7.2.1.3: NRk,s = c * As * fuk
- `src/lib/calc-engine/failure-modes/steel-shear.ts` - Cl. 7.2.2.3: VRk,s = 0.5 * As * fuk
- `src/lib/calc-engine/failure-modes/concrete-cone.ts` - Cl. 7.2.1.4: NRk,c with projected area and psi factors
- `src/lib/calc-engine/failure-modes/pull-out.ts` - Cl. 7.2.1.5: NRk,p = pi * d * hef * tau_Rk
- `src/lib/calc-engine/failure-modes/concrete-pryout.ts` - Cl. 7.2.2.4: VRk,cp = k * NRk,c
- `src/lib/calc-engine/failure-modes/concrete-edge.ts` - Cl. 7.2.2.5: VRk,c with edge/thickness psi factors
- `src/lib/calc-engine/failure-modes/splitting.ts` - Cl. 7.2.1.6: NRk,sp = NRk,c * psi_h,sp
- `src/lib/calc-engine/failure-modes/combined.ts` - Table 7.3: steel quadratic + concrete power 1.5
- `src/__tests__/calc-engine/failure-modes.test.ts` - 12 tests: all 7 modes + combined
- `src/__tests__/calc-engine/groups.test.ts` - 14 tests: positions, areas, eccentricity
- `src/__tests__/calc-engine/deterministic.test.ts` - 2 tests: 100-run identical, object equality
- `src/__tests__/calc-engine/calc-engine.test.ts` - 19 tests: pipeline, validation, presets, group effects

## Decisions Made
- All Torke products treated as post-installed anchors (not cast-in), selecting k1 = 7.7/11.0
- Pull-out for mechanical anchors returns Infinity resistance since it is governed by cone breakout
- Splitting uses generic minimum member thickness hmin = max(2*hef, 100mm) with scope limitation
- Combined interaction checks steel (quadratic) and concrete (power 1.5) separately, takes the worse
- Governing mode includes combined interaction in the comparison (not just the 7 individual modes)
- Project info fields (projectName, engineerName, projectRef, date) added to DesignInputs for future PDF report generation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed governing mode test to include Combined Interaction**
- **Found during:** Task 2 (full test suite)
- **Issue:** Test expected governing mode to be in failureModes array only, but Combined Interaction can govern
- **Fix:** Updated test to check both failureModes and combinedInteraction
- **Files modified:** src/__tests__/calc-engine/calc-engine.test.ts
- **Verification:** All 47 tests pass
- **Committed in:** 468fc3b (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor test correction, no scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Calc engine ready for UI integration (Plan 02: design page layout + input panel)
- Types exported for consumers: DesignInputs, DesignResults, FailureModeResult
- Presets ready for preset selector dropdown
- Validation schema ready for form validation
- Pure function works in both client-side (instant feedback) and server-side (PDF validation)

---
*Phase: 03-torke-design*
*Completed: 2026-03-05*
