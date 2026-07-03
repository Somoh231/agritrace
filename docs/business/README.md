# AgriVault Business Documentation

Programme management, implementation, and operating documentation for deploying AgriVault as a national government platform.

**Version:** 0.1.0-rc1 · **Platform:** AgriVault (`agritrace`)

---

## Table of contents

| Document | Audience | Purpose |
|----------|----------|---------|
| [PLATFORM_OVERVIEW.md](./PLATFORM_OVERVIEW.md) | All stakeholders | Platform value, scope, and capability summary |
| [MINISTRY_IMPLEMENTATION_GUIDE.md](./MINISTRY_IMPLEMENTATION_GUIDE.md) | Ministry programme leads | Ministry-specific deployment path |
| [IMPLEMENTATION_PLAYBOOK.md](./IMPLEMENTATION_PLAYBOOK.md) | PMO, implementation partners | Phased rollout playbook |
| [CHANGE_MANAGEMENT.md](./CHANGE_MANAGEMENT.md) | HR, programme managers | Adoption and change strategy |
| [OPERATING_MODEL.md](./OPERATING_MODEL.md) | Operations leadership | Roles, RACI, service ownership |
| [DATA_GOVERNANCE.md](./DATA_GOVERNANCE.md) | Data stewards, IT | Data ownership, quality, retention |
| [PILOT_SUCCESS_METRICS.md](./PILOT_SUCCESS_METRICS.md) | PMO, evaluators | KPIs and success criteria |
| [NATIONAL_SCALE_GUIDE.md](./NATIONAL_SCALE_GUIDE.md) | National programme board | County-to-national expansion |
| [PROCUREMENT_GUIDE.md](./PROCUREMENT_GUIDE.md) | Procurement committees | Licensing, hosting, services |
| [SUPPORT_MODEL.md](./SUPPORT_MODEL.md) | Support leads | Tiered support structure |
| [TRAINING_PROGRAM.md](./TRAINING_PROGRAM.md) | Training coordinators | Curriculum and certification |
| [RISK_REGISTER.md](./RISK_REGISTER.md) | PMO, risk owners | Programme risk matrix |
| [DISASTER_RECOVERY_PLAN.md](./DISASTER_RECOVERY_PLAN.md) | IT, operations | DR scenarios and recovery |
| [BUSINESS_CONTINUITY_PLAN.md](./BUSINESS_CONTINUITY_PLAN.md) | Programme leadership | Continuity during disruption |
| [PROJECT_GOVERNANCE.md](./PROJECT_GOVERNANCE.md) | Steering committee | Governance structure and cadence |

---

## Related documentation

| Portal | Path |
|--------|------|
| Engineering | [../README.md](../README.md) |
| Product | [../product/README.md](../product/README.md) |
| Operations | [../operations/README.md](../operations/README.md) |
| Government | [../government/README.md](../government/README.md) |
| Architecture decisions | [../adr/README.md](../adr/README.md) |

---

## Operational chain

```
CLAN (field capture) → DAO (district review) → CAC (county verify) → Ministry (national approve)
```

Engineering reference: [../WORKFLOW_ENGINE.md](../WORKFLOW_ENGINE.md)
