# RC1 Accessibility Audit

## Standard and method

Manual/browser checks targeted WCAG 2.2 AA fundamentals: landmarks, headings, accessible names, form labels, keyboard submission, focus management, dialog semantics, Escape behavior, focus restoration, responsive reflow, and visible control availability. This was not a complete axe or screen-reader certification.

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

## Open risks

| Severity | Risk | Recommendation |
| --- | --- | --- |
| P2 | No automated axe/screen-reader regression suite | Add Playwright + axe against public, login, role dashboards, forms, dialogs, and maps |
| P2 | Map/GIS keyboard and alternative-text behavior not exhaustively tested | Provide non-map tabular equivalent and document keyboard interaction |
| P3 | Dense mobile topbar creates high cognitive load | Collapse secondary actions into one labeled menu |
| P3 | Color contrast was not instrument-measured across all status badges/maps | Add token-level contrast tests |
| P3 | Live region behavior for async queues/toasts was sampled, not certified | Test with VoiceOver/NVDA |

## Deployed comparison

The deployed login snapshot exposes placeholders as textbox names rather than the repaired “Email” and “Password” labels, confirming that production has not received the accessibility remediation.

