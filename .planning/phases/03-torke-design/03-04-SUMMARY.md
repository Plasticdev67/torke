---
phase: 03-torke-design
plan: 04
subsystem: design-results-ui
tags: [results-panel, utilisation-bars, failure-modes, action-bar]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [results-display, action-bar-stubs]
  affects: [03-05, 03-06]
tech_stack:
  added: []
  patterns: [debounced-effect, zustand-selector, expandable-panels]
key_files:
  created:
    - src/components/design/FailureModeBar.tsx
    - src/components/design/FailureModeDetail.tsx
    - src/components/design/ResultsPanel.tsx
    - src/components/design/OverallStatus.tsx
    - src/components/design/ActionBar.tsx
  modified:
    - src/app/(design)/design/page.tsx
decisions:
  - "Debounced recalculation (300ms) wired directly in design page useEffect"
  - "Multiple bars can be expanded simultaneously via Set<number> state"
  - "Action bar buttons are stubs pending auth gate integration in Plan 06"
metrics:
  duration: 3min
  completed: "2026-03-05T08:18:00Z"
---

# Phase 3 Plan 04: Results Display + Action Bar Summary

Results panel with utilisation bars (green/amber/red), expandable EN 1992-4 clause detail, overall pass/fail status, and sticky Export PDF / Save Calculation action bar.

## What Was Built

### Task 1: Utilisation Bars and Expandable Detail Panels
- **FailureModeBar**: Horizontal bar with pass/fail icon, colour-coded fill (green <60%, amber 60-90%, red >90%), percentage display, and chevron toggle
- **FailureModeDetail**: Expandable panel showing clause reference badge, design load vs resistance, formula in monospace, and intermediate values grid
- **ResultsPanel**: Reads from design store, renders all 7 failure modes + combined interaction, scope limitations amber banner, section header with check count
- **Commit**: 40ae3c1

### Task 2: Overall Status, Action Bar, and Page Wiring
- **OverallStatus**: Green/red gradient banner with pass/fail indicator and governing failure mode with utilisation percentage
- **ActionBar**: Sticky bottom bar with Export PDF (red primary) and Save Calculation (outline secondary) buttons, disabled when no results, scope disclaimer text
- **Design page wiring**: Added debounced 300ms useEffect that calls calculateAnchorDesign on input changes and stores results in Zustand, right panel layout with 3D placeholder (50%), overall status, scrollable results, sticky action bar
- **Commit**: f2cc0ac

## Self-Check: PASSED

All 6 created/modified files verified on disk. Both commits (40ae3c1, f2cc0ac) present in git log.

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Debounced recalculation in page component**: Wired directly in the design page useEffect rather than a separate hook, since the calc engine is synchronous and fast
2. **Multiple expandable bars**: Used Set<number> for expand state so engineers can compare multiple failure mode details simultaneously
3. **Action bar stubs**: Both buttons log to console; auth gate integration deferred to Plan 06 as planned
