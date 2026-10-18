// R-17 B · a kis SMTP-kliens (logoterv/smtp.ts) egy HELYI, hamis SMTP-kiszolgálóval (node:net, TLS nélkül: SMTP_BIZTONSAG=nincs).
// Méri: beállítás nélkül nincs küldés (null); a beszélgetés sorrendje (EHLO, AUTH LOGIN, MAIL FROM, RCPT TO, DATA); az ékezetes tárgy
// RFC 2047 alakban, a törzs base64-ben, és visszafejtve ugyanaz; a kiszolgáló elutasítása kivétel (a hívó „hiba” állapotot ír).
import net from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { levelNyers, smtpBeallitas, smtpKuld } from "../logoterv/smtp";

type Hamis = { port: number; parancsok: string[]; adat: string; elutasit: boolean; zar: () => Promise<void> };
async function hamisKiszolgalo(): Promise<Hamis> {
  const h: Hamis = { port: 0, parancsok: [], adat: "", elutasit: false, zar: async () => undefined };
  const srv = net.createServer((s) => {
    s.setEncoding("utf8");
    let puffer = "";
    let adatban = false;
    s.write("220 hamis.proba ESMTP\r\n");
    s.on("data", (d: string) => {
      puffer += d;
      for (;;) {
        if (adatban) {
          const v = puffer.indexOf("\r\n.\r\n");
          if (v < 0) return;
          h.adat = puffer.slice(0, v);
          puffer = puffer.slice(v + 5);
          adatban = false;
          s.write("250 OK elfogadva\r\n");
          continue;
        }
        const i = puffer.indexOf("\r\n");
        if (i < 0) return;
        const sor = puffer.slice(0, i);
        puffer = puffer.slice(i + 2);
        h.parancsok.push(sor);
        if (/^EHLO/i.test(sor)) s.write("250-hamis.proba\r\n250 AUTH LOGIN\r\n");
        else if (sor === "AUTH LOGIN") s.write("334 VXNlcm5hbWU6\r\n");
        else if (h.parancsok.at(-2) === "AUTH LOGIN") s.write("334 UGFzc3dvcmQ6\r\n");
        else if (h.parancsok.at(-3) === "AUTH LOGIN") s.write("235 OK\r\n");
        else if (/^MAIL FROM/i.test(sor)) s.write("250 OK\r\n");
        else if (/^RCPT TO/i.test(sor)) s.write(h.elutasit ? "550 nincs ilyen postafiók\r\n" : "250 OK\r\n");
        else if (sor === "DATA") { adatban = true; s.write("354 jöhet\r\n"); }
        else if (sor === "QUIT") { s.write("221 viszlát\r\n"); s.end(); }
        else s.write("500 ?\r\n");
      }
    });
  });
  await new Promise<void>((ok) => srv.listen(0, "127.0.0.1", () => ok()));
  h.port = (srv.address() as net.AddressInfo).port;
  h.zar = () => new Promise((ok) => srv.close(() => ok()));
  return h;
}

describe("SMTP-kliens", () => {
  let h: Hamis;
  beforeAll(async () => { h = await hamisKiszolgalo(); });
  afterAll(async () => { await h.zar(); });

  it("beállítás nélkül (vagy FROM nélkül) nincs küldés — null, nem hiba", () => {
    expect(smtpBeallitas({})).toBeNull();
    expect(smtpBeallitas({ SMTP_HOST: "mail.example.ro" })).toBeNull();
    expect(smtpBeallitas({ SMTP_HOST: " ", SMTP_FROM: "a@b.ro" })).toBeNull();
    expect(smtpBeallitas({ SMTP_HOST: "mail.example.ro", SMTP_FROM: "a@b.ro" })).toMatchObject({ port: 587, biztonsag: "starttls" });
    expect(smtpBeallitas({ SMTP_HOST: "mail.example.ro", SMTP_FROM: "a@b.ro", SMTP_PORT: "465" })).toMatchObject({ port: 465, biztonsag: "tls" });
  });

  it("elküld: a beszélgetés sorrendje, ékezetes tárgy és törzs épen", async () => {
    const b = smtpBeallitas({ SMTP_HOST: "127.0.0.1", SMTP_PORT: String(h.port), SMTP_FROM: "Kommunikációs munkatér <noreply@proba.example>", SMTP_USER: "felhasználó", SMTP_PASS: "jelszó-123", SMTP_BIZTONSAG: "nincs" })!;
    const szoveg = "Új logótervezési kérés érkezett.\nMi álljon a logón? Kovács Burkolat és Térkőgyártó Kft.\n.pont a sor elején";
    await smtpKuld(b, { to: "Csilla <csilla@proba.example>", targy: "Új logótervezési kérés — Kovács Burkolat, Marosvásárhely", szoveg }, 5000);
    expect(h.parancsok.map((p) => p.split(" ")[0])).toEqual(["EHLO", "AUTH", Buffer.from("felhasználó").toString("base64"), Buffer.from("jelszó-123").toString("base64"), "MAIL", "RCPT", "DATA", "QUIT"]);
    expect(h.parancsok).toContain("MAIL FROM:<noreply@proba.example>");
    expect(h.parancsok).toContain("RCPT TO:<csilla@proba.example>");
    const [fejlec, torzs] = h.adat.split("\r\n\r\n");
    const targy = fejlec!.match(/^Subject: =\?UTF-8\?B\?([^?]+)\?=$/m)?.[1];
    expect(Buffer.from(targy!, "base64").toString("utf8")).toBe("Új logótervezési kérés — Kovács Burkolat, Marosvásárhely");
    expect(Buffer.from(torzs!.replace(/\r\n/g, ""), "base64").toString("utf8")).toBe(szoveg.replace(/\n/g, "\r\n"));
  });

  it("a kiszolgáló elutasítja a címzettet → kivétel (a kérés „hiba” állapotot kap)", async () => {
    h.elutasit = true;
    const b = smtpBeallitas({ SMTP_HOST: "127.0.0.1", SMTP_PORT: String(h.port), SMTP_FROM: "noreply@proba.example", SMTP_BIZTONSAG: "nincs" })!;
    await expect(smtpKuld(b, { to: "nincs@proba.example", targy: "x", szoveg: "y" }, 5000)).rejects.toThrow(/RCPT TO: 550/);
    h.elutasit = false;
  });

  it("nem elérhető kiszolgáló → kivétel, nem akad meg", async () => {
    const b = smtpBeallitas({ SMTP_HOST: "127.0.0.1", SMTP_PORT: "1", SMTP_FROM: "noreply@proba.example", SMTP_BIZTONSAG: "nincs" })!;
    await expect(smtpKuld(b, { to: "a@proba.example", targy: "x", szoveg: "y" }, 3000)).rejects.toThrow();
  });

  it("a fejlécbe sortörés nem kerülhet (fejléc-betörés)", () => {
    const n = levelNyers("a@b.ro", "c@d.ro\r\nBcc: x@y.ro", "Tárgy\r\nBcc: z@y.ro", "törzs");
    expect(n).not.toMatch(/\r\nBcc:/);
  });
});
