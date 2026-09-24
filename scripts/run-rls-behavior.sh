#!/usr/bin/env bash
# Behavioral RLS suite against a DISPOSABLE local Supabase Postgres container.
# Never points at a shared or production project.
#
#   npm run test:rls:behavior                 # all migrations
#   RLS_UNTIL=20260619120000 npm run test:rls:behavior   # replay live-remote state only
set -euo pipefail

IMAGE="${RLS_PG_IMAGE:-public.ecr.aws/supabase/postgres:17.6.1.166}"
NAME="agrivault_rls_behavior_$$"
UNTIL="${RLS_UNTIL:-99999999999999}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

command -v docker >/dev/null || { echo "docker is required for the behavioral RLS suite" >&2; exit 2; }

docker run -d --name "$NAME" -e POSTGRES_PASSWORD=disposable "$IMAGE" >/dev/null
for _ in $(seq 1 60); do
  docker exec "$NAME" pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1 && break
  sleep 2
done
sleep 3

psql_run() { docker exec -i -e PGOPTIONS=--client-min-messages=${PG_MIN_MESSAGES:-warning} "$NAME" psql -U postgres -h 127.0.0.1 -v ON_ERROR_STOP=1 -q "$@"; }

# The image bootstrap auth.uid() only reads request.jwt.claim.sub; hosted GoTrue
# reads both forms. The suite sets both, so no shim is required.
for f in "$ROOT"/supabase/migrations/*.sql; do
  version="$(basename "$f" | cut -d_ -f1)"
  if [[ "$version" > "$UNTIL" ]]; then
    echo "skip  $(basename "$f") (after RLS_UNTIL)"
    continue
  fi
  echo "apply $(basename "$f")"
  psql_run < "$f"
done

psql_run < "$ROOT/${RLS_SUITE:-supabase/tests/rls_behavior.sql}"
