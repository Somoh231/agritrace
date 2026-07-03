# Incident Response Runbook

**AgriVault Pilot — Liberia Ministry of Agriculture**

**Related:** [OBSERVABILITY.md](./OBSERVABILITY.md) · [SECURITY_RELEASE_CHECKLIST.md](./SECURITY_RELEASE_CHECKLIST.md) · [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)

---

## Severity levels

| Level | Definition | Examples | Target response |
|-------|------------|----------|-----------------|
| **SEV-1** | Complete outage or active data breach | App down, auth bypass, cross-tenant leak | 15 min acknowledge, 1 hr mitigate |
| **SEV-2** | Major feature broken for all users | Maps down, workflows cannot submit | 30 min acknowledge, 4 hr mitigate |
| **SEV-3** | Degraded or subset impact | Rate limit false positives, single role blocked | Same business day |
| **SEV-4** | Minor / cosmetic | UI glitch, non-blocking error | Next sprint |

---

## Escalation path (pilot)

1. **Detector** — uptime monitor, Sentry alert, or user report
2. **On-call engineer** — triage, gather `x-request-id`, Sentry issue link, Vercel deployment ID
3. **Engineering lead** — SEV-1/2 decisions, rollback authority
4. **Ministry liaison** — stakeholder comms for SEV-1/2 affecting field operations
5. **Security** — any suspected breach or credential exposure

**Channels:** Define Slack/email in your pilot comms plan. Do not post secrets in incident threads.

---

## First 15 minutes

1. **Acknowledge** alert; assign incident commander (IC)
2. **Classify** severity using table above
3. **Gather context:**
   - Vercel deployment URL + commit SHA (`VERCEL_GIT_COMMIT_SHA`)
   - Sentry issue URL + first seen time
   - Sample `x-request-id` from failing request
   - `GET /api/health` response
4. **Stabilize:**
   - SEV-1 auth/data: consider immediate rollback (see below)
   - Dependency outage: check [status.supabase.com](https://status.supabase.com), Mapbox status, Vercel status
5. **Communicate** status to ministry liaison if field operations affected

---

## Rollback procedure

1. Vercel → Project → **Deployments**
2. Find last known-good production deployment
3. **Promote to Production** (instant; no rebuild required)
4. Verify `/api/health`, login, one workflow action
5. Confirm Sentry error rate drops
6. Document rollback SHA in incident channel

**Do not** run destructive DB migrations during rollback. App rollback does not revert database state.

---

## Data incident procedure

Suspected unauthorized access, export leak, or credential exposure:

1. **Contain**
   - Rotate exposed keys immediately (Supabase service role, Anthropic, Mapbox if applicable)
   - Disable compromised user accounts in Supabase Auth
   - If export abuse: temporarily block at WAF/Vercel firewall (rate limit rules)
2. **Assess**
   - Supabase logs: Auth, API, Postgres
   - Audit `audit_log` table for anomalous admin actions
   - Sentry breadcrumbs with request IDs
3. **Notify**
   - Engineering lead + security + ministry data owner
   - Legal/comms per national requirements
4. **Recover**
   - Follow [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) if data corruption confirmed
5. **Post-incident**
   - Mandatory postmortem within 5 business days (template below)

---

## Request ID usage

1. Reproduce issue in browser → Network → copy `x-request-id` from failing API call
2. Vercel → Logs → filter by header or search request ID string
3. Sentry → issue → search tags/extra for same ID (when instrumented)
4. Include ID in all incident timeline entries

---

## Common scenarios

### Health check failing

- Check env vars in Vercel (Supabase URL/anon key)
- Supabase project paused or network issue
- Recent deploy — compare with rollback candidate

### 429 spike

- Legitimate traffic vs abuse (check IP distribution in Vercel)
- Redis/KV misconfigured → falls back to per-instance memory (see [SECURITY.md](./SECURITY.md))
- Tune policies in `rate-limit-policies.ts` only after IC approval

### Sentry flood after deploy

- Identify new release in Sentry
- Rollback if regression; else fix-forward with hotfix branch

### PDF export 403 for valid user

- Verify role in `profiles.role` matches `canExportReport()` in `require-api-session.ts`
- Do not weaken RBAC — fix role assignment or UI entry point

---

## Pilot support procedure

1. User submits issue via ministry support channel with: role, screen, time (UTC), screenshot
2. Support collects `x-request-id` if API error shown
3. L1: verify known limitations in [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)
4. L2: engineering triage in Sentry + Vercel logs
5. SEV-3+ opens incident thread with IC

---

## Postmortem template

```markdown
# Postmortem: [Title]

**Date:** YYYY-MM-DD  
**Severity:** SEV-N  
**Duration:** HH:MM  
**IC:** Name  
**Authors:** Names  

## Summary
One paragraph.

## Impact
- Users affected:
- Data affected:

## Timeline (UTC)
| Time | Event |
|------|-------|
| | Detection |
| | Mitigation |
| | Resolved |

## Root cause

## What went well

## What went wrong

## Action items
| Action | Owner | Due |
|--------|-------|-----|
| | | |

## Lessons learned
```

---

## External contacts

| Service | Status / support |
|---------|------------------|
| Vercel | status.vercel.com |
| Supabase | status.supabase.com, dashboard support |
| Mapbox | status.mapbox.com |
| Sentry | sentry.io status |
| Anthropic | status.anthropic.com |

---

## Document maintenance

Review this runbook after every SEV-1/2 incident and before each pilot phase gate.
