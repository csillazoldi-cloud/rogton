# Döntés — a Tibor-bíráló piros szabálya a Claude-korszakban (2026-10-01)

**Döntötte:** Csilla, 2026-10-01 reggel. **Érinti:** tools/tibor-biro/tibor_biro.py `itel()`; a rajz-zár és a kirakás-zár.
**Vilmosnak szól** (a zár az ő kérése): kérjük az utólagos jóváhagyását; kifogás esetén visszaállítjuk.

## Mi változott
A "nem tudja, mi a dolga" piros ok eddig akkor sült el, ha a `dolgom` válaszban BÁRHOL szerepelt a "nem tudom".
Mostantól csak akkor, ha a válasz EGÉSZE ennyi ("nem tudom", írásjelekkel). Félrenyomás, "elmennék" és pont ≤ 4
változatlanul piros; a bizonytalan hangú, de tartalmilag helyes válasz sárga.

## Miért
A szabály a gemma tőmondataira készült. A 10-01-i rajz-zár futáson (R15-lapok-2, 10 nézet) a Sonnet-bíráló mind a 10
nézeten HELYESEN nevezte meg a dolgát és a megnyomandó fő gombot, 0 félrenyomás és 0 "elmennék" mellett — mégis 6 piros
lett, mert az óvatos mondatokban ("…de nem tudom pontosan, mi lesz utána") a részsztring egyezett. Ez a bíráló
stílusának mérése volt, nem a lapé.

## Mérték
A szabály csere után az eltárolt válaszok újraértékelése (API-hívás nélkül, determinisztikus): a flat "nem tudom"
válaszok (pl. ki-1001 kezdolap/asztali) piros maradnak; a félrenyomások piros maradnak; a pont ≤ 4 piros marad.
