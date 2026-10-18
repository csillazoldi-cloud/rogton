# Fordított ellenőrzés — E-32 (a referencia-host kirakása a tesztoldalra)

Te egy SZKEPTIKUS ellenőr vagy. A feladatod NEM a dicséret, hanem hogy megpróbáld MEGCÁFOLNI az alábbi állításokat
a mellékelt fájlok alapján. Ha egy állítás igaz, azt EGY sorban nyugtázd és lépj tovább.

## SZIGORÚ FORMA
- LEGFELJEBB 25 sor összesen. Ismétlés TILOS: ugyanazt a megállapítást csak EGYSZER írd le.
- Minden megállapítás: `[SÚLYOS|KÖZEPES|APRÓ] fájl:sor — mi a baj — mi történik rosszul`.
- Ha nem találsz hibát egy állításnál: `OK — <állítás rövid neve>`.
- Ne javasolj átépítést, ne írj új kódot. Csak azt nézd, ami a mellékletben VAN.

## Amit már ELLENŐRIZTEK (ne ezekkel foglalkozz)
- A doboz elindul a NAS-on, és kívülről 200-at ad a `/referencia/`, `/referencia/allapot`, `/referencia/beallitas` címeken. MÉRVE.
- Egy valódi figyelés 78 másodperc alatt lefutott, 10 találat, 9 kártya. MÉRVE.
- A memóriahasználat 132 MB a 256 MB-os korláton belül. MÉRVE.

## Az állítások, amiket cáfolni próbálj

1. **Az útvonal-előtag levágása nem szivárogtat.** `utvonalLevag(utvonal, alapUt)` a `src/kiszolgalo.ts`-ben.
   Van-e olyan bemenet, amitől egy kérés az előtagon KÍVÜLRŐL mégis kiszolgálódik? Gondolj a `%2e`/`..`,
   a `//`, a nagybetűs változat, a lezáró perjel és a lekérdezés-rész eseteire. Az `URL` osztály mit normalizál előbb?
2. **Az előtag nélküli működés nem tört el.** Ha `alap_ut` üres, minden pontosan úgy megy, mint E-30-ban?
3. **A 303 átirányítás a futtatás után jó helyre visz** az előtag alatt is, és nem lehet vele idegen címre irányítani.
4. **A `profil.nas.json` nem visz titkot a tárhelybe**, és nem írja felül a próbák determinisztikus `profil.json`-ját.
5. **A `nas/nginx.conf` új blokkja nem rontja el a fő alkalmazást**: a `/` továbbra is az `app`-hoz megy,
   és a `/referencia`-val kezdődő, de NEM a referencia-hoz tartozó címek (pl. `/referenciaxyz`) hova jutnak?
6. **A `nas/docker-compose.yml` új `referencia` szolgáltatása nem nyúl a másik három dobozhoz**: nem oszt közös
   kötetet, nem nyit portot kifelé, a memóriakorlátja megvan.
7. **A `nas/jelszo-kerdes.py` nem ír ki titkot** sehova a szabványos kimeneten kívül, és hiba esetén sem.

## Melléklet
A fájlok a mellékletben vannak. Csak azokat nézd.
