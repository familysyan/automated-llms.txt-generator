#!/usr/bin/env bash
set -euo pipefail

MIGRATE_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTAINER="profound-postgres-1"
DB_NAME="profound"
DB_USER="profound"

psql_cmd() {
  docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" "$@"
}

# Ensure the tracking table exists
psql_cmd -q <<'SQL'
CREATE TABLE IF NOT EXISTS _migration (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
SQL

usage() {
  echo "Usage: $0 <up|down|status> [migration-name]"
  echo ""
  echo "  up              Apply all pending migrations"
  echo "  up  0001-xxx    Apply up to and including this migration"
  echo "  down 0001-xxx   Revert a specific migration"
  echo "  status          Show applied and pending migrations"
  exit 1
}

applied() {
  psql_cmd -tAq -c "SELECT name FROM _migration ORDER BY id"
}

cmd_status() {
  echo "Applied migrations:"
  applied | while read -r name; do
    [ -z "$name" ] && continue
    echo "  ✓ $name"
  done

  echo ""
  echo "Pending migrations:"
  local applied_list
  applied_list=$(applied)
  for dir in "$MIGRATE_DIR"/[0-9]*/; do
    [ -d "$dir" ] || continue
    name=$(basename "$dir")
    if ! echo "$applied_list" | grep -qx "$name"; then
      echo "  · $name"
    fi
  done
}

cmd_up() {
  local target="${1:-}"
  local applied_list
  applied_list=$(applied)

  for dir in "$MIGRATE_DIR"/[0-9]*/; do
    [ -d "$dir" ] || continue
    name=$(basename "$dir")

    if echo "$applied_list" | grep -qx "$name"; then
      continue
    fi

    echo "Applying $name ..."
    psql_cmd -q -v ON_ERROR_STOP=1 < "$dir/up.sql"
    psql_cmd -q -c "INSERT INTO _migration (name) VALUES ('$name')"
    echo "  ✓ $name applied"

    if [ -n "$target" ] && [ "$name" = "$target" ]; then
      break
    fi
  done

  echo "Done."
}

cmd_down() {
  local target="${1:?Specify a migration to revert}"

  if ! applied | grep -qx "$target"; then
    echo "Migration '$target' is not applied."
    exit 1
  fi

  local dir="$MIGRATE_DIR/$target"
  if [ ! -f "$dir/down.sql" ]; then
    echo "No down.sql found for $target"
    exit 1
  fi

  echo "Reverting $target ..."
  psql_cmd -q -v ON_ERROR_STOP=1 < "$dir/down.sql"
  psql_cmd -q -c "DELETE FROM _migration WHERE name = '$target'"
  echo "  ✓ $target reverted"
}

case "${1:-}" in
  up)     cmd_up "${2:-}" ;;
  down)   cmd_down "${2:-}" ;;
  status) cmd_status ;;
  *)      usage ;;
esac
