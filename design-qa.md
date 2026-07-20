# Design QA — Wei Zheng bilingual academic portfolio

## Source of truth

- Selected Product Design direction: `work/references/selected-design-3.png`
- Final desktop implementation capture: `work/qa/implementation-en-wide-scaled.png`
- Normalized side-by-side comparison: `work/qa/comparison-en-1536x1024.png`
- Focused hero comparison: `work/qa/comparison-hero-focused.png`
- Chinese state: `work/qa/implementation-zh-1536x1024.png`
- Mobile state: `work/qa/implementation-mobile-390x844.png`
- User-requested conceptual cover artwork: `public/assets/electromagnetic-concept-panorama.png`

## Viewports and states checked

- Desktop reference canvas: 1536 × 1024, English initial state.
- Wide desktop composition: 2048 × 1365, normalized to the reference canvas for the visual comparison.
- Mobile breakpoint: 390 × 844.
- Chinese language toggle and English return state.
- Mobile navigation open/close state.

## Comparison history

1. P2 — The first implementation used a portrait in a bright white rectangle and omitted the reference's scientific hero atmosphere. Fixed with the selected electromagnetic portrait composite.
2. P2 — Header alignment, hero split, name wrapping, and fold position were visibly different from the selected direction. Fixed by matching the desktop navigation placement, rebalancing the grid, reordering the role line, and compressing hero spacing.
3. P2 — The cover research strip used concrete paper, simulation, and laboratory screenshots. Following user review, replaced them with one continuous purpose-generated electromagnetic concept panorama; concrete research imagery remains in the later research section.
4. P2 — Mobile name clipping at 390 px. Fixed by reducing the mobile display-size clamp; final mobile measurement reports no horizontal overflow.

## Final visual review

- Typography: hierarchy, cyan role line, coral rule, monospaced metrics, and bilingual name treatment match the selected direction. No clipped desktop or mobile headings.
- Spacing/layout: desktop hero, CTA row, metrics, portrait split, and research-focus fold are coherent. Mobile collapses to one column and keeps CTA targets full-width.
- Color: navy base, cyan accents, coral rule, blue primary CTA, and restrained scientific highlights are consistent.
- Images: portrait and hero composite are sharp; the cover strip now uses abstract conceptual field imagery only. Detailed research figures are intentionally deferred to the research section.
- Copy: English and Chinese labels, profile copy, publication data, affiliations, links, and dates were checked against the supplied materials.
- Interactions: View research anchor, Google Scholar link, EN/中文 toggle, and mobile navigation were exercised successfully.
- Browser console: historical Vite HMR import errors were present from early edits; no new errors appeared after the final clean reload. Production build completed successfully.

## Remaining findings

- P3 — The implementation uses a wider portrait crop and slightly smaller desktop display type than the ideation image to preserve real portrait clarity and responsive copy fit. No action required.

## Result

final result: passed
