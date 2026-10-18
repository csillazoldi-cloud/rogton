# A NAS (transzmozaik) üzemeltetési szabályai

**Minden projektre érvényes, amely ezen a gépen fut.**
Készült: 2026. szeptember 6. · A 2026-09-06-i leállás tanulságaiból

Ezt a szöveget érdemes betenni minden projekt Claude-utasításai közé (`CLAUDE.md` vagy a projekt leírása), hogy minden munkamenet eszerint dolgozzon.

---

## A helyzet

A NAS-on **27 konténer fut öt projekthez** — marosvásárhelyiek 8, Forgatag 10, Misszió 3, Benevolum 2, Mediapartizán/n8n 2 —, plusz a Jellyfin és a nyomtatószolgáltatás. Mindez **16 GB memórián**. A gépnek nincs tartaléka.

## Mi történt 2026. szeptember 6-án

A Docker vezérlőprogramja **négy nap alatt 8,6 GB-ot halmozott fel a 16-ból**. A valószínű ok: elszivárgó állapotellenőrző („élsz még?") munkamenetek, amelyeket a program nem takarított el.

Ami ebből következett:

1. Elfogyott a memória.
2. Kiszorult a lemez-gyorsítótár.
3. A fájlrendszernek **minden egyes íráshoz** millió nyilvántartás-bejegyzést kellett a lemezről visszaolvasnia.
4. Egy írási művelet **122–164 másodperc** lett a szokásos ezredmásodpercek helyett.
5. A terhelés **564** volt, miközben a processzor 1%-on ült.
6. Egy újraindítás **35 percig** tartott — még leállni sem tudott a gép, mert ahhoz is írni kell.

**Nem ezek okozták** — mindegyik kizárva méréssel:

- nem a lemezek (nulla hibaüzenet; mindhárom Seagate IronWolf Pro 24 TB, egyik sem idősebb fél évnél)
- nem a tárhely (az egyik kötet 33%-os, a másik 9%-os)
- nem a pillanatfelvételek (összesen 3 és 2 darab)
- nem a lemeztömbök (mind ép)
- nem rendszerfrissítés (ilyen nem futott)
- nem a sok szolgáltatás (nyugalomban a marosvásárhelyiek nyolc konténere 777 MB, a Forgatag tíze 597 MB)

---

## Szabályok

### 1. Nehéz munka előtt mérni kell

Telepítés, kódösszerakás, indexelés, tömeges átalakítás, mentés, képtár olvasása, tanítás előtt **kötelező**:

```
free -m
uptime
```

**3 GB szabad memória alatt vagy 20 fölötti terhelésnél a munka nem indul el.** Előbb meg kell nézni, mi fut.

### 2. Nem telepítünk egymás után többször

A változásokat összevárjuk és egyben tesszük ki. Minden telepítés egy teljes újra-összerakás — ez a legnagyobb memóriaigényű művelet a gépen.

**Mentés a migráció előtt (2026-09-30, R-16 TERV 1.7 R1):** minden kirakás, amelyben új adatbázis-migráció van, a migráció
előtt teljes mentést ír ide: `/volume2/docker/aitmetica-saas/adatok/postgres/mentes/` (`nas/adatbazis/migral.sh`). Ha a mentés
nem sikerül, a migráció nem fut. Részletek és visszaállítás: `docs/MENTES.md`, 2026-09-30-i kiegészítés.

### 3. A projektek nem tudnak egymásról

A marosvásárhelyiek és a Forgatag is tud magától újraépülni. Két egyidejű összerakás ugyanazon a 16 GB-on megfogja a gépet.

### 4. Párhuzamos munkamenetek

Mielőtt bármelyik munkamenet hosszú vagy nehéz munkába kezd ezen a gépen, **írjon egy sort a projektnaplóba** arról, mit indít és meddig tart, és nézze meg, fut-e már ott valami. Ha igen: vár, vagy megkérdezi, melyik menjen előbb.

### 5. Lassú gépet nem kapcsolunk ki

A lassulás magától nem okoz kárt. Az áramtalanítás írás közben igen.

### 6. A „rendszer készenlétbe áll" nem hibaüzenet

Leállás és karbantartás közben a DSM mindenkit kizár a felületről. A parancssor ilyenkor még él — azon lehet megnézni, mi történik valójában.

---

## Amit NEM kell csinálni

**Memóriát bővíteni.** Nem a memória volt kevés, hanem egy program szemetelt. Nagyobb memóriával ugyanez megtörténne, csak hat nap alatt négy helyett.

**Hetente újraindítani a gépet.** Az elfedi a hibát, nem szünteti meg. Ha mégis ez marad az egyetlen út, az már döntés, nem megoldás — és tudni kell róla.

---

## Hol keresd, ha baj van

| Mit akarsz tudni | Hol van |
|---|---|
| Ki és mikor lépett be | DSM → Naplóközpont → Kapcsolat |
| Melyik ütemezett feladat futott, meddig | DSM → Feladatütemező → jobb gomb → Eredmény megtekintése |
| Mennyi memória szabad most | parancssor: `free -m` |
| Dolgozik-e valami | parancssor: `uptime` (a terhelés árulkodik) |
| Mi ragadt bele a lemezbe | `ps -eo stat,etime,comm \| awk '$1 ~ /^D/'` |
