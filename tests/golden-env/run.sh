#!/usr/bin/env bash
# Внутри контейнера: копия репо без node_modules → pnpm install → pnpm golden "$@" → эталоны и отчёт обратно в /app.
set -euo pipefail
rsync -a --delete --exclude node_modules --exclude out --exclude renders --exclude .git --exclude data/raw /app/ /work/
cd /work
pnpm config set store-dir /pnpm-store >/dev/null
pnpm install --frozen-lockfile --prefer-offline >/dev/null
(cd remotion && npx remotion browser ensure >/dev/null)
status=0
pnpm golden "$@" || status=$?
mkdir -p /app/out/golden
rsync -a /work/out/golden/ /app/out/golden/
rsync -a --delete /work/tests/golden/ /app/tests/golden/
exit $status
