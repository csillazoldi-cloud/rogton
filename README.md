# Kommunikációs munkatér

AI-központú, több ügyfélnek értékesíthető kommunikációs munkakörnyezet.
Terméktulajdonos: Portik Vilmos / Aitmetica SRL. Munkanév, a márkanév nyitott döntés.

## Mit olvass el, ebben a sorrendben

1. **[EGYUTTMUKODES.md](EGYUTTMUKODES.md)** — a közös munka szabálykönyve. Ez a kánon.
2. **[CLAUDE.md](CLAUDE.md)** — belépési pont új munkamenetnek (azonos tartalom: AGENTS.md).
3. **[docs/ATADO-1.0.md](docs/ATADO-1.0.md)** — a termék hiteles leírása: R-01…R-20 követelmények,
   A-01…A-16 elfogadási feltételek, 7 megvalósítási szakasz.
4. **[PROJEKT-BEALLITAS-TEENDOK.md](PROJEKT-BEALLITAS-TEENDOK.md)** — a beállítás állása
   és a döntési napló (D-01 …).
5. **[NAS-NAPLO.md](NAS-NAPLO.md)** — minden parancs, ami a NAS-on lefutott.

## Állapot

A munka élő állása: **https://saas.mediapartizan.ro/allapot/** (adat: `nas/public/allapot/allapot.json`, felvezetés:
`pnpm allapot …`, szabály: [docs/ALLAPOT-SZABALY.md](docs/ALLAPOT-SZABALY.md)). A csapat közös állapota a Project Hub
`kommunikacios-munkater` kártyáján (state.md); a fejlesztői napló a [HANDOFF.md](HANDOFF.md) teteje.

| Elem | Állapot |
|---|---|
| Tesztkörnyezet | `https://saas.mediapartizan.ro` — él, keresők kitiltva; minden a NAS-on TESZT |
| Kiszolgáló | Synology NAS (`transzmozaik`), dobozok: `aitmetica-saas-db`, `-app`, `-web` (nginx, 127.0.0.1:8400), `-referencia`, `-ai-hid` |
| Forráskód | ez a tárhely, `main` ág (védett: c4) |

## Kirakás (hogyan jut a kód a tesztre)

1. Rövid ágon dolgozunk, ellenőrzés (`pnpm ellenoriz`: határőr, tokenőr, keretőr, térköz, állapotőr, típus, összerakás), majd merge a `main`-re.
2. A **Gigabyte robotja** (`tools/gigabyte-robot/`) percenként nézi a `main`-t; új változatnál előbb a **c4 kapu** fut
   (`tools/kapu/README.md`: eldobható adatbázis, minden próba, „nem rosszabb” szabály), és csak zöldnél rakja ki pontosan azt a
   változatot (`nas/kirak-sha.sh`: mentés → migráció → alkalmazáscsere). Piros változat nem megy ki.
3. A NAS-on soha nincs fordítás; minden NAS-művelet előtt kötelező: [NAS-szabalyok.md](NAS-szabalyok.md).
   Kézi tartalék, ha a robot áll: `nas/kirak.sh` (lásd HANDOFF). A `docs/KIRAKAS.md` a 09-06-i, NAS-on fordító régi lánc leírása — történeti.
4. Az `nginx.conf` változását a robot nem alkalmazza magától (a web doboz nem indul újra) — lásd
   `docs/decisions/2026-10-10-fajl-100mb.md`.

Belépések, kulcsok és jelszavak **nincsenek ebben a tárhelyben** és nem is kerülhetnek bele.
