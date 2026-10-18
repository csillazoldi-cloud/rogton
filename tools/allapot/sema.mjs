// Az állapotlap adatfájljának sémája (ALLAPOT-SZABALY 5.) — a felvezető és az őr közös ellenőrzője.
const ALLAPOT = new Set(["kesz", "folyamatban", "hatra"]);

/** Hibalista; üres = jó. */
export function ellenoriz(d) {
  const h = [];
  if (typeof d !== "object" || d === null) return ["nem objektum"];
  if (typeof d.frissitve !== "string" || Number.isNaN(Date.parse(d.frissitve))) h.push("frissitve: nem érvényes időbélyeg");
  for (const k of ["projekt", "megjegyzes"]) if (typeof d[k] !== "string") h.push(`${k}: hiányzik`);
  for (const k of ["szakaszok", "beallitas", "lepesek", "rajtad", "naplo"]) if (!Array.isArray(d[k])) h.push(`${k}: nem lista`);
  if (h.length) return h;
  d.szakaszok.forEach((s, i) => {
    if (typeof s.kod !== "string" || typeof s.nev !== "string" || typeof s.leiras !== "string") h.push(`szakaszok[${i}]: kod/nev/leiras`);
    if (!ALLAPOT.has(s.allapot)) h.push(`szakaszok[${i}] ${s.kod}: allapot ${s.allapot}`);
    if (typeof s.szazalek !== "number" || s.szazalek < 0 || s.szazalek > 100) h.push(`szakaszok[${i}] ${s.kod}: szazalek`);
  });
  d.beallitas.forEach((b, i) => { if (typeof b.nev !== "string" || !ALLAPOT.has(b.allapot)) h.push(`beallitas[${i}]`); });
  const kodok = new Set();
  d.lepesek.forEach((l, i) => {
    if (typeof l.kod !== "string" || typeof l.nev !== "string") h.push(`lepesek[${i}]: kod/nev`);
    if (kodok.has(l.kod)) h.push(`lepesek[${i}] ${l.kod}: kétszer szerepel`); kodok.add(l.kod);
    if (!ALLAPOT.has(l.allapot)) h.push(`lepesek[${i}] ${l.kod}: allapot`);
    if (typeof l.ora !== "number") h.push(`lepesek[${i}] ${l.kod}: ora`);
    if (l.ki !== undefined && (!Array.isArray(l.ki) || !l.ki.every((k) => typeof k === "string"))) h.push(`lepesek[${i}] ${l.kod}: ki`);
    if (l.ki === undefined && typeof l.agens !== "number") h.push(`lepesek[${i}] ${l.kod}: ki vagy agens kell`);
    for (const k of Object.keys(l)) if (!["kod", "nev", "allapot", "ora", "agens", "ki", "rajtad"].includes(k)) h.push(`lepesek[${i}] ${l.kod}: ismeretlen kulcs ${k}`);
  });
  d.rajtad.forEach((r, i) => { if (typeof r.mit !== "string" || typeof r.miert !== "string") h.push(`rajtad[${i}]`); });
  d.naplo.forEach((n, i) => { if (typeof n.ido !== "string" || typeof n.mi !== "string") h.push(`naplo[${i}]`); });
  return h;
}
