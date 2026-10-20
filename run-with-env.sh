#!/bin/bash
# Wrapper that loads .env explicitly and runs the given command.
# Use: ./run-with-env.sh bun run dev
#      ./run-with-env.sh bun run db:push
#      ./run-with-env.sh bun run scripts/seed.ts

set -euo pipefail

ENV_FILE="/home/z/my-project/.env"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

cd /home/z/my-project
exec "$@"
