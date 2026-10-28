# Final SVG dot rendering correction

The six-pixel CSS borders had equal layout dimensions but uneven painted edges
at fractional positions/zoom. This fix uses five identical, nonshrinking 8px SVGs:
`viewBox="0 0 8 8"`, circle center `(4,4)`, radius `3.5`, stroke width `1`.
Filled and outlined states use the same geometry. Existing labels, colors and
centered alignment remain. A 4px gap gives a 12px pitch (15px at native 125% zoom
on a 1x display). The dot row remains 8px high; no calendar/event/layout behavior
or calculations change.

## Actual Chromium close-ups

These are direct browser captures of the real calendar's October 13/14 and 20/21
headers, containing Free (five outlined dots), Light and Extreme examples.
Only fictional demonstration data is used. Images were not enlarged, resampled
or assembled after capture.

| Display pixel ratio | Native 100% browser zoom               | Native 125% browser zoom               |
| ------------------- | -------------------------------------- | -------------------------------------- |
| 1x                  | [Close-up](circles-dpr-1-zoom-100.png) | [Close-up](circles-dpr-1-zoom-125.png) |
| 2x                  | [Close-up](circles-dpr-2-zoom-100.png) | [Close-up](circles-dpr-2-zoom-125.png) |

The browser regression matrix uses **native Chromium zoom**, set through its
built-in settings in isolated temporary profiles. It covers DPR **1, 1.25, 1.5
and 2**, zoom **100% and 125%**, and viewport widths **1280px and 1440px**.
Zoomed CSS viewport widths remain desktop widths, exercising different calendar
cell widths. Assertions verify effective device scale and layout width.

Each case captures actual painted Free, Light and Extreme rows. It checks five
separate painted circles, horizontal/vertical pixel coverage moments, outer ink
extents and even physical spacing, in addition to the existing SVG/layout tests.
Subpixel antialiasing is expected on fractional device grids; coverage tolerances
allow at most one physical pixel of extent difference and less than 10% moment
aspect difference. The test does not claim every antialiased pixel is identical
at every possible browser scale.

CDP screenshot clips explicitly account for native zoom, while the browser's
forced display scale preserves the selected DPR through capture. This avoids
blank/wrong-region crops and 1x compositor fallback. No CSS zoom, page pinch
magnification, extension, new dependency or production instrumentation is used.

## Validation

- Formatting, lint, typecheck, production build and whitespace checks: passed.
- Unit tests: **438 passed in 32 files**.
- Full production Chromium suite: **168 passed**.
- Development Chromium suite: **16 passed**.
- All eight native zoom/DPR cases and existing responsive/layout checks passed.
- The four Chromium close-ups above were visually inspected.

The production change is limited to the dot markup and its styles. Test geometry
assertions now target the SVG instead of CSS borders, and the additional raster
checks inspect painted pixels. No existing functional assertion was removed.
Exact-commit GitHub Actions and merge status are reported in PR #5.
