#!/usr/bin/env python3
"""CSERE-blokkok alkalmazása egy fájlra: python3 reszlet-alkalmaz.py <_RESZLET.md> <célfájl>
Minden RÉGI blokknak pontosan egyszer kell előfordulnia; különben semmi nem íródik."""
import re, sys
r, cel = sys.argv[1], sys.argv[2]
md = open(r, encoding="utf-8").read()
s = open(cel, encoding="utf-8").read()
blokkok = re.findall(r"### CSERE \d+\s*\n--- RÉGI\n(.*?)\n--- ÚJ\n(.*?)\n--- VÉGE", md, re.S)
if not blokkok: print("nincs CSERE-blokk"); sys.exit(2)
uj = s; hibak = []
for i, (regi, ujs) in enumerate(blokkok, 1):
    # a kódkerítést (```), ha a modell beletette, leszedjük
    regi = re.sub(r"^```[a-z]*\n|\n```$", "", regi.strip("\n")); ujs = re.sub(r"^```[a-z]*\n|\n```$", "", ujs.strip("\n"))
    n = uj.count(regi)
    if n != 1: hibak.append(f"CSERE {i}: a RÉGI blokk {n}-szer fordul elő"); continue
    uj = uj.replace(regi, ujs)
if hibak: print("\n".join(hibak)); sys.exit(1)
open(cel, "w", encoding="utf-8").write(uj); print(f"alkalmazva: {len(blokkok)} csere → {cel}")
