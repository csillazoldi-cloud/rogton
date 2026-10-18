# SaaS projekt — belépési pont

Ha ezt olvasod, ez az első dolgod. Ne derítsd fel a projektet, olvasd el ezeket:

1. `EGYUTTMUKODES.md` — hogyan dolgozunk együtt. Ez Vilmos szava, nem ajánlás.
2. `PROJEKT-BEALLITAS-TEENDOK.md` — a beállítás állása és a döntési napló (D-01, D-02, …).
3. `docs/ATADO-1.0.md` — a termék hiteles leírása: R-01…R-20 követelmények,
   A-01…A-16 elfogadási feltételek, 7 megvalósítási szakasz.
4. `HANDOFF.md` — hol tart a munka most (a legfrissebb legfelül).
5. `NAS-szabalyok.md` — a NAS üzemeltetési szabályai. **Kötelező**, mielőtt bármit telepítesz vagy nehezet futtatsz rajta.
6. `docs/MODULSZABALY.md` — hogyan épül minden újrahasznosítható elem. **Kötelező** új modul indítása előtt.
7. `docs/ALLAPOT-SZABALY.md` — az állapotlap törvénye. **Kötelező**, minden munkamenetben.

## Mi ez a projekt

Több ügyfélnek eladható, iparágfüggetlen, AI-központú **kommunikációs munkakörnyezet**.
Munkanév: „Kommunikációs munkatér". Terméktulajdonos: Portik Vilmos / Aitmetica SRL.
Nem posztgenerátor és nem ügynökségi gyártásgyorsító: a kommunikációs vezető teljes munkáját
támogatja, a cég saját profiljára támaszkodva.

Építési sorrend: **előbb a közös profil + onboarding** menjen végig, **utána** az első önálló
modul (hír-/sajtófigyelő), ami két különböző rendszerben ugyanazzal a maggal működik.

## Alapkövetelmények, amiket nem lehet kiszervezni

- hordozható, verziózott modulok — a korábbi worklog bukásának tanulsága ez a projekt vezérelve;
- a hiteles ügyfélprofil a fő alkalmazás adatbázisában él, az onboarding csak előkészíti;
- teljes témázhatóság: nincs komponensbe égetett szín, betű, lekerekítés;
- HU / RO / EN felület az első naptól;
- cserélhető felhős és helyi AI-szolgáltató;
- több ügyfél adata az első adatmodelltől kezdve elválasztva.

## Hol mi van

| Mi | Hol |
|---|---|
| Munkamappa (ez) | `E:\AI\SynologyDrive\SaaS` a gépén, a Cowork hídon át elérhető |
| Belépések | `vault/` — soha nem kerül chatbe, kódba, GitHubra, felhőbe |
| Forráskód | privát GitHub tárhely (D-01) |
| Munkamásolat és teszt | a `transzmozaik` NAS-on, Tailscale mögött (D-01) |
| Feltöltés a tesztre | Claude végzi magától, kulccsal a vaultból (D-02) |
| Helyi AI | Dell, Ollama, `http://100.89.253.13:11434` |

## Az állapotlap — kötelező

**Ami nincs az állapotlapon, az nem történik meg.**
Minden munka a KEZDÉSEKOR kerül fel, nem a végén — kód, rajzkör, ellenőrzés, döntés,
elakadás egyaránt. A lap: https://saas.mediapartizan.ro/allapot/, az adat:
`nas/public/allapot/allapot.json`, a felvezetés: `pnpm allapot …`.
A részletek: `docs/ALLAPOT-SZABALY.md`. Az `ellenoriz` lánc nem enged kiadni
elavult állapotlappal.

## Amit ne csinálj

- Ne dolgozz úgy, hogy az állapotlapon nem látszik. Ha nincs fent, nem történik meg.

- Ne kezdj kódolni megbeszélés nélkül; és ne halogasd, ha már meg van beszélve.
- Ne rakj a képernyőre olyat, ami nincs a rajzon.
- Ne mondd, hogy kész, amíg nincs kint a teszten és nincs róla képernyőkép.
- Ne állítsd tényként, amit csak dokumentumban olvastál — mérd meg.
