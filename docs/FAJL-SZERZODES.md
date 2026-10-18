# A fájlfeltöltés-modul szerződése — `@km/fajl-core` (F-6 / R-6) · 0.1

2026-09-12 · a `docs/MODULSZABALY.md` szerint. Rajz nincs (design/r6 hiányzik): CSAK gépezet — az ellenőrzés szabálya, a tárolási kapu, a végpontok.

## 1. Mit csinál (technológiai szó nélkül)

Az ügyfél arculati fájlokat ad a rendszernek: logót, arculati kézikönyvet, referenciaképeket. A modul megnézi a fájl TARTALMÁT
(nem a nevét), és eldönti, befogadható-e: kép (PNG, JPG, WebP) vagy PDF igen; SVG és minden más nem — az SVG-t egy segítő
mondattal utasítja el (mert programkódot hordozhat). Méretkorlát van. Ami átment, egy egyszerű mappába kerül a munkatér
neve alatt, és a mentés része lesz. A jóváhagyott arculat a régi logóval marad meg, amíg az újat jóvá nem hagyják.

## 2. A szótár

```ts
export const FajlTipus = z.enum(["png", "jpg", "webp", "pdf"]);           // ami befogadható
export const FelismertTipus = z.enum(["png", "jpg", "webp", "pdf", "svg", "gif", "ismeretlen"]);
export const FajlCel = z.enum(["logo", "kezikonyv", "referencia", "dokumentum"]);
export const FajlHibaKod = z.enum(["NINCS_JOG", "SVG_NEM_ENGEDETT", "TIPUS_NEM_ENGEDETT", "TUL_NAGY", "URES", "NINCS_ILYEN_FAJL", "ERVENYTELEN_ADAT"]);
export const MAX_MERET_BAJT = 10 * 1024 * 1024;   // 10 MB
export const KITERJESZTES: Record<FajlTipus, string> = { png: "png", jpg: "jpg", webp: "webp", pdf: "pdf" };
export const MIME: Record<FajlTipus, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", pdf: "application/pdf" };
```

## 3. A tárgyak

```ts
export type FajlMeta = { id: string; szervezet_id: string; nev: string; tipus: FajlTipus; meret: number; cel: FajlCel; feltoltotte: string; feltoltve: string /* ISO */ };
export type FajlEsemeny = { fajta: "fajl_feltoltve"; szervezet_id: string; fajl_id: string; tipus: FajlTipus; cel: FajlCel; meret: number; feltoltotte: string };
```

## 4. A konnektor — `host.ts`

```ts
export type HostKontextus = { fiok_id: string; szervezet_id: string; szerep: "tulajdonos" | "szerkeszto" | "nezo" };
export interface FajlTar {
  ment(meta: FajlMeta, bajtok: Uint8Array): Promise<void>;
  meta(szervezet_id: string, id: string): Promise<FajlMeta | null>;
  olvas(szervezet_id: string, id: string): Promise<Uint8Array | null>;
  lista(szervezet_id: string, cel?: FajlCel): Promise<FajlMeta[]>;
}
export interface Ora { most(): string }
export interface Azonosito { uj(): string }
export type EsemenyKimenet = (e: FajlEsemeny) => void | Promise<void>;
export type Kornyezet = { tar: FajlTar; ora: Ora; azonosito: Azonosito; esemeny: EsemenyKimenet };
```

TILOS a magban: `node:fs`, `node:crypto`, `Date.now()`, `new Date()`, `Math.random()`, `process.env`, hálózat, React. Import: `@km/contracts`, `zod`.
A bájtok `Uint8Array` — a mag nem olvas fájlt, csak megnézi az elejét.

## 5. A bejárat

```ts
export type Eredmeny<T> = { ok: true; ertek: T } | { ok: false; hiba: FajlHibaKod };

/** Tartalom szerinti típusfelismerés az ELSŐ bájtokból (mágikus fejlécek) — tiszta függvény:
 *  PNG 89 50 4E 47 0D 0A 1A 0A · JPG FF D8 FF · WebP "RIFF"…"WEBP" (0–3 és 8–11) · PDF "%PDF-" · GIF "GIF8" ·
 *  SVG: a fej (legfeljebb 512 bájt, UTF-8, BOM és fehér köz levágva) `<?xml` vagy `<svg` kezdetű, vagy `<svg` szerepel benne → "svg" · különben "ismeretlen". */
export function tipusFelismer(fej: Uint8Array): FelismertTipus;

/** Az ellenőrzés: üres → URES; meret > MAX → TUL_NAGY; felismert "svg" → SVG_NEM_ENGEDETT; "gif"/"ismeretlen" → TIPUS_NEM_ENGEDETT;
 *  különben ok a FajlTipus-sal. A NÉV nem számít (a kiterjesztés hazudhat) — a válasz tipusa a tartalomból jön. Tiszta. */
export function fajlEllenoriz(be: { meret: number; fej: Uint8Array }, korlat?: { maxMeret?: number }): Eredmeny<{ tipus: FajlTipus }>;

/** Jogosultság: feltöltés szerkesztő/tulajdonos; olvasás/lista bármely tag. Tiszta. */
export function dont(ktx: HostKontextus, muvelet: "feltolt" | "olvas"): { szabad: true } | { szabad: false; indok: FajlHibaKod };

export function feltolt(k: Kornyezet, ktx: HostKontextus, be: { nev: string; cel: FajlCel; bajtok: Uint8Array }): Promise<Eredmeny<FajlMeta>>;
   // dont → fajlEllenoriz (a fej = az első 512 bájt) → meta (id az azonosítóból, ido az órából, a nev levágva 200-ra, a `/` és `\\` kicserélve) → tar.ment → esemény
export function fajlMeta(k: Kornyezet, ktx: HostKontextus, id: string): Promise<Eredmeny<FajlMeta>>;          // NINCS_ILYEN_FAJL, ha nincs vagy más szervezeté
export function fajlOlvas(k: Kornyezet, ktx: HostKontextus, id: string): Promise<Eredmeny<{ meta: FajlMeta; bajtok: Uint8Array }>>;
export function fajlLista(k: Kornyezet, ktx: HostKontextus, cel?: FajlCel): Promise<Eredmeny<FajlMeta[]>>;
```

## 6. Hibakódok → HTTP: NINCS_JOG 403 · SVG_NEM_ENGEDETT 415 · TIPUS_NEM_ENGEDETT 415 · TUL_NAGY 413 · URES 400 · ERVENYTELEN_ADAT 400 · NINCS_ILYEN_FAJL 404.
Feliratok a befogadóban: `fajl.hiba_svg_nem_engedett` (hu: „SVG-t nem fogadunk el, mert programkódot hordozhat. Mentsd el PNG-ként vagy PDF-ként, és töltsd fel úgy.”),
`fajl.hiba_tipus_nem_engedett` („Ezt a fájltípust nem fogadjuk el. PNG, JPG, WebP vagy PDF jöhet.”), `fajl.hiba_tul_nagy` („A fájl túl nagy: legfeljebb 10 MB lehet.”), `fajl.hiba_ures` („A fájl üres.”).

## 7. A befogadó kötelezettségei

- A fájlok helye a webalkalmazásban: `FAJL_MAPPA` környezeti változó (a dobozban `/adatok/fajlok`, a NAS-on `./adatok/fajlok` csatolva), alatta `<szervezet_id>/<id>.<kiterjesztés>`;
  a meta a `arculat_fajl` táblában (sorszintű védelem). A mentés (`nas/mentes.sh`) ezt a mappát is menti.
- A jóváhagyott arculat a régi logóval marad: az `ArculatTervezet` kap egy `logo_fajl_id: string | null` mezőt (contracts); a jóváhagyott pillanatkép a saját
  értékét őrzi, a tervezet az újat — a felület (rajz után) cseréli.
- Referencia-host: memória- vagy fájl-tár egy mappában; a modul próbája ott is fut (MODULSZABÁLY 10.).

## 8. 0.4.0 — a fotóalbum (c30 F9, 2026-10-17)

- `FajlCel` + `album`; `CEL_TIPUSOK.album = ["jpg", "webp"]`; `ALBUM_MAX_MERET_BAJT` = 2,5 MB; `ALBUM_MAX_EL` = 2048, `ALBUM_KICSI_MAX_EL` = 512.
- `kepMeret(bajtok): { szel, mag } | null` — tiszta, a fejlécből (JPEG SOF, WebP VP8/VP8L/VP8X). A `feltolt` az albumnál ellenőrzi:
  olvashatatlan → `TIPUS_NEM_ENGEDETT` (415), túl nagy → `TUL_NAGY` (413). A `feltoltFajlbol` albumra `ERVENYTELEN_ADAT`.
- A befogadó (webalkalmazás): a bájtok az `ALBUM_MAPPA` alatt (a dobozban `/adatok/album`, a NAS-on `./adatok/album`), NEM a `FAJL_MAPPA`
  alatt — D7: 30 nap, mentés nélkül; a `nas/mentes.sh` egyik tar-ja sem viszi. A meta az `arculat_fajl` táblában, `cel = 'album'`.
  Kvóta 500 MB / munkatér, 60 fotó / 10 perc / munkatér, néző nem tölthet fel (403), más munkatér fájlja 404. A 30 napja nem használt
  (ill. a „Kitettem” után 30 napos) fotó a `<ALBUM_MAPPA>/_torolni/` alá kerül (nem törlünk); a meta-sor `elemzes.kiveve`-t kap.
  Részletek: `docs/decisions/2026-10-17-c30-f9-album-tar.md`.
