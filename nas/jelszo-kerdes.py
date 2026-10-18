#!/usr/bin/env python3
# Az ssh jelszo-kerdesere felel: a jelszot a vaultbol olvassa es a kimenetre adja.
# Titok NINCS benne, csak a vault utvonala. Korabban /tmp/ap.py volt — a /tmp
# egy gep-ujraindulassal elveszett, ezert kerult a tarhelybe.
#
# A vault ket helyen allhat: a Gigabyte-on (ott dolgozunk 2026-09-11 ota) a
# SynologyDrive alatt, a regi Cowork-hid munkakornyezeteben a ~/mnt/SaaS alatt.
import io, os, sys

HELYEK = [os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "vault"),  # a tarhely melletti vault (a Dellen, 2026-09-12-tol)
          "~/SynologyDrive/SaaS/vault", "~/mnt/SaaS/vault"]
ut = ""
for h in HELYEK:
    p = os.path.expanduser(h + "/nas-belepes.txt")
    if os.path.isfile(p):
        ut = p
        break
if not ut:
    sys.stderr.write("Nincs vault egyik helyen sem: %s\n" % ", ".join(HELYEK))
    sys.exit(1)

for sor in io.open(ut, encoding="utf-8-sig"):
    if sor.split(":", 1)[0].strip().lower() == "jelszo":
        sys.stdout.write(sor.split(":", 1)[1].strip() + "\n")
        break
else:
    sys.stderr.write("A vaultban nincs 'jelszo:' sor: %s\n" % ut)
    sys.exit(1)
