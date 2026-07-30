# Workforce Read-Only Preflight Data Report

Generated: 2026-07-29  
Query mode: read-only aggregate counts, no PII  
Migration application: not performed

## Project identity

| Signal | Observed |
| --- | --- |
| URL project ref | `tkblfaqaaoyadjnyhyiz` |
| Locally linked project ref | `tkblfaqaaoyadjnyhyiz` |
| Locally linked project name | `MOA Farm Traceability` |
| Refs match | yes |
| Proven approved staging | **no** |

The project ref is internally consistent. Neither the project name nor
repository configuration proves that it is the approved staging environment.

## Identity counts

| Check | Count |
| --- | ---: |
| Auth identities | 5 |
| Profile rows | 4 |
| Auth identities missing a profile | 1 |
| Profiles missing an Auth identity | 0 |
| Active profiles | 4 |
| Inactive profiles | 0 |
| Active profiles with `deactivated_at` set | 0 |
| Currently banned Auth identities | 0 |
| Auth identities without confirmed email | 0 |
| Non-canonical profile counties | 0 |
| Non-canonical district/county pairs | 0 |
| Demo/test/seed/shared-like Auth email pattern | 4 |
| Demo/test/seed/shared-like profile email pattern | 4 |

Email values were not emitted. Pattern counts are discovery signals only and
are not role provenance.

## Existing role distribution

| Role | Total | Active |
| --- | ---: | ---: |
| `ministry_officer` | 1 | 1 |
| `exporter` | 1 | 1 |
| `cooperative_manager` | 1 | 1 |
| `field_agent` | 1 | 1 |

Every profile has an organization and county. None of the four has a district.
That is compatible with the revised catalog because none of these four roles
requires district scope. There are no observed warehouse-manager profiles.

The four roles remain unapproved legacy facts. The preflight does not prove who
authorized them or whether the accounts are individually controlled.

## Existing identity schema

The exposed `profiles` shape is legacy:

`county`, `created_at`, `deactivated_at`, `district`, `email`, `full_name`,
`id`, `is_active`, `organization_id`, `phone`, `role`.

The three proposed workforce identity tables are not present in the exposed
PostgREST schema:

- `profile_role_assignments`
- `workforce_role_catalog`
- `workforce_identity_transitions`

Count-only probes against unknown tables were not treated as proof of
existence; the authoritative exposed-schema document reports them absent.

## Production-shaped data counts

| Table | Rows |
| --- | ---: |
| `organizations` | 4 |
| `warehouses` | 4 |
| `warehouse_stock` | 16 |
| `inventory_movements` | 1 |
| `farmers` | 50 |
| `plots` | 50 |
| `lots` | 20 |
| `movements` | 34 |
| `rice_production_records` | 45 |
| `field_reports` | 3 |
| `geo_locations` | 1 |
| `operational_submissions` | 0 |
| `workflow_actions` | 0 |
| `workflow_comments` | 0 |
| `workflow_assignments` | 0 |
| `workflow_notifications` | 0 |
| `warehouse_transfer_orders` | 0 |
| `pilot_dao_officers` | 0 |
| `pilot_operational_events` | 0 |
| `pilot_county_metrics` | 0 |

This is not an empty database. Application would change access behavior over
existing operational records and identities.

## Preflight verdict

**NO-GO TO APPLY.**

Technical compatibility is plausible for the four observed profile shapes,
but two mandatory facts are absent:

1. explicit environment-owner confirmation that project ref
   `tkblfaqaaoyadjnyhyiz` is the approved staging target;
2. an approved provenance manifest covering all four active legacy profiles
   with exact current roles.

The fifth Auth identity without a profile will remain denied and requires a
separate identity-owner disposition. No user was created, changed, invited,
disabled, or deleted during this preflight.
