# Personal contact data — exposure assessment

Date: 2026-09-25. No personal values are reproduced in this document.

## What was found

Five contact fields for one named person (name, role, email, phone,
locations). They were introduced in commit `1bb6c5a` (2026-04-29).

## Current source

- `feat/agrivault-corporate-site-redesign`: removed in `a17767c`
  (empty defaults). No other git-tracked file on this branch contains any of
  the values. The only other copy in the working tree was the git-ignored
  local build output (`.next/server`), which has been deleted. Scratchpad,
  test results and reports: none.

## Where the values still exist

| Location | Status |
| --- | --- |
| **Live production site** (agrivaultdata.com, built from `main`) | **Publicly displayed** (read-only check 2026-09-25): `/contact` shows name, email, phone, locations; `/about` shows name, email, locations; `/` and `/platform` show email and locations. |
| `origin/main` tip | 15 files: `src/lib/growth/content.ts`, `src/lib/supabase/temp-demo-profile-fallback.ts`, `src/app/about/page.tsx`, `src/components/agrivault/site/PublicFooter.tsx` and 11 files under `src/content/agrivault_site/`. |
| `origin/audit/rc1-360-agentic-qa` tip | 14 of the same files. |
| `origin/chore/institutional-ui-upgrade` tip | Same 15 files as `main`. |
| `origin/feat/agrivault-corporate-site-redesign` | Clean once `a17767c` is pushed. |
| Git history | 163 of 169 commits contain at least one value in a snapshot. Commits that add or remove values: `1bb6c5a`, `69a5e9d`, `b58ecff`, `9a5cfe1`, `bd8a355` (removed the legacy marketing files), `a17767c` (this cleanup). |
| Tags | None contain the data (there are no tags). |
| Forks | None (0 forks). |
| GitHub | Public repository: the values are visible in the current `main` source and in history. |

## Recommendation

**A history rewrite is recommended only after the live site stops
publishing the data — not now.** While agrivaultdata.com displays the same
details, rewriting history removes nothing that a visitor cannot already see.

Order of operations (each step needs the owner's explicit approval):

1. Decide whether this contact information is meant to be public. If it is
   (a deliberate business contact), no rewrite is needed; keep it out of
   source anyway and manage it as content.
2. If it is not: stop production from displaying it. That requires a change
   on `main` and a production deployment (outside this branch's mandate).
   Deploying the redesign would do it, because the redesign does not render
   these fields.
3. Then rewrite history with the procedure below.

## History rewrite procedure (not executed — requires approval)

Run from a machine with push rights, after telling every collaborator.

```bash
# 0. Freeze: no pushes or merges to Somoh231/agritrace until step 6 is done.
# 1. Take a private backup and a working mirror.
git clone --mirror https://github.com/Somoh231/agritrace.git agritrace-backup.git   # keep private, off GitHub
git clone --mirror https://github.com/Somoh231/agritrace.git agritrace-rewrite.git
cd agritrace-rewrite.git
# 2. Write ../replacements.txt OUTSIDE any repository, one line per value:
#      <exact value>==>[redacted]
#    Never commit, paste or share this file; delete it afterwards.
python3 -m pip install --user git-filter-repo
git filter-repo --replace-text ../replacements.txt
# 3. Verify locally that no value remains (prints only a count).
for v in $(cut -d= -f1 ../replacements.txt); do git log --all --oneline -S "$v" | wc -l; done
# 4. Push the rewritten refs (branches, then tags).
git push --force --all origin
git push --force --tags origin
# 5. Ask GitHub Support to purge cached views and unreferenced commits of the
#    repository (old SHAs stay reachable by direct URL until they do).
# 6. Every clone (developers, CI, Vercel) must re-clone; old SHAs, open PRs
#    and the local stash become invalid. Redeploy previews from the new SHAs.
shred -u ../replacements.txt 2>/dev/null || rm -P ../replacements.txt
```

Caveats: commit SHAs change on every rewritten branch, including `main`
(production deploys from it); do this only with the production change from
step 2 already merged, or `main` would start rendering the redaction marker.
