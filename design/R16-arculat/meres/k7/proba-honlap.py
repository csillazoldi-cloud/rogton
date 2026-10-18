# R-16 K7 helyi próba-honlapok (csak a mérésre): a Host fejléc szerint három cég.
import http.server, os, sys
ITT = os.path.dirname(os.path.abspath(__file__))
LAPOK = {
    "cipo-pekseg.proba": ("Cipó Pékség — kovászos kenyér a Kossuth utcában", "/kepek/cipo-logo.png", "#a4471f", "#e3a857", "#fbf3e8",
                          "Cipó Pékség Marosvásárhely. Kovászos kenyér, kalács, pogácsa és friss kifli minden reggel a Kossuth utcában. Rendelés telefonon."),
    "stiinta-tara.proba": ("Știință și Țară SRL — consultanță agricolă", "/logo.svg", "#17745e", "#f2c94c", "#f4fbf8",
                           "Știință și Țară SRL oferă consultanță agricolă pentru fermierii din județul Mureș: analize de sol, planuri de irigare și cursuri."),
    "hibas-logo.proba": ("Hibás Logó Kft. — térkövezés", "/nincs-ilyen-logo.png", "#1e3a8a", "#f59e0b", "#f8fafc",
                         "Térkövezés, udvarok és járdák kivitelezése Marosvásárhelyen és környékén. Ingyenes felmérés, garancia."),
}
naplo = open(os.path.join(ITT, "keresek.txt"), "a")

class K(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        host = (self.headers.get("host") or "").split(":")[0]
        naplo.write(f"{host} {self.path}\n"); naplo.flush()
        lap = LAPOK.get(host)
        if not lap: return self.kuld(404, "text/plain", b"nincs")
        cim, logo, fo, masodik, hatter, szoveg = lap
        if self.path == "/":
            html = f"""<!doctype html><html lang="hu"><head><meta charset="utf-8"><title>{cim}</title>
<link rel="stylesheet" href="/stilus.css"></head><body><header><a href="/"><img class="site-logo" src="{logo}" alt="{cim.split(' — ')[0]} logo"></a></header>
<main><h1>{cim}</h1><p>{szoveg}</p><p>{szoveg}</p><a class="gomb" href="/kapcsolat">Kapcsolat</a></main></body></html>"""
            return self.kuld(200, "text/html; charset=utf-8", html.encode())
        if self.path == "/stilus.css":
            css = f"""body{{background:{hatter};color:#222;font-family:serif}} h1{{color:{fo}}} .gomb{{background:{masodik};color:{fo};border:2px solid {fo}}} header{{border-bottom:4px solid {fo}}} a{{color:{fo}}} main{{background:{hatter}}}"""
            return self.kuld(200, "text/css", css.encode())
        if self.path == "/kepek/cipo-logo.png": return self.kuld(200, "image/png", open(os.path.join(ITT, "cipo-logo.png"), "rb").read())
        if self.path == "/logo.svg": return self.kuld(200, "image/svg+xml", open(os.path.join(ITT, "stiinta-logo.svg"), "rb").read())
        return self.kuld(404, "text/plain", b"nincs")
    def kuld(self, kod, tipus, test):
        self.send_response(kod); self.send_header("content-type", tipus); self.send_header("content-length", str(len(test))); self.end_headers(); self.wfile.write(test)
    def log_message(self, *a): pass

http.server.ThreadingHTTPServer(("0.0.0.0", int(sys.argv[1]) if len(sys.argv) > 1 else 8701), K).serve_forever()
