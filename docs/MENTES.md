# Mentés és visszaállítás

**Dokumentum:** 1.0 · 2026-09-09 · E-35 · a 7. szakasz (Pilotkész) része
**Döntés mögötte:** D-18 (Vilmos, 2026-09-09) — **a mentés a NAS másik kötetére megy.**

---

## 1. Mit mentünk, és mit NEM

| Mentjük | Hol van |
|---|---|
| **A teljes adatbázis** (fiókok, szervezetek, profilok, arculatok, témák, feliratok, hírfigyelő-adatok) | `db-ÉÉÉÉHHNN-ÓÓPP.sql.gz` |
| **A második rendszer adatai** (referencia-host SQLite-fájlja) | `referencia-ÉÉÉÉHHNN-ÓÓPP.sqlite.gz` |

| **NEM mentjük** | Miért, és mi a teendő |
|---|---|
| **Jelszavak és kulcsok** (a NAS `.env` fájlja, az AI-belépők) | Szándékosan: titok nem kerül mentésfájlba. Ezek a **vaultban** vannak Vilmos gépén (`SaaS/vault/`), és a Synology Drive szinkronizálja. **A vault mentése Vilmos dolga.** |
| A forráskód | A GitHubon van, az a mentése |
| A dobozok képei | Újraépülnek a forrásból |
| Feltöltött fájlok | Ilyen még nincs a rendszerben |

**Ha az adatbázis-mentést visszatöltöd, de a `.env` fájl elveszett, a rendszer nem indul el** —
a két jelszó nélkül a doboz nem tud csatlakozni. Ezért a vault legalább olyan fontos, mint a mentés.

---

## 2. Hova megy

```
/volume1/homes/Portik/mentesek/aitmetica-saas/
    db-20260909-0700.sql.gz          ← az adatbázis
    referencia-20260909-0700.sqlite.gz  ← a második rendszer
    mentes-naplo.txt                 ← mikor, mekkora, mi lett az eredmény
    _torolni/                        ← a lejárt mentések (törölni Vilmos szokta)
```

**A projekt a `volume2`-n él, a mentés a `volume1`-en** — így egy kötet elvesztése nem viszi el mindkettőt.

> **Amit ez a mentés NEM véd:** tűz, lopás, a teljes gép elvesztése, vagy egy olyan hiba, ami
> mindkét kötetet érinti. Házon kívüli mentés külön döntés — a pilot előtt érdemes elővenni.

**Megőrzés:** az utolsó **7 napi** mentés, plusz a **vasárnapiak 4 hétig**. Ami lejár, az nem
törlődik, hanem a `_torolni/` mappába kerül (D-03: a gépen nem törlünk).

---

## 3. Napi mentés — hogyan indul magától

A szkript kész, de a **napi indítást egyszer be kell állítani a Synology felületén.**
Ez Vilmos két perce:

1. **DSM → Vezérlőpult → Feladatütemező**
2. **Létrehozás → Ütemezett feladat → Felhasználó által megadott parancsfájl**
3. **Általános** fülön:
   - Feladat neve: `SaaS mentés`
   - Felhasználó: **root**
4. **Ütemezés** fülön: naponta, **hajnali 4:00** (ilyenkor a NAS a legüresebb)
5. **Feladatbeállítások** fülön, a „Felhasználó által megadott parancsfájl" mezőbe:

```
bash /volume2/docker/aitmetica-saas/forras/nas/mentes.sh
```

6. Kipipálni, hogy hibánál küldjön e-mailt (ha van beállított cím).

**Amíg ez nincs beállítva, a mentés nem fut magától.** Kézzel bármikor indítható (lásd lent).

---

## 4. Kézi indítás

**Mentés most:**

```
bash nas/kirak.sh   # csak ha friss forrás kell a NAS-ra
sudo bash /volume2/docker/aitmetica-saas/forras/nas/mentes.sh
```

**Visszaállítási próba** (nem nyúl az éles adathoz):

```
sudo bash /volume2/docker/aitmetica-saas/forras/nas/visszaallit-proba.sh
```

Mindkettő **mér, mielőtt elindulna** (3 GB szabad memória alatt vagy 20 fölötti terhelésnél
megáll), és a **közös kapun** megy át — egyszerre csak egy projekt dolgozhat nehezen a gépen.

---

## 5. A visszaállítási próba — mit csinál és mit bizonyít

A mentés önmagában semmit nem bizonyít. A `visszaallit-proba.sh` ezt teszi:

1. megnézi, hogy a tömörített fájl **egyáltalán olvasható-e végig** (`gzip -t`);
2. létrehoz egy **külön, ideiglenes** adatbázist (`km_visszaallitas_proba`);
3. visszatölti bele a legfrissebb mentést;
4. **tábláról táblára összeveti a sorszámokat** az élessel;
5. ellenőrzi a második rendszer mentésének épségét is;
6. **eldobja** az ideiglenes adatbázist.

**Az éles adatbázishoz hozzá sem nyúl** — csak olvassa a sorszámokat az összehasonlításhoz.

Négy kimenetele lehet, mind kipróbálva (2026-09-09, a felhős másolaton):

| Eset | Mit ír |
|---|---|
| ép mentés | `A VISSZAÁLLÍTÁS MŰKÖDIK. 27 tábla, 3043 sor hiánytalanul visszajött` |
| félbevágott mentés | `FIGYELEM — 20 eltérő tábla` + tábláról táblára a különbség |
| sérült tömörített fájl | `A MENTÉS SÉRÜLT — a tömörített fájl nem olvasható végig` |
| nincs mentés | `NINCS mentés a mappában — előbb futtasd a mentes.sh-t` |

> **Egy hibát a próba írása közben találtam meg:** a sérült fájl esetén a szkript eredetileg
> **némán kilépett** — semmit nem írt ki. Ez a legrosszabb fajta hiba: azt hinnéd, minden rendben.
> Ezért ellenőrizzük a fájl épségét ELŐBB, és a visszatöltés hibáit is mi jelentjük, nem a shell.

---

## 6. VALÓDI visszaállítás — mit csinálj, ha baj van

Ez a rész akkor kell, ha az adatbázis tényleg elveszett vagy megsérült.
**Ne siess: előbb olvasd végig.**

### 6.1 Mielőtt bármit tennél

1. **Ne indíts újra semmit** és ne írj az adatbázisba — a sérült állapot is információ.
2. Nézd meg, van-e használható mentés:
   ```
   ls -lt /volume1/homes/Portik/mentesek/aitmetica-saas/
   cat /volume1/homes/Portik/mentesek/aitmetica-saas/mentes-naplo.txt
   ```
3. Futtasd a **visszaállítási próbát** — ez megmondja, hogy a mentés használható-e,
   **anélkül, hogy hozzányúlna az éleshez.**

### 6.2 A visszaállítás lépései

**1. Állítsd le az alkalmazást** (az adatbázist NE):

```
sudo docker stop aitmetica-saas-app aitmetica-saas-referencia
```

**2. Nevezd át a sérült adatbázist** — nem töröljük, hátha kell még:

```
sudo docker exec -i -u postgres aitmetica-saas-db psql -U km_tulaj -d postgres \
  -c "ALTER DATABASE km RENAME TO km_serult_$(date +%Y%m%d);"
```

**3. Hozz létre újat, és töltsd vissza:**

```
sudo docker exec -i -u postgres aitmetica-saas-db psql -U km_tulaj -d postgres \
  -c "CREATE DATABASE km OWNER km_tulaj;"

zcat /volume1/homes/Portik/mentesek/aitmetica-saas/db-<a legfrissebb>.sql.gz \
  | sudo docker exec -i -u postgres aitmetica-saas-db psql -U km_tulaj -X -q -d km
```

**4. A második rendszer fájlja** (csak ha az is elveszett):

```
zcat /volume1/homes/Portik/mentesek/aitmetica-saas/referencia-<a legfrissebb>.sqlite.gz \
  | sudo docker exec -i aitmetica-saas-referencia sh -c 'cat > /adat/referencia.sqlite'
```

**5. Indítsd újra:**

```
cd /volume2/docker/aitmetica-saas && sudo docker compose up -d
```

**6. Ellenőrizd kívülről:**

- https://saas.mediapartizan.ro/api/egeszseg → `"allapot":"ok"`
- https://saas.mediapartizan.ro/api/belso/elvalasztas → `"eredmeny":"RENDBEN"`
- lépj be a saját fiókoddal, és nézd meg, hogy megvan-e a profilod

**7. Ha minden rendben**, a `km_serult_ÉÉÉÉHHNN` adatbázist később eldobhatod — de csak akkor,
ha már biztosan nincs rá szükség.

### 6.3 Mennyi adatot veszítesz

Annyit, amennyi az **utolsó mentés óta** keletkezett. Napi 4:00-s mentésnél ez legfeljebb egy nap.
Ha ez kevés lenne egy valódi ügyfélnél, a mentés sűríthető (naponta többször) — az egy döntés,
nem műszaki akadály.

---

## 7. Mit mérünk, és hol látszik

Minden futás egy sort ír a `mentes-naplo.txt` fájlba:

```
2026-09-09 04:00 | db 152K | ref 24K | mappa 1.2M | darab 7
2026-09-09 04:05 | visszaállítási próba | db-20260909-0400.sql.gz | 27 tábla / 3043 sor | eltérés 0 | hiba 0 | 1 mp | ref: ok, 11 tábla, 88 találat
```

Ebből látszik, hogy a mentés fut-e, mekkora, és hogy a visszaállítás működik-e.

---

## 8. Ami még hátra van

| Nyitott | Hova tartozik |
|---|---|
| A napi indítás beállítása a Synology feladatütemezőjében | **Vilmos, egyszeri kattintás** (3. fejezet) |
| Házon kívüli mentés (tűz, lopás, a teljes gép elvesztése ellen) | külön döntés a pilot előtt |
| Rendszeres, automatikus visszaállítási próba (pl. hetente) | E-40, ha kell |
| A vault mentése | Vilmos dolga — a Synology Drive szinkronizálja, de az nem mentés |


## Kiegészítés (2026-09-12, F-6)

A mentés **4b** lépése az arculati fájlok mappáját (`adatok/fajlok`, a dobozban `/adatok/fajlok`) is menti `fajlok-<bélyeg>.tar.gz` néven,
ugyanazzal a forgatással, mint az adatbázis-mentés. Visszaállításnál a tar-t a `docker-compose.yml` mellé, az `adatok/fajlok` mappába kell kibontani.

## Kiegészítés (2026-09-30, R-16 TERV 1.7 R1) — mentés minden migráció előtt

2026-09-30 óta **minden kirakás, amelyben új (még nem futott) migráció van, a migráció ELŐTT teljes adatbázis-mentést ír**
(`nas/adatbazis/migral.sh`, a kirakás migrációs lépése — külön belépés nem kell hozzá). Új migráció nélkül nincs mentés
(„nincs új migráció, mentés nem kell”). Ha a mentés nem sikerül vagy üres, a migráció **nem fut**, a kirakás 1-es kóddal
megáll: `MEGÁLL: a migráció előtti mentés nem sikerült — migráció nem fut`.

```
/volume2/docker/aitmetica-saas/adatok/postgres/mentes/
    20260930-1005-elotte-0136_valami.sql.gz   ← pg_dump (sima SQL, gzip), az első új migráció nevével
    _torolni/                                  ← a 10-nél régebbiek, és a félresikerült (.hibas) fájlok — nem törlünk
```

Ez a mentés a projekt kötetén (`volume2`) van, a napi mentés a `volume1`-en — a kettő nem helyettesíti egymást.
Visszaállítás egy sorban (a projekt mappájában, üres / újra létrehozott `km` adatbázisba; előtte a 6.1 lépései):
`gunzip -c adatok/postgres/mentes/<fájl>.sql.gz | sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km`
