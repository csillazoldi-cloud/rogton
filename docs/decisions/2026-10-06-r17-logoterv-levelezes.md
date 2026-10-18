# Fizetős logótervezés és választható e-mail-értesítés (R-17 B)

**Dátum:** 2026-10-06 · **Állapot:** ELFOGADVA — Csilla 10-06 14:18 (a R-17 rajzok jóváhagyása, a ★ alapértékek + három válasz).
**Vilmos (biztonság):** átnézés kell — új rendszerszintű beállítás-tábla, munkatereken átlátó rendszergazda-lista (SECURITY DEFINER),
és választható kimenő levél (SMTP) titkokkal a NAS `.env`-ben.

## A döntés
- **Mindkét út marad:** az ingyenes névlogó az elsődleges a névlogó lapon; a fizetős „Tervezzünk neked logót — 79 €” csendes másodlagos.
  Az ár a rendszergazda mezője (`rendszer_beallitas.logoterv_ar`, alap 79 EUR); üresen hagyva a gomb eltűnik, a végpont 409 NINCS_AJANLAT.
- **Fizetés:** nincs online fizetés. A köszönő lap mondata: felhívunk, szerződést kötünk, banki átutalás (r17.logoterv.menete, HU/RO/EN).
- **Tárolás:** minden kérés a `logoterv_keres` táblába kerül (sorszintű védelem a munkatérre; az ár a beküldés pillanatáé). A rendszergazda
  listája (Beállítások → Logókérések) a hiteles forrás; a lista és az állapotváltás a 0037-es költséglista mintájára SECURITY DEFINER függvény.
- **Levél:** csak akkor megy, ha a NAS `.env`-ben `SMTP_HOST` és `SMTP_FROM` meg van adva ÉS a rendszergazda beállított címzettet
  (`logoterv_cimzett`, alap üres). Különben a sor `nincs_beallitva` — nincs hiba, nincs halott vezérlő. A változók:
  `SMTP_HOST`, `SMTP_PORT` (587; 465 = TLS), `SMTP_FROM`, `SMTP_USER`, `SMTP_PASS`, `SMTP_BIZTONSAG` (starttls · tls · nincs).
  Leírás: design/R17-visszajelzes/README.md „Levelezés”. Titok soha nincs a tárhelyben; a compose csak átadja (üres alapértékkel).
- **Hub-sor:** a kódban nincs hub-mechanizmus; nem találtunk ki egyet (Csilla 10-06).
- A kliens függőség nélküli (node:net/tls, AUTH LOGIN, kötelező STARTTLS, ha a kiszolgáló kínálja); a kiszolgáló válaszszövegét nem
  naplózzuk (címet tartalmazhat), csak a lépést és a kódot.
