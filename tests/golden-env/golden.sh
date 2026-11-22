#!/usr/bin/env bash
# pnpm golden:docker [--update] [<id>…] — golden в единой Linux-среде (как в CI). Нужен Docker.
# Платформа — родная (Мак M: arm64, быстро; CI: amd64). GOLDEN_PLATFORM=linux/amd64 — как CI, под эмуляцией (очень медленно).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PLATFORM="${GOLDEN_PLATFORM:-}"
TAG="anek-golden"
PARGS=""
if [ -n "$PLATFORM" ]; then PARGS="--platform $PLATFORM"; TAG="anek-golden-$(echo "$PLATFORM" | tr '/' '-')"; fi
docker build --quiet $PARGS -t "$TAG" "$ROOT/tests/golden-env" >/dev/null
exec docker run --rm $PARGS -v "$ROOT":/app -v "$TAG-pnpm":/pnpm-store "$TAG" "$@"
