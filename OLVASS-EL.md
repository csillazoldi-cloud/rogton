# Ez a csomag a tárhely gyökerébe megy

Bontsd ki az `aitmetica-saas` gyökerében (a `package.json` mellé). A meglévő fájlokat
felülírja — a `CLAUDE.md` és az `AGENTS.md` **mai, bővített** változata van benne.

```
design/     a hat rajz-feladatlap, az ellenőrzések, és a MEGLÉVŐ rajzcsomagok
docs/       MODULSZABALY.md · ALLAPOT-SZABALY.md · ORCHESTRATOR-MEGBIZAS.md
CLAUDE.md   AGENTS.md   (azonos tartalom, mindkettő frissült)
```

## Amiből VAN rajz

| Mappa | Mi van benne |
|---|---|
| `design/r0-terkoz-skala/atado/` | a térköz-skála rajza (5 artboard) — **ebből indul az F-1** |
| `design/r1-kezdokepernyo/atado/` | az R-1 **v2** rajza — előzmény, ne ebből dolgozz |
| `design/r1-kezdokepernyo/atado-2/` | az R-1 **v3 javítókör** rajza (8 artboard) — **ebből indul az F-2** |

## Amiből NINCS rajz — ez fontos

Az `r2-tagok`, `r3-sajat-fiok`, `r4-rendszerbeallitasok`, `r5-elofizetes`, `r6-fajlfeltoltes`
mappákban **csak a feladatlap van, rajz nincs**: ezek még nem mentek a Claude Designnak.

Tehát az **F-3 … F-6 csomagok nem indíthatók** a „rajz a forrás" szabály szerint — előbb el kell
készülniük a rajzoknak. Az F-1 és az F-2 viszont azonnal indulhat.

## A rajzfájlokról

A `.dc.html` fájlok megnyitásához **hálózat kell**: a megjelenítőjük a React-et és a Babelt az
`unpkg.com`-ról tölti. Hálózat nélkül üres lapot adnak. Az `r1-kezdokepernyo/atado/rajz/`
mappában lévő `r1-kezdokepernyo-es-navigacio.dc.html` a kivétel: az statikus, magától megjelenik.
