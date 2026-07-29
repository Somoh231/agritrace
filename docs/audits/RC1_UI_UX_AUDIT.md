# RC1 UI/UX Audit

## Summary

The product has a coherent institutional visual language, strong ministry hierarchy, clear source badges on primary dashboards, and responsive enterprise tables/cards. Baseline problems centered on action truthfulness, role clarity, keyboard behavior, and crowded operational surfaces.

## Remediations

- Removed dead default workspace buttons and routed district/county actions to real destinations.
- Converted login to a semantic form with keyboard submit and visible profile/inactive errors.
- Added labels and names to authentication inputs.
- Added a top-level skip link and stable main landmark.
- Added an accessible label/focus treatment to workspace tools.
- Added mobile dialog semantics, explicit close control, focus trap, Escape handling, and focus restoration.
- Filtered sidebar destinations through the same route-access policy used by middleware.
- Disabled or removed fake approval, verification, replenishment, and transfer actions.
- Hid the health-page setup link when production setup is disabled.

## Before/after evidence

| Surface | Before | After | Evidence |
| --- | --- | --- | --- |
| `/login` | Div-driven login controls, incomplete labels, unsafe return target | Semantic form, named inputs, keyboard submit, bounded internal redirect, visible profile errors | Invalid and Ministry demo login browser checks |
| Global shell | No skip target; mobile drawer lacked complete dialog/focus behavior | Skip link/stable main, labeled tools, dialog semantics, close control, focus trap, Escape, restoration | Keyboard/mobile browser checks |
| Role navigation | Sidebar metadata could advertise routes middleware denied | Navigation filtered through canonical route-access policy | Exporter sidebar omits national/admin; direct `/admin/users` redirects |
| Verification/CAC/transfers | Illustrative rows exposed mutation-like controls | Illustrative records are read-only; fake server mutations return 409 | Empty/live queue inspection and route tests |
| Default workspaces | Dead or misleading calls to action | Removed or linked to real destinations | Targeted route review |
| `/health` and `/setup` | Setup link/details could be visible in production | Link hidden and local production build returns 404 unless explicitly enabled | Local route check; deployed stale build remains a blocker |

## Browser observations

- Public landing and command center have one H1 and one main landmark.
- No unlabeled visible buttons were found on sampled public/command surfaces.
- The exact requested sizes—1440×900, 1280×800, 1024×768, 768×1024, 390×844, and 360×800—showed no document-level horizontal overflow.
- Mobile topbar remains dense at 360–390 px, but controls wrap without clipping.
- Exporter direct access to `/admin/users` redirects to `/farmers`.
- After remediation, exporter navigation contains farmer/inventory/compliance tools and omits national/admin destinations.
- Empty live workflow/transfer queues render stable zero/empty states rather than fake successful records.

## Staging continuation

- Automated desktop/mobile core checks now cover the public landing page, login
  labels and keyboard submit, protected redirect, setup 404, health response,
  unauthenticated exports, and serious/critical axe findings.
- Axe identified public color-contrast and link-in-text-block failures. Footer,
  navigation subtitle, language label, section tag, and homepage CTA colors were
  adjusted. The affected desktop and 390×844 checks now pass.
- The protected Preview cannot be inspected interactively because browser
  navigation lands on Vercel authentication. CLI route proof does not validate
  rendered navigation, responsive layout, console failures, or Mapbox controls.
- Authenticated role-route screenshots are intentionally absent because no
  designated environment-only role credentials were configured.

## Open UX items

1. Simplify the mobile command topbar by grouping export/briefing/account controls.
2. Provide explicit training-mode examples beside, not inside, empty live ledgers.
3. Revisit permissive compliance/audit navigation with product and data owners.
4. Standardize primary-action availability per role and per data source.
5. Consolidate deprecated card/status/table wrappers.
6. Complete authenticated preview desktop/mobile review once protected-browser
   access and designated `QA_*` accounts are available.

## Controlled-pilot continuation

No authenticated UI claim was added: the bypass secret and all QA account pairs
remain absent. The role, offline, GIS, modal/drawer/table, 200% zoom, and mobile
overflow workstreams therefore retain their blocked status. Optional analytics
now degrades quietly without changing user workflows; the admin analytics page
states that the feature is optional and disabled when its table is absent.
