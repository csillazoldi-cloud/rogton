import "server-only";
// R-17 B · a kérésről szóló e-mail — KIS, függőség nélküli SMTP-kliens (node:net / node:tls). A rendszer ma nem küld levelet; ez CSAK
// akkor fut, ha a NAS .env-ben a levelezés be van állítva (Csilla 10-06: választható, utólag kitöltendő beállítás). Beállítás nélkül
// nincs hiba és nincs halott vezérlő: a kérés a táblában van, a rendszergazda listája a hiteles forrás.
//
// Környezeti változók (a titok SOHA nem kerül a tárhelybe; leírás: design/R17-visszajelzes/README.md „Levelezés”; átadás: nas/docker-compose.yml):
//   SMTP_HOST          a levelező kiszolgáló (kötelező a küldéshez)
//   SMTP_PORT          alap 587; 465 = azonnali TLS
//   SMTP_FROM          a feladó címe (kötelező a küldéshez), pl. „Posztgyár <noreply@…>”
//   SMTP_USER, SMTP_PASS  bejelentkezés (AUTH LOGIN), ha a kiszolgáló kéri — ha nincs megadva, nem jelentkezik be
//   SMTP_BIZTONSAG     „tls” (azonnali TLS) · „starttls” (alap 465-ön kívül: ha a kiszolgáló kínálja, kötelezően STARTTLS) · „nincs” (csak próbához)
// A címzett NEM környezeti változó: a rendszergazda állítja a Beállításokban (rendszer_beallitas.logoterv_cimzett).
import net from "node:net";
import tls from "node:tls";
import { randomUUID } from "node:crypto";

export type SmtpBeallitas = { host: string; port: number; from: string; user: string; pass: string; biztonsag: "tls" | "starttls" | "nincs" };

/** A beállítás a környezetből; ha a küldéshez szükséges (HOST, FROM) hiányzik: null — ilyenkor nem küldünk, és ez nem hiba. */
export function smtpBeallitas(env: Record<string, string | undefined> = process.env): SmtpBeallitas | null {
  const host = env["SMTP_HOST"]?.trim() ?? "";
  const from = env["SMTP_FROM"]?.trim() ?? "";
  if (!host || !from) return null;
  const port = Number(env["SMTP_PORT"] ?? "") || 587;
  const b = (env["SMTP_BIZTONSAG"] ?? "").trim().toLowerCase();
  const biztonsag = b === "tls" || b === "nincs" || b === "starttls" ? b : port === 465 ? "tls" : "starttls";
  return { host, port, from, user: env["SMTP_USER"] ?? "", pass: env["SMTP_PASS"] ?? "", biztonsag };
}

/** Fejléc-érték UTF-8-ban (RFC 2047), ha nem tiszta ASCII. */
function fejlecErtek(s: string): string {
  const egysoros = s.replace(/[\r\n]+/g, " ");
  return /^[\x20-\x7e]*$/.test(egysoros) ? egysoros : `=?UTF-8?B?${Buffer.from(egysoros, "utf8").toString("base64")}?=`;
}

/** A cím a „Név <cím>” alakból. */
function puszta(cim: string): string {
  const m = cim.match(/<([^>]+)>/);
  return (m ? m[1]! : cim).trim();
}

/** A levél (fejléc + base64 törzs). A sorvégek CRLF; a törzs base64, így a pont-kezdetű sor sem gond. */
export function levelNyers(from: string, to: string, targy: string, szoveg: string, datum = new Date()): string {
  const domain = puszta(from).split("@")[1] ?? "localhost";
  const torzs = Buffer.from(szoveg.replace(/\r?\n/g, "\r\n"), "utf8").toString("base64").replace(/.{76}/g, "$&\r\n");
  return [
    `From: ${from.replace(/[\r\n]/g, "")}`,
    `To: ${to.replace(/[\r\n]/g, "")}`,
    `Subject: ${fejlecErtek(targy)}`,
    `Date: ${datum.toUTCString()}`,
    `Message-ID: <${randomUUID()}@${domain}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    torzs,
  ].join("\r\n");
}

type Kapcsolat = { ir: (s: string) => void; valasz: () => Promise<{ kod: number; sorok: string[] }>; csere: (s: tls.TLSSocket) => void; zar: () => void };

function kapcsolat(socket: net.Socket | tls.TLSSocket): Kapcsolat {
  let aktiv: net.Socket | tls.TLSSocket = socket;
  let puffer = "";
  let varo: ((v: { kod: number; sorok: string[] }) => void) | null = null;
  let hiba: ((e: Error) => void) | null = null;
  let halott: Error | null = null;
  const meghal = (e: Error) => { if (!halott) halott = e; if (hiba) { const f = hiba; hiba = null; varo = null; f(halott); } };
  const kesz: { kod: number; sorok: string[] }[] = [];
  const feldolgoz = () => {
    // egy válasz: „250-…” sorok, majd „250 …” — a teljes válasz az utolsó sor után kész
    for (;;) {
      const sorok = puffer.split("\r\n");
      const vege = sorok.findIndex((s) => /^\d{3} /.test(s) || /^\d{3}$/.test(s));
      if (vege < 0) return;
      const valasz = sorok.slice(0, vege + 1);
      puffer = sorok.slice(vege + 1).join("\r\n");
      const v = { kod: Number(valasz[vege]!.slice(0, 3)), sorok: valasz };
      if (varo) { const f = varo; varo = null; hiba = null; f(v); } else kesz.push(v);
    }
  };
  const ra = (s: net.Socket | tls.TLSSocket) => {
    s.setEncoding("utf8");
    s.on("data", (d: string) => { puffer += d; feldolgoz(); });
    s.on("error", (e) => meghal(e));
    s.on("close", () => meghal(new Error("SMTP: a kapcsolat lezárult")));
  };
  ra(socket);
  return {
    ir: (s) => { aktiv.write(s + "\r\n"); },
    valasz: () => new Promise((ok, nem) => {
      const meglevo = kesz.shift();
      if (meglevo) { ok(meglevo); return; }
      if (halott) { nem(halott); return; }
      varo = ok;
      hiba = nem;
    }),
    csere: (s) => { aktiv.removeAllListeners("data"); aktiv.removeAllListeners("close"); aktiv.removeAllListeners("error"); puffer = ""; aktiv = s; ra(s); },
    zar: () => { aktiv.end(); aktiv.destroy(); },
  };
}

function elvar(v: { kod: number; sorok: string[] }, kodok: number[], lepes: string): void {
  if (!kodok.includes(v.kod)) throw new Error(`SMTP ${lepes}: ${v.kod}`); // a kiszolgáló szövegét nem naplózzuk (lehet benne cím)
}

/** Egy levél elküldése. Időkorlát: `idokorlatMs` (alap 15 mp). Hibánál kivételt dob (a hívó a sor `ertesites` mezőjébe írja). */
export async function smtpKuld(b: SmtpBeallitas, level: { to: string; targy: string; szoveg: string }, idokorlatMs = 15_000): Promise<void> {
  const nyitott = await new Promise<net.Socket | tls.TLSSocket>((ok, nem) => {
    const s = b.biztonsag === "tls"
      ? tls.connect({ host: b.host, port: b.port, servername: b.host }, () => ok(s))
      : net.connect({ host: b.host, port: b.port }, () => ok(s));
    s.once("error", nem);
    s.setTimeout(idokorlatMs, () => { s.destroy(new Error("SMTP időtúllépés")); });
  });
  const k = kapcsolat(nyitott);
  const idozito = setTimeout(() => k.zar(), idokorlatMs);
  try {
    elvar(await k.valasz(), [220], "üdvözlés");
    const nev = puszta(b.from).split("@")[1] ?? "localhost";
    k.ir(`EHLO ${nev}`);
    let ehlo = await k.valasz();
    elvar(ehlo, [250], "EHLO");
    if (b.biztonsag === "starttls") {
      if (!ehlo.sorok.some((s) => /STARTTLS/i.test(s))) throw new Error("SMTP: a kiszolgáló nem kínál STARTTLS-t");
      k.ir("STARTTLS");
      elvar(await k.valasz(), [220], "STARTTLS");
      const titkos = await new Promise<tls.TLSSocket>((ok, nem) => {
        const t = tls.connect({ socket: nyitott as net.Socket, servername: b.host }, () => ok(t));
        t.once("error", nem);
      });
      k.csere(titkos);
      k.ir(`EHLO ${nev}`);
      ehlo = await k.valasz();
      elvar(ehlo, [250], "EHLO (TLS)");
    }
    if (b.user) {
      k.ir("AUTH LOGIN");
      elvar(await k.valasz(), [334], "AUTH");
      k.ir(Buffer.from(b.user, "utf8").toString("base64"));
      elvar(await k.valasz(), [334], "AUTH felhasználó");
      k.ir(Buffer.from(b.pass, "utf8").toString("base64"));
      elvar(await k.valasz(), [235], "AUTH jelszó");
    }
    k.ir(`MAIL FROM:<${puszta(b.from)}>`);
    elvar(await k.valasz(), [250], "MAIL FROM");
    k.ir(`RCPT TO:<${puszta(level.to)}>`);
    elvar(await k.valasz(), [250, 251], "RCPT TO");
    k.ir("DATA");
    elvar(await k.valasz(), [354], "DATA");
    k.ir(`${levelNyers(b.from, level.to, level.targy, level.szoveg)}\r\n.`);
    elvar(await k.valasz(), [250], "levél");
    k.ir("QUIT");
    await k.valasz().catch(() => undefined); // a 221 elköszönés (ha nem jön, az sem baj: a levél már elment)
  } finally {
    clearTimeout(idozito);
    k.zar();
  }
}
