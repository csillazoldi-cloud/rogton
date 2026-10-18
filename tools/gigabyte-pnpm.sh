#!/bin/bash
# pnpm a Gigabyte-on docker dobozban (a gazdagépen nincs node). Használat: saas-pnpm.sh <pnpm parancs...>
# A node_modules a repóban marad (a doboz csak a PATH-ot és a pnpm tárat adja), így a fordítás és az ellenőrzés
# ugyanazt látja. A pnpm tár a saas-pnpm-tar kötetben, hogy ne töltsön újra.
set -euo pipefail
cd "$HOME/projektek/saas"
docker run --rm -i -v "$PWD:/w" -v "$HOME/.saas-pnpm-tar:/pnpm-tar" -w /w -e PNPM_HOME=/pnpm -e npm_config_store_dir=/pnpm-tar \
  -e CI=1 --user "$(id -u):$(id -g)" -e HOME=/tmp node:24-alpine \
  sh -c 'corepack enable >/dev/null 2>&1 || true; export COREPACK_HOME=/tmp/corepack; export PATH=/tmp/corepack-bin:$PATH; mkdir -p /tmp/corepack-bin; corepack enable --install-directory /tmp/corepack-bin >/dev/null 2>&1; pnpm "$@"' sh "$@"
