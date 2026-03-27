#!/bin/sh

set -eu

truthy() {
  case "${1:-}" in
    1|true|TRUE|yes|YES|on|ON)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

run_prisma_migrations() {
  echo "Applying Prisma migrations..."
  node scripts/run-with-next-env.mjs ./node_modules/.bin/prisma migrate deploy
}

run_sandbox_bootstrap() {
  if [ -z "${SANDBOX_BOOTSTRAP_DEFAULT_PASSWORD:-}" ]; then
    echo "SANDBOX_BOOTSTRAP_DEFAULT_PASSWORD must be set when RUN_SANDBOX_BOOTSTRAP=true." >&2
    exit 1
  fi

  echo "Bootstrapping sandbox data..."
  node scripts/run-with-next-env.mjs node prisma/sandbox-bootstrap.mjs
}

container_command="${CONTAINER_COMMAND:-web}"

case "$container_command" in
  web)
    if truthy "${RUN_DB_MIGRATIONS:-false}"; then
      run_prisma_migrations
    fi

    if truthy "${RUN_SANDBOX_BOOTSTRAP:-false}"; then
      run_sandbox_bootstrap
    fi

    echo "Starting Trellis web app on port ${PORT:-3000}..."
    exec npm run start
    ;;
  migrate)
    run_prisma_migrations
    ;;
  bootstrap)
    run_sandbox_bootstrap
    ;;
  *)
    echo "Unknown CONTAINER_COMMAND: $container_command" >&2
    echo "Supported values: web, migrate, bootstrap" >&2
    exit 1
    ;;
esac
