# Pilot route & role walkthrough checklist

Internal QA for **Agrivault Data** pilot hardening. Canonical rules live in `src/lib/auth/workspace-access.ts` (`assertPilotRouteAccess`, `needsPilotRoleGate`, `PILOT_ROUTE_INVENTORY`). Middleware applies the same policy after authentication.

## How to test

1. Sign in as each role (or use workspace demo cookie only for **UI** preview — route gates use **database role**, not the cookie).
2. Confirm navigation matches sidebar.
3. Hit URLs directly (paste path) to confirm middleware redirect to the role’s `pilotRoleLandingPath` when denied.

## CLAN (`clan_technician`, `field_agent`)

| Check | Expected |
|-------|----------|
| `/field`, `/field/mobile`, `/field/boundary-capture` | Allow |
| `/district-dashboard` | Allow |
| `/map`, `/geo-registry` | Allow |
| `/reporting` | Allow |
| `/verification-queue`, `/field-agents`, `/inventory`, `/transfers`, `/command-center`, `/national-operations`, `/gis-intelligence` | Deny → redirect |
| Sidebar: Pilot GIS | Links present if nav allows CLAN |

## DAO (`dao_officer`, `district_officer`)

| Check | Expected |
|-------|----------|
| `/district-dashboard`, `/field`, `/verification-queue`, `/reporting`, `/map`, `/geo-registry` | Allow |
| `/field-agents` | Allow |
| `/inventory`, `/transfers`, `/logistics` | Allow |
| `/command-center`, `/national-operations`, `/gis-intelligence` | Deny |
| `/county-dashboard` | Deny |

## CAC (`county_agriculture_coordinator`, `county_officer`)

| Check | Expected |
|-------|----------|
| `/county-dashboard` | Allow |
| `/district-dashboard` | Allow (oversight; UI read-only where applicable) |
| `/national-heat-map`, `/executive-briefing`, `/gis-intelligence` | Allow |
| `/command-center`, `/national-operations` | Deny |
| `/field` | Allow |

## Ministry national (`ministry_admin`, `ministry_officer`, `government_officer`, `super_admin`, `admin`)

| Check | Expected |
|-------|----------|
| `/command-center`, `/national-operations`, `/admin` | Allow |
| `/gis-intelligence` | Allow (advanced GIS) |
| `/county-dashboard`, `/district-dashboard` | Allow |

## Donor (`donor_observer`, `donor_partner`)

| Check | Expected |
|-------|----------|
| `/donor-dashboard`, `/reports` (not in pilot gate list; auth only) | Allow when not blocked by other rules |
| `/farmers`, `/field`, `/district-dashboard`, `/workspace`, `/map` | Deny when gated |

## Auditor (`auditor`)

| Check | Expected |
|-------|----------|
| `/audit-tools`, `/compliance` | Allow (not all compliance subpaths gated — spot-check) |
| Operational field / warehouse URLs | Deny when gated |

## Queue / status wording (UI)

- IndexedDB queue: **Draft**, **Pending Sync**, **Submitted**, **Sync Failed** (`pilotQueueStatusLabel`).
- MoA survey workflow select: **Draft**, **Saved Offline**, **Pending Submission**, **Submitted**, **Under DAO Review**, **Under CAC Verification**, **Escalated**, **Verified**, **Archived**.

## Notes

- **No redirect loops**: denied users are sent to a path they are allowed to open (see `pilotRoleLandingPath`).
- **Advanced GIS** (`/gis-intelligence`): ministry + CAC only; page shows an internal/experimental banner; most UI links point to `/map` or `/geo-registry` instead.
