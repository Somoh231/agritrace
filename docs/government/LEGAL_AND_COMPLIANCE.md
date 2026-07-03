# AgriVault Legal and Compliance Framework

**Classification:** Internal — Legal counsel, compliance officers  
**Platform:** AgriVault (`agritrace`) · Release Candidate 1 (0.1.0-rc1)  
**Date:** July 2026  
**Audience:** Ministry legal counsel, compliance officers, auditors, procurement unit, Data Steward Board

**Related:** [DATA_SHARING_FRAMEWORK.md](./DATA_SHARING_FRAMEWORK.md) · [../business/DATA_GOVERNANCE.md](../business/DATA_GOVERNANCE.md) · [../SECURITY.md](../SECURITY.md) · [../product/VISION.md](../product/VISION.md) · [DONOR_GUIDE.md](./DONOR_GUIDE.md)

---

## Table of contents

1. [Purpose](#purpose)
2. [Legal context](#legal-context)
3. [Data protection principles](#data-protection-principles)
4. [Audit requirements](#audit-requirements)
5. [EUDR reporting context](#eudr-reporting-context)
6. [Terms of use framework](#terms-of-use-framework)
7. [Donor access agreements](#donor-access-agreements)
8. [Open source compliance](#open-source-compliance)
9. [Contractual and procurement compliance](#contractual-and-procurement-compliance)
10. [Compliance calendar](#compliance-calendar)

---

## Purpose

This document establishes the legal and compliance framework governing AgriVault operations under Ministry of Agriculture authority. It addresses data protection, audit obligations, export compliance (EUDR), platform terms of use, donor agreements, and open source licence compliance for RC1 and subsequent releases.

---

## Legal context

| Instrument | Relevance to AgriVault |
|------------|------------------------|
| Constitution of Liberia (1986) | Privacy and property rights |
| Public Procurement and Concessions Act | Hosting and services procurement |
| Electronic Transactions Act (if applicable) | Digital records admissibility |
| Ministry of Agriculture mandates | Programme authority |
| Bilateral donor agreements | Data sharing and programme funding |
| EU Deforestation Regulation (EUDR) | Cocoa export due diligence context |
| International best practice (World Bank GDS) | Digital government standards |

AgriVault operates as a **government operational system** — not a commercial consumer service. Legal obligations derive from public administration, programme delivery, and international trade compliance requirements.

Vision and national alignment: [../product/VISION.md](../product/VISION.md) § Alignment with national digital transformation.

---

## Data protection principles

The Ministry applies the following data protection principles pending comprehensive national data protection legislation:

```mermaid
flowchart LR
  COL[Collection] --> PUR[Purpose limitation]
  PUR --> MIN[Minimum necessary]
  MIN --> ACC[Accuracy]
  ACC --> STORE[Secure storage]
  STORE --> RET[Retention limits]
  RET --> DEL[Secure deletion]
```

| Principle | AgriVault implementation |
|-----------|-------------------------|
| Lawfulness | Data collected for legitimate government agricultural programmes |
| Purpose limitation | Used only for registration, verification, programme delivery, reporting |
| Data minimisation | Forms collect required fields only; optional fields marked |
| Accuracy | CLAN → DAO → CAC → Ministry verification chain |
| Storage limitation | Retention schedule in [../business/DATA_GOVERNANCE.md](../business/DATA_GOVERNANCE.md) |
| Integrity and confidentiality | RLS, encryption, access controls per [../SECURITY.md](../SECURITY.md) |
| Accountability | Audit logs; Data Steward Board; governance model |

### Personal data categories

| Category | Examples | Protection level |
|----------|----------|------------------|
| Farmer identity | Name, national ID, phone | Class 3 — PII restricted |
| Location data | GPS boundaries, plot coordinates | Class 4 — Geospatial restricted |
| Government staff | User profiles, role assignments | Class 2 — Operational internal |
| Programme data | Production records, distribution | Class 2 — Operational internal |

Classification detail: [DATA_SHARING_FRAMEWORK.md](./DATA_SHARING_FRAMEWORK.md).

### Data subject considerations

Farmers are indirect platform beneficiaries — not direct account holders. Rights requests (correction, deletion) are processed through:

1. Farmer contacts CLAN or DAO officer
2. County board validates request
3. Ministry data steward executes correction or anonymisation
4. Action logged in audit trail

---

## Audit requirements

### Platform audit capabilities (RC1)

| Capability | Location | Access role |
|------------|----------|-------------|
| Workflow action log | `workflow_actions` table | `auditor`, Ministry roles |
| Audit log | `audit_log` table | `auditor`, admin roles |
| Audit tools surface | `/audit-tools` | `auditor` |
| Data source provenance | `DataSourceBadge` on all key surfaces | All operational roles |
| API request logging | Structured JSON logs with `x-request-id` | Ministry IT |

Workflow engine reference: [../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md).

### Compliance audit programme

| Audit type | Scope | Frequency | Auditor |
|------------|-------|-----------|---------|
| Internal workflow audit | Approval chain integrity | Quarterly | Ministry auditor |
| Data quality audit | Steward reconciliation | Quarterly | Data Steward Board |
| Security audit | RLS, CSP, access controls | Semi-annual | Ministry IT + external |
| Donor compliance audit | MOU adherence | Per MOU anniversary | Programme office |
| Financial audit | Procurement and contract | Annual | GOL audit authority |
| Penetration test | Application security | Pre-scale (Q4 2026) | External firm |

### Audit record retention

| Record type | Retention period |
|-------------|------------------|
| Workflow actions | 7 years |
| Audit log entries | 7 years |
| User access logs | 3 years |
| Export logs | 7 years |
| Security incident reports | 10 years |

### Auditor role

The `auditor` role provides read-only access to compliance surfaces without workflow mutation capability. Auditors may not access individual farmer PII unless specifically authorised for an investigation.

Permissions: [../product/PERMISSIONS_MATRIX.md](../product/PERMISSIONS_MATRIX.md) § Exceptions and read-only roles.

---

## EUDR reporting context

The EU Deforestation Regulation (EUDR) requires due diligence for cocoa and other commodities exported to the EU market. AgriVault RC1 provides **partial** EUDR support — not full export chain automation.

### RC1 EUDR capabilities

| Capability | Status | Reference |
|------------|--------|-----------|
| GPS farm boundary capture | ✅ Available | `/field/boundary-capture` |
| Cocoa module | ✅ Available | `/cocoa` |
| Plot registration with provenance | ✅ Available | Operational submissions |
| Due Diligence Statement (DDS) export | 🔶 Partial | `/api/reports/dds` |
| Full export chain automation | ❌ Post-pilot | [../ROADMAP_POST_PILOT.md](../ROADMAP_POST_PILOT.md) |
| Exporter self-service portal | ❌ Post-pilot | [../product/ROADMAP.md](../product/ROADMAP.md) |

### EUDR data handling

| Data element | Classification | External sharing |
|--------------|----------------|------------------|
| Plot boundary (raw GeoJSON) | Class 4 | MOU + bilateral agreement only |
| Plot count and hectare aggregate | Class 1/2 | Donor dashboard; compliance reports |
| DDS PDF export | Class 2 | Ministry-authorised export only |
| Farmer identity linked to plot | Class 3 | Not in default EUDR export |

### Compliance roadmap

| Phase | EUDR deliverable | Timeline |
|-------|------------------|----------|
| Pilot | Boundary capture validation; DDS smoke test | Q3 2026 |
| Hardening | DDS production workflow; audit trail | Q4 2026 |
| Scale | Exporter portal; full chain | Q2 2027 |

---

## Terms of use framework

All AgriVault users must accept Ministry-issued terms of use before account activation.

### Terms structure

| Section | Content |
|---------|---------|
| 1. Acceptance | User accepts terms by accessing platform |
| 2. Authority | User acts under Ministry programme authority |
| 3. Acceptable use | Operational purposes only; no unauthorised sharing |
| 4. Account security | Individual credentials; no sharing; report compromise |
| 5. Data handling | Classified data handled per DATA_SHARING_FRAMEWORK |
| 6. Workflow integrity | No bypass of approval chain; no falsification |
| 7. Device security | Field devices secured; report loss |
| 8. Monitoring | Ministry may audit user actions |
| 9. Suspension | Ministry may suspend accounts for violation |
| 10. Liability | User responsible for actions under their account |
| 11. Amendments | Ministry may update terms with notice |
| 12. Governing law | Republic of Liberia |

### Role-specific addenda

| Role group | Additional terms |
|------------|----------------|
| CLAN / field agents | Field device custody; farmer consent protocol |
| DAO / CAC | Review integrity; timely processing obligation |
| Ministry officers | National data access responsibility |
| Donor observers | Read-only; no download of PII; MOU compliance |
| Admin / IT | Elevated access logging; change management |

### Enforcement

| Violation | Consequence |
|-----------|-------------|
| Credential sharing | Account suspension |
| Unauthorised data export | Suspension + investigation |
| Workflow falsification | Suspension + disciplinary referral |
| Donor PII access attempt | Immediate revocation + MOU review |
| Repeated violations | Permanent deactivation |

---

## Donor access agreements

Donor data access is governed by bilateral Memoranda of Understanding between the donor agency and the Ministry of Agriculture.

### MOU template structure

| Schedule | Content |
|----------|---------|
| A | Programme description and AgriVault role |
| B | Data classification schedule (from DATA_SHARING_FRAMEWORK) |
| C | Named authorised personnel |
| D | Access method (platform role and/or export) |
| E | Retention and destruction requirements |
| F | Incident notification procedures |
| G | Audit and compliance verification |

Donor operational guide: [DONOR_GUIDE.md](./DONOR_GUIDE.md).

### Standard prohibitions (all donor MOUs)

1. No re-identification of anonymised records
2. No sub-sharing without Ministry written consent
3. No commercial use of farmer data
4. No workflow mutation or account elevation
5. No public disclosure of Class 2+ data without Ministry approval

---

## Open source compliance

AgriVault is built on open source components. The Ministry requires licence compliance as a condition of deployment and procurement.

### Primary dependencies and licences

| Component | Licence | Compliance action |
|-----------|---------|-------------------|
| Next.js | MIT | Attribution in NOTICE file |
| React | MIT | Attribution in NOTICE file |
| Supabase client | Apache 2.0 | Attribution; patent grant acknowledged |
| Mapbox GL JS | Mapbox Terms of Service | Commercial token licence; usage limits |
| Turf.js | MIT | Attribution |
| Tailwind CSS | MIT | Attribution |
| shadcn/ui components | MIT | Attribution |

### Compliance obligations

| Obligation | Owner | Frequency |
|------------|-------|-----------|
| Maintain NOTICE file with all OSS attributions | Vendor / Ministry IT | Per release |
| Mapbox token licence compliance | Ministry IT | Annual review |
| Licence conflict review before new dependencies | Vendor engineering | Per change |
| Source code availability (if required by licence) | Vendor | Per contract |
| Copyleft assessment (GPL etc.) | Legal counsel | Per major dependency addition |

### Mapbox commercial licence

Mapbox GL JS requires a commercial token under Mapbox Terms of Service. The Ministry must:

- Procure Mapbox usage under Lot 1 of [PROCUREMENT_PACKAGE.md](./PROCUREMENT_PACKAGE.md)
- Monitor API usage against token limits
- Not redistribute Mapbox tiles or data to third parties

### Vendor open source warranty (procurement)

Bidders must warrant that all deployed components comply with their respective licences and that no copyleft licence (GPL, AGPL) contaminates the Ministry's deployment without disclosure.

---

## Contractual and procurement compliance

| Requirement | Reference |
|-------------|-----------|
| PPCC procurement procedures | [PROCUREMENT_PACKAGE.md](./PROCUREMENT_PACKAGE.md) |
| Data ownership clause | Ministry owns all operational data |
| Processor agreements | Supabase, Vercel DPA on file |
| Exit and transition | 90-day data export obligation |
| Security incident notification | 24-hour vendor notification to Ministry IT |
| Insurance | Professional indemnity (vendor) |

Cabinet authority: [CABINET_BRIEF.md](./CABINET_BRIEF.md).

---

## Compliance calendar

| Activity | Q3 2026 | Q4 2026 | Q1 2027 | Ongoing |
|----------|---------|---------|---------|---------|
| Terms of use rollout | ✅ Pilot users | Scale users | All users | Amendments |
| Data Steward Board meeting | — | ✅ Q4 | Quarterly | Quarterly |
| Internal workflow audit | — | ✅ | Quarterly | Quarterly |
| Security audit / pen test | — | ✅ | — | Semi-annual |
| OSS licence review | ✅ RC1 | ✅ Hardening | Per release | Per release |
| Donor MOU review | ✅ Pilot donors | Wave 2 donors | — | Per MOU |
| EUDR capability assessment | ✅ Pilot | ✅ Production | Scale | Annual |
| Legal framework review | ✅ | Post-pilot | Annual | Annual |

Governance oversight: [NATIONAL_GOVERNANCE_MODEL.md](./NATIONAL_GOVERNANCE_MODEL.md).

Pilot evaluation (includes compliance dimension): [PILOT_EVALUATION_FRAMEWORK.md](./PILOT_EVALUATION_FRAMEWORK.md).

---

*AgriVault — Ministry of Agriculture, Republic of Liberia · RC1 · July 2026*
