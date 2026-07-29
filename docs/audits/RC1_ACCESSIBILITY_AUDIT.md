# RC1 Accessibility Audit

## Standard and method

Manual/browser checks targeted WCAG 2.2 AA fundamentals: landmarks, headings, accessible names, form labels, keyboard submission, focus management, dialog semantics, Escape behavior, focus restoration, responsive reflow, and visible control availability. RC1 continuation added `@axe-core/playwright` serious/critical scanning of `/` and `/login` at 1440×900 and 390×844. This is not screen-reader certification.

## Passed checks

- Public landing: one H1, one main landmark, no sampled unlabeled buttons.
- Login email/password have programmatic labels; form submits from keyboard.
- Invalid login error is exposed as an alert.
- Dashboard includes “Skip to main content.”
- Mobile navigation uses `role="dialog"` and `aria-modal="true"`.
- Opening mobile navigation moves focus to “Close navigation.”
- Escape closes the dialog and restores focus to “Open navigation.”
- No command-center horizontal overflow at 360, 390, 768, 1280, 1440, or 1920 px widths.
- Data tables expose row/column semantics in browser snapshots.
- Browser console had no warnings/errors during sampled local navigation.
- Automated axe initially found `color-contrast` and `link-in-text-block` issues
  on the public surface. Targeted color and underline repairs were applied; the
  rerun reports zero serious/critical findings on `/` and `/login` in both
  configured viewports.

## Open risks

| Severity | Risk | Recommendation |
| --- | --- | --- |
| P2 | Axe coverage is public/login only; authenticated critical routes remain blocked | Run the existing Playwright role matrix with designated preview accounts and extend axe assertions |
| P2 | Map/GIS keyboard and alternative-text behavior not exhaustively tested | Provide non-map tabular equivalent and document keyboard interaction |
| P3 | Dense mobile topbar creates high cognitive load | Collapse secondary actions into one labeled menu |
| P3 | Color contrast was corrected on sampled public routes but not instrumented across all status badges/maps | Add token-level contrast tests |
| P3 | Live region behavior for async queues/toasts was sampled, not certified | Test with VoiceOver/NVDA |

## Deployed comparison

The deployed login snapshot exposes placeholders as textbox names rather than the repaired “Email” and “Password” labels, confirming that production has not received the accessibility remediation.

The protected Preview could not be exercised with the browser: it redirects to
Vercel authentication. Therefore `/command-center`, role workspaces, farmers,
farms, warehouses, reporting, map, modal, drawer, data table, and workflow queue
axe/keyboard/zoom checks are **not passed** in Preview. VoiceOver/NVDA and
Lighthouse were not run.
