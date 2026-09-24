#!/usr/bin/env bash
# Replays the P0 exploits against the live-equivalent schema + containment migration.
set -euo pipefail
RLS_UNTIL=20260729215000 RLS_SUITE=supabase/tests/p0_containment.sql bash "$(dirname "$0")/run-rls-behavior.sh"
