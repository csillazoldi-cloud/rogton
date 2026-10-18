FELADAT: saját kódtároló a SaaS-nak a Gigabyte-on — GitHub-másolattal (Vilmos jóváhagyta 2026-09-11: „csináld")

HÁTTÉR — ne derítsd fel újra:
- Ez a gép a Gigabyte (192.168.1.249, Tailscale 100.113.109.91). Közvetlenül a gépen futsz, távvezérléssel (a claude-tavir nevű felhasználói szolgáltatás indít, ~/.config/systemd/user/claude-tavir.service), a /home/gigabyte/projektek/saas mappában. Vilmos telefonról és böngészőből ír neked. A Cowork kis gépének hálózata 2026-09-11 7:21 óta nem működik — ne használd.
- A kód fő példánya ma a GitHubon van: git@github.com:Tolgyes/aitmetica-saas.git. Ennek a mappának saját GitHub-kulcsa van (.git/saas-kulcs, core.sshCommand beállítva).
- Ebben a mappában 65 módosított, el nem mentett fájl van: a B-01 (egységes jogellenőrzés, 43 végpont, migráció 0043). A felhőben 209 próbával zöld volt. A nas/gigabyte-kirak.sh egy paranccsal ment, feltölt, fordít — még nem futott le.
- A gépen futó egyéb szolgáltatások, amikhez NEM nyúlsz: katinka-tts (:8766), mpn-transcribe (:8620, :8621 — most áll, a videókártya meghajtója hiányzik; nem a te feladatod), ollama (127.0.0.1:11434), whisper-listener, whisper-inbox, ai-speech-server.
- Szabályok: EGYUTTMUKODES.md és NAS-szabalyok.md a repóban. Titok soha nem kerül chatbe, kódba, GitHubra. Nem törölsz — ami felesleges, a _torolni/ mappába kerül.

SORREND:
1. B-01 (már megbeszélt): próbák, mentés, feltöltés, kirakás a nas/gigabyte-kirak.sh-val, a NAS-szabályok szerint (free -m, uptime, közös kapu). Ha a 08:30-as próbálkozásból ott maradt a .git/index.lock, előbb a _torolni/-be. Kívülről ellenőrizd a tesztoldalt, képernyőkép Vilmosnak.
2. Forgejo a Gigabyte-on, dobozban:
   - rögzített, pontos változat (nem „latest"); adatai a /home/gigabyte/forgejo alatt — NEM a SynologyDrive-ban
   - csak a 192.168.1.249 és a 100.113.109.91 címen figyeljen (webes felület és git-ssh); 0.0.0.0-n soha. Előtte ellenőrizd, hogy a portok szabadok
   - regisztráció kikapcsolva; a rendszergazda-fiók és Vilmos fiókja parancssorból; a jelszavak a vaultba (SynologyDrive/SaaS/vault/forgejo-belepes.txt), soha ne írd ki őket; Vilmosét első belépéskor cserélnie kell
   - a gép újraindulása után magától induljon
3. A SaaS átköltöztetése a Forgejóba, teljes előzménnyel (minden ág és címke). Ennek a mappának a fő távoli címe a Forgejo legyen.
4. GitHub-másolat: minden feltöltés után magától menjen át a GitHubra is (Forgejo push-tükör vagy kettős feltöltési cím — amelyik a meglévő GitHub-kulccsal megbízhatóan megy). Egy próbafeltöltéssel bizonyítsd, hogy a GitHubon ugyanaz a legutolsó állapot.
5. A nas/gigabyte-kirak.sh és a docs/KIRAKAS.md igazítása az új fő helyhez.
5b. Éjszakai tartalék: minden éjjel a teljes kód minden előzménnyel egyetlen fájlba (git bundle) a /home/gigabyte/SynologyDrive/SaaS/mentes-kod/ mappába — a Synology Drive magától átviszi a NAS-ra. Az utolsó 7 marad, a régebbiek a _torolni/-be. Ellenőrizd egyszer, hogy a fájlból visszaállítható a teljes tároló.
6. Ellenőrzés: (a) a Forgejo böngészőben megnyílik Tailscale-en át; (b) a nyilvános internetről nem érhető el — ha ezt innen nem tudod megmérni, mondd ki, és írd le, mi a bizonyíték helyette; (c) ss -ltnp szerint csak a két címen figyel; (d) a GitHub és a Forgejo legutolsó állapota egyezik. Képernyőkép Vilmosnak a SaaS tárolóoldaláról.
7. Jegyzetek: HANDOFF.md és docs/MELYIK-GEP-MIT-CSINAL.md — a Forgejo címe, a portok, hol a belépő, hogyan megy a GitHub-másolat, az éjszakai tartalék, a távvezérlés indítója (claude-tavir), hogyan kell frissíteni a Forgejót.

BESZÁMOLÓ VILMOSNAK: egyszerű, hétköznapi magyar nyelven, szakszavak nélkül. Indulás előtt egy sorban: mit csinálsz és meddig tart (B-01: 30–45 perc; a 2–7. lépés: 1,5–2 óra). Döntési kérdést egyszerre csak egyet, a következményeivel. Ha kérdésre vársz, dolgozz tovább azon, ami nem függ tőle.
