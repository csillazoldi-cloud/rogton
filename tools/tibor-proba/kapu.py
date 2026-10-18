#!/usr/bin/env python3
"""Kapu (2026-10-02): a teljes kirakás-kapu egy parancsban — próba → bíráló → ismétlés → zár.

Miért: a Sonnet bíráló lapnézetenként ±1–2 pontot ingadozik a 4–6-os sávban, így egy-egy teljes
futás véletlen lapokat zár pirosra. A szabály (docs/decisions/2026-10-01-zar-ismetles-szabaly.md,
kibővítve 10-02): MINDEN zárat záró piros csak 3 bírálat 2-es többségével számít. Ezt a láncot
ez a program futtatja le, egy hívással:

  1. tibor_proba.py  — élő képernyőképek és mérés (42 lapnézet)
  2. tibor_biro.py   — 1. bírálat minden nézeten
  3. zar.py          — ha zárva: a záró pirosok kigyűjtése
  4. ismetlo.py      — a záró pirosok +2 bírálata, többségi ítélet
  5. zar.py újra     — a végső szó (--frissit tovább adva)

Használat:  ANTHROPIC_API_KEY="$(cat ~/saas/vault/anthropic-kulcs)" \\
            python3 kapu.py --ki <kimenet_mappa> [--cim ...] [--frissit]
Kilépési kód: a záró zar.py kódja (0 = NYITVA, 1 = ZÁRVA), 2 = a lánc egy lépése elromlott.
"""
import argparse, os, re, subprocess, sys

ITT = os.path.dirname(os.path.abspath(__file__))
BIRO = os.path.join(ITT, "..", "tibor-biro")


def fut(nev, parancs, tures=()):
    print(f"\n=== kapu · {nev} ===", flush=True)
    k = subprocess.run([sys.executable] + parancs)
    if k.returncode not in (0,) + tuple(tures):
        print(f"kapu: a(z) {nev} lépés hibával állt le ({k.returncode}) — itt megállunk.", file=sys.stderr)
        sys.exit(2)
    return k.returncode


def zaro_pirosak(ki):
    """A zar.md 'ZÁRVA' felsorolásából a lapnézetek (lap/nezet), ismétlés nélkül."""
    utvonal = os.path.join(ki, "zar.md")
    nevek = []
    for sor in open(utvonal):
        m = re.match(r"- ([a-z0-9-]+/[a-z]+):", sor)
        if m and m.group(1) not in nevek:
            nevek.append(m.group(1))
    return nevek


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ki", required=True)
    ap.add_argument("--cim", default="")
    ap.add_argument("--allapot", default="")
    ap.add_argument("--frissit", action="store_true")
    a = ap.parse_args()
    if not (os.environ.get("ANTHROPIC_API_KEY") or "").strip():
        print("kapu: nincs ANTHROPIC_API_KEY — a bíráló Ollamára esne vissza; add meg a vault kulcsát.", file=sys.stderr)
        sys.exit(2)
    proba = [os.path.join(ITT, "tibor_proba.py"), "--ki", a.ki]
    if a.cim:
        proba += ["--cim", a.cim]
    if a.allapot:
        proba += ["--allapot", a.allapot]
    fut("próba", proba, tures=(1,))  # az 1 (van piros lapnézet a mérésen) nem állítja meg a láncot: a zár dönt
    fut("bíráló", [os.path.join(BIRO, "tibor_biro.py"), "--ki", a.ki], tures=(1,))
    zar = [os.path.join(ITT, "zar.py"), "--ki", a.ki] + (["--frissit"] if a.frissit else [])
    if fut("zár (1. kör)", zar, tures=(1,)) == 0:
        sys.exit(0)
    nevek = zaro_pirosak(a.ki)
    if not nevek:
        sys.exit(1)  # nem piros miatt zárt (pl. próba-romlás) — az ismétlés ezen nem segít
    fut("ismétlés (3 futás többsége): " + ", ".join(nevek),
        [os.path.join(BIRO, "ismetlo.py"), "--ki", a.ki, "--nezetek", ",".join(nevek)], tures=(1,))
    sys.exit(fut("zár (végső)", zar, tures=(1,)))


if __name__ == "__main__":
    main()
