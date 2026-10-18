// Próba-segédek: memória-tár, rögzített óra, sorszámozott azonosító, eseménygyűjtő, fejléc-gyártók.
import {
  FajlCel,
  FajlEsemeny,
  FajlMeta,
  FajlTar,
  Kornyezet,
} from "../src/index.js";

export function memTar(): FajlTar & {
  _fajlok: Map<string, { meta: FajlMeta; bajtok: Uint8Array }>;
} {
  const fajlok = new Map<string, { meta: FajlMeta; bajtok: Uint8Array }>();
  const kulcs = (sz: string, id: string) => `${sz}::${id}`;
  return {
    _fajlok: fajlok,
    async ment(meta, bajtok) {
      fajlok.set(kulcs(meta.szervezet_id, meta.id), { meta, bajtok });
    },
    async meta(szervezet_id, id) {
      const e = fajlok.get(kulcs(szervezet_id, id));
      return e ? e.meta : null;
    },
    async olvas(szervezet_id, id) {
      const e = fajlok.get(kulcs(szervezet_id, id));
      return e ? e.bajtok : null;
    },
    async lista(szervezet_id, cel) {
      const out: FajlMeta[] = [];
      for (const { meta } of fajlok.values()) {
        if (meta.szervezet_id !== szervezet_id) continue;
        if (cel && meta.cel !== cel) continue;
        out.push(meta);
      }
      return out;
    },
  };
}

export function rogzitettOra(kezdet = "2026-09-12T10:00:00.000Z"): {
  most(): string;
} {
  let n = 0;
  return {
    most() {
      const d = new Date(kezdet);
      d.setUTCSeconds(d.getUTCSeconds() + n);
      n += 1;
      return d.toISOString();
    },
  };
}

export function sorszamAzonosito(prefix = "f"): { uj(): string } {
  let n = 0;
  return {
    uj() {
      n += 1;
      return `${prefix}-${String(n).padStart(4, "0")}`;
    },
  };
}

export function esemenyGyujto(): {
  esemenyek: FajlEsemeny[];
  kimenet: (e: FajlEsemeny) => void;
} {
  const esemenyek: FajlEsemeny[] = [];
  return {
    esemenyek,
    kimenet(e) {
      esemenyek.push(e);
    },
  };
}

export function kornyezet(tar: FajlTar): Kornyezet & {
  esemenyek: FajlEsemeny[];
} {
  const gy = esemenyGyujto();
  return {
    tar,
    ora: rogzitettOra(),
    azonosito: sorszamAzonosito(),
    esemeny: gy.kimenet,
    esemenyek: gy.esemenyek,
  };
}

// ---- fejléc-gyártók ----

export function pngFej(): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
}

export function jpgFej(): Uint8Array {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
}

export function webpFej(): Uint8Array {
  const b = new Uint8Array(16);
  b.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  b.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
  return b;
}

export function pdfFej(): Uint8Array {
  return new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
}

export function svgSzoveg(extra = ""): Uint8Array {
  const s = `${extra}<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
  return new TextEncoder().encode(s);
}

export function gifFej(): Uint8Array {
  return new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
}

export function ismeretlenFej(): Uint8Array {
  return new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
}

export function celok(): FajlCel[] {
  return ["logo", "kezikonyv", "referencia", "dokumentum"];
}
