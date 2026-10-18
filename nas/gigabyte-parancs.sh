#!/bin/bash
# Egyetlen belepesi pont a Gigabyte gazdagepehez a Cowork-hid munkakornyezetebol.
# Parja a nas-parancs.sh-nak. A kulcs a vaultban van, es a gazdagepen `command=` megkotessel
# fut: csak az `epit`, `kuld` es `allapot` muveletek indithatok vele, semmi mas.
#
# Hasznalat:  bash gigabyte-parancs.sh "epit saas"
#             bash gigabyte-parancs.sh "kuld saas" > /tmp/kep.tgz
#             bash gigabyte-parancs.sh "allapot"
#
# 2026-09-11 ota Claude MAGAN A GIGABYTE-on fut (tavvezerles). Ilyenkor nincs mit ssh-zni:
# a fordito ugyanazon a gepen van, ezert kozvetlenul hivjuk. Kivulrol (Cowork-hid, Mac)
# tovabbra is az ssh-s ut megy, valtozatlan hasznalattal.
set -euo pipefail
ITT="$(cd "$(dirname "$0")" && pwd)"
KULCS=${GIGABYTE_KULCS:-$HOME/eszkoz/gigabyte-kulcs}
GAZDA=${GIGABYTE_GAZDA:-gigabyte@10.0.2.2}   # a hid halozataban a gazdagep az atjaro

if [ -x "$ITT/gigabyte-forditas.sh" ] && [ -d "$HOME/projektek/saas/.git" ]; then
  exec env SSH_ORIGINAL_COMMAND="$1" bash "$ITT/gigabyte-forditas.sh"
fi

if [ ! -f "$KULCS" ]; then
  echo "MEGALLITVA: nincs kulcs itt: $KULCS" >&2
  echo "Masold at a vaultbol: cp ~/mnt/SaaS/vault/gigabyte-forditas-kulcs $KULCS && chmod 600 $KULCS" >&2
  exit 2
fi

exec ssh -i "$KULCS" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new \
  -o ConnectTimeout=10 "$GAZDA" "$1"
