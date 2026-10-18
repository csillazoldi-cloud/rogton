// F-8.1 a (T-30, audit 18. P0): a kiszolgáló a fordított proxy MÖGÖTT fut, ezért a kérés saját címe
// (`keres.url`) a doboz belső címe (pl. http://0.0.0.0:3000). Egy átirányítás ebből épített célja a
// böngészőnek elérhetetlen — az audit ezt mérte: `https://0.0.0.0:3000/hirfigyelo/beallitas`.
//
// A NYILVÁNOS címet a proxy fejlécei adják: az nginx a `Host`-ot továbbadja és `X-Forwarded-Proto: https`-t
// tesz (nas/nginx.conf). Ha egyik sincs (helyi futás proxy nélkül), a kérés saját címe marad.
// Csak a gazdagép és a séma jön a fejlécből; az ÚT mindig a mi belső, `/`-rel kezdődő utunk — nyílt átirányítás nincs.

/** A `/…` belső út abszolút, nyilvános URL-je a kérés fejlécei alapján. */
export function nyilvanosCim(keres: Request, ut: string): URL {
  if (!ut.startsWith("/") || ut.startsWith("//")) throw new Error("nyilvanosCim: csak belső, '/'-rel kezdődő út engedett");
  const sajat = new URL(keres.url);
  const gazda = elsoErtek(keres.headers.get("x-forwarded-host")) ?? elsoErtek(keres.headers.get("host")) ?? sajat.host;
  const sema = elsoErtek(keres.headers.get("x-forwarded-proto")) ?? sajat.protocol.replace(":", "");
  return new URL(ut, `${sema === "http" ? "http" : "https"}://${gazda}`);
}

/** A fejléc első, vesszővel elválasztott eleme (több proxy hozzáfűzhet), üresnél `undefined`. */
function elsoErtek(ertek: string | null): string | undefined {
  const e = ertek?.split(",")[0]?.trim();
  return e ? e.slice(0, 255) : undefined;
}
