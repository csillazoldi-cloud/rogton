# uzem — running Rögtön on the Gigabyte

One compose project `gma` under its own Linux user `gyorsadmin`. Nothing here touches the other projects on the box
(other users' units, `km-kepgyar` on :8601, `misszio-masolat-*`, `festival-*`).

| What | Where |
|---|---|
| user | `gyorsadmin` (docker group, linger; no sudo) |
| deploy-script checkout | `~/admin` — a DETACHED checkout, moved to the live commit after each successful deploy. By hand: `git -C ~/admin fetch origin main && git -C ~/admin checkout --detach <sha>` (`git pull` fails on a detached HEAD). A deploy whose commit changes `kirak.sh` hands over to the new script by itself (G6b). |
| data root `GMA_GYOKER` | `~/gma` — `adatok/{postgres,fajlok,album}`, `mentes/` (pre-migration dumps), `uzem-aktiv/` (live config), `forras/<sha12>/` (sources, last 5), `naplo/`, `allapot/`, `_torolni/` |
| secrets | `~/gma/.env` (mode 600) — template `uzem/.env.pelda` |
| containers | `gma-db`, `gma-egress` (WARP, G6), `gma-app` (in gma-egress's network namespace), `gma-kepgyar`, `gma-web`, `gma-tunnel` (cloudflared, G7, profile `tunnel`) |
| networks | `gma-belso` (internal, no gateway: db, kepgyar, egress, web), `gma-kimeno` (egress, web, tunnel) |
| fence (root) | `/usr/local/sbin/gma-kerites.sh` + `gma-kerites.service` — copy of `uzem/kerites.sh`, see the G6 batches |
| the only host port | `127.0.0.1:8410` → `gma-web` (nginx) |
| images | `gma-app:<sha12>`, `gma-kepgyar:<sha12>`, plus `:aktiv` / `:elozo` |
| deploy | `uzem/kirak.sh` from the user timer `gma-kirak.timer` (every 2 min; no-op when origin/main is already live) |
| log | `~/gma/naplo/kirak-<YYYYMM>.log`, build and migration logs next to it; `mentes-…`, `szivdobbanas-…` (G8) |
| backups (G8) | `~/gma/mentes/napi/<YYYYMMDD-HHMM>.age` nightly at 03:40 (`gma-mentes.timer`), keep 14; Mac copy `~/saas/mentes/rogton/` (keep 30); private key only in `~/saas/vault/rogton-mentes-kulcs` |
| heartbeat (G8) | `gma-szivdobbanas.timer` every 10 min → `~/gma/allapot/riasztas` on failure; optional Telegram |

Deploy steps, rollback rules and exit codes: the header of `kirak.sh`.

**Order:** the timer deploys `origin/main`. Run Batch 5 only after the branch with the banned-string guard (G4) is merged
into `main` — `kirak.sh` refuses to deploy a commit without `tools/tiltott`. Before Batch 5, a Docker prune on the box is worth
doing (`docker builder prune` reclaims ~70 GB, measured at G0) — that is Csilla's click, not part of these batches.

## Runbook

Everything below runs from the Mac. `ssh -n gma` = as gyorsadmin on the Gigabyte. Reasons for the backup design:
`docs/decisions/2026-10-18-g8-mentes.md`.

**Status** — is it up, what failed lately, are the timers alive:
```bash
ssh -n gma 'curl -s 127.0.0.1:8410/api/egeszseg; echo; docker ps --filter name=gma- --format "{{.Names}} {{.Status}}"'
ssh -n gma 'tail -3 ~/gma/allapot/riasztas 2>/dev/null; ls ~/gma/allapot/szivdobbanas-hiba 2>/dev/null && echo "MOST IS HIBA VAN"'
ssh -n gma 'systemctl --user list-timers --no-pager | grep gma-; ls -1 ~/gma/mentes/napi | tail -2'
```
Healthy: `{"allapot":"ok",…}`, all gma containers Up (egress `healthy`), no `MOST IS HIBA VAN`, three gma timers, last night's backup.

**Logs:** `ssh -n gma 'tail -40 ~/gma/naplo/kirak-$(date +%Y%m).log'` — same for `mentes-…` and `szivdobbanas-…`;
a container: `ssh -n gma 'docker logs --tail 50 gma-app'` (or gma-egress, gma-tunnel, gma-web, gma-db).

**Redeploy by hand** (the commit on `main` again, e.g. after a failed run): `ssh -n gma 'bash ~/admin/uzem/kirak.sh --kenyszer; echo KOD=$?'`
— it hands over to the kirak.sh of the commit it deploys. Exit codes: the header of `kirak.sh`.

**Roll back to `:elozo`.** First choice: revert the bad commit on GitHub — the timer deploys the revert like any commit.
Emergency only, and only if the bad deploy ran NO migration (its log has no `lefutott:` line — if it did, restore a backup instead):
```bash
ssh -n gma 'grep -E "kirakás:|lefutott:" ~/gma/naplo/kirak-$(date +%Y%m).log | tail -4'
ssh -n gma 'cd ~/gma && for k in gma-app gma-kepgyar; do docker tag $k:elozo $k:aktiv; done && docker compose -p gma --env-file .env -f forras/$(cut -c1-12 allapot/kint)/uzem/docker-compose.yml up -d --no-build app kepgyar'
ssh -n gma 'sleep 20; curl -s 127.0.0.1:8410/api/egeszseg'
```
The timer leaves it there until the next commit on `main` (it sees nothing new), so push the revert soon.

**Rotate the tunnel credential:** Cloudflare → Zero Trust → Networks → Tunnels → `gm-admin` → Configure → the button that issues a
new token (it invalidates the old one) → copy the token into `~/saas/vault/rogton-cf-tunnel-token.txt`. Then run the first line of
Batch 13, and `ssh -n gma 'cd ~/gma && docker compose -p gma --env-file .env -f forras/$(cut -c1-12 allapot/kint)/uzem/docker-compose.yml up -d --no-build --force-recreate tunnel'`.
Check: `ssh -n gma 'sleep 15; docker logs --tail 20 gma-tunnel 2>&1 | grep -c "Registered tunnel connection"'` ≥ 1.

**Add an Access e-mail** (only until G9's gate replaces Access): Cloudflare → Zero Trust → Access → Applications → `Rögtön admin` →
Policies → `Engedélyezett` → Include → Emails → add the address → Save. Nothing on the box changes. Then add the same person in the
app (Fiókok) — Access only opens the door. **After G9:** give the person the gate password (`~/saas/vault/rogton-kapu-jelszo`) instead.

**Gate (G9) — log every device out:** `ssh -n gma 'docker exec gma-db psql -U km_tulaj -d km -c "TRUNCATE kapu_jegy"'` — every phone and
browser sees the gate again within a minute (the password stays the same). **Change the gate password** (someone should lose
access): delete `~/saas/vault/rogton-kapu-jelszo`, run Batch 23 again, then
`ssh -n gma 'cd ~/gma && docker compose -p gma --env-file .env -f forras/$(cut -c1-12 allapot/kint)/uzem/docker-compose.yml up -d --no-build app'`
— the old cookies stop working at once (they were issued under the old password). How many devices are in:
`ssh -n gma 'docker exec gma-db psql -U km_tulaj -d km -tAc "SELECT count(*) FROM kapu_jegy WHERE lejar > now()"'`.

**Restore a backup** (a decision, not routine — first run the drill on the chosen file, Batch 20 line 3, and see ZÖLD). The live
database is renamed, never dropped; the old file folders are renamed, never deleted.
1. Stop and keep what is there now (the third line takes the NEWEST Mac copy — put the chosen file's path there if it is another one):
```bash
ssh -n gma 'systemctl --user stop gma-kirak.timer gma-szivdobbanas.timer && docker stop gma-app gma-kepgyar'
ssh -n gma 'docker exec gma-db pg_dump -Fc -U km_tulaj -d km > ~/gma/mentes/kezi-$(date +%Y%m%d-%H%M)-visszaallitas-elott.dump && ls -l ~/gma/mentes/kezi-*'
age -d -i ~/saas/vault/rogton-mentes-kulcs "$(ls -1 ~/saas/mentes/rogton/*.age | tail -1)" | ssh gma 'mkdir -m 700 -p ~/gma/mentes/.vissza && tar -xf - -C ~/gma/mentes/.vissza && ls ~/gma/mentes/.vissza'
```
2. Swap the database and the files (the old ones get today's date in their name):
```bash
ssh -n gma "docker exec gma-db psql -U km_tulaj -d postgres -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='km'\" -c 'ALTER DATABASE km RENAME TO km_regi_'\$(date +%Y%m%d) -c \"CREATE DATABASE km OWNER km_tulaj TEMPLATE template0 LOCALE_PROVIDER icu ICU_LOCALE 'hu-HU' ENCODING UTF8\""
ssh -n gma 'docker exec -i gma-db pg_restore -U km_tulaj -d km --exit-on-error < ~/gma/mentes/.vissza/km.dump && echo VISSZATOLTVE'
ssh -n gma 'docker run --rm -i --network none --user 0 -v ~/gma/adatok:/a --entrypoint sh gma-app:aktiv -c "mv /a/fajlok /a/fajlok.regi-$(date +%Y%m%d) && mv /a/album /a/album.regi-$(date +%Y%m%d) && tar -xf - -C /a && chown -R 1000:1000 /a/fajlok /a/album" < ~/gma/mentes/.vissza/fajlok-album.tar'
```
3. Start again and clean the plaintext copy:
```bash
ssh -n gma 'docker start gma-kepgyar gma-app && systemctl --user start gma-kirak.timer gma-szivdobbanas.timer && rm -rf ~/gma/mentes/.vissza'
ssh -n gma 'sleep 20; curl -s 127.0.0.1:8410/api/egeszseg; docker exec gma-db psql -U km_tulaj -d km -tAc "SELECT count(*) FROM fiok"'
```
`km_regi_<date>`, `fajlok.regi-<date>`, `album.regi-<date>` stay until Csilla decides; the database is checked in the app before anything else.

**Feedback button on/off** (`VISSZAJELZES_GOMB`, default `ki` — Csilla, 2026-10-18): set the line in `~/gma/.env` to `be` or `ki`
(Batch 22 shows the edit), then `ssh -n gma 'cd ~/gma && docker compose -p gma --env-file .env -f forras/$(cut -c1-12 allapot/kint)/uzem/docker-compose.yml up -d --no-build app'`.
No rebuild: the app reads it per request. `ki` hides the floating button, its screenshot script and the menu's „Visszajelzés”
row on every page; the `/visszajelzes` admin pages stay.

**Power loss:** nothing to do. Docker restarts the containers (`restart: unless-stopped`), the tunnel dials out again by itself, the
timers resume (a missed 03:40 backup runs after boot — `Persistent=true`). Check with **Status** once the box is back.

**Gigabyte reboot:** the same — gyorsadmin has linger, so its user timers run without anyone logged in. `ssh -n gma 'systemctl --user list-timers --no-pager'`
must list `gma-kirak`, `gma-mentes`, `gma-szivdobbanas`. The fence comes back with `gma-kerites.service` (root unit).

## G2 batches

**Batch 1 — MAC:**
```bash
scp ~/saas/vault/gigabyte-csilla-kulcs.pub gigabyte:/tmp/gma-kulcs.pub
ssh gigabyte 'ls -l /tmp/gma-kulcs.pub; id -nG; ss -ltnH "sport = :8410" | wc -l'
```
Output must show: the .pub file on the Gigabyte, `docker` in the group list, and `0` (port 8410 still free).

**Batch 2 — GIGABYTE (the ONE sudo batch — run it in an interactive `ssh gigabyte` session, it asks for your password once):**
```bash
sudo bash -c 'id gyorsadmin >/dev/null 2>&1 || adduser --disabled-password --gecos "" gyorsadmin; usermod -aG docker gyorsadmin; loginctl enable-linger gyorsadmin'
sudo install -d -m 700 -o gyorsadmin -g gyorsadmin /home/gyorsadmin/.ssh /home/gyorsadmin/gma
sudo install -m 600 -o gyorsadmin -g gyorsadmin /tmp/gma-kulcs.pub /home/gyorsadmin/.ssh/authorized_keys
sudo chmod 700 /home/gyorsadmin && rm /tmp/gma-kulcs.pub
id gyorsadmin; loginctl show-user gyorsadmin -p Linger
```
Output must show: `gyorsadmin` with group `docker`, and `Linger=yes`.

**Batch 3 — MAC:**
```bash
printf 'Host gma\n  HostName 100.113.109.91\n  HostKeyAlias 100.113.109.91\n  User gyorsadmin\n  IdentityFile ~/saas/vault/gigabyte-csilla-kulcs\n  IdentitiesOnly yes\n' >> ~/.ssh/config
ssh -o BatchMode=yes gma 'id -nG; ssh-keyscan -t ed25519 github.com 2>/dev/null >> ~/.ssh/known_hosts; ssh-keygen -q -t ed25519 -N "" -C rogton-deploy -f ~/.ssh/rogton-deploy; printf "Host github.com\n  IdentityFile ~/.ssh/rogton-deploy\n  IdentitiesOnly yes\n" >> ~/.ssh/config; chmod 600 ~/.ssh/config'
ssh -o BatchMode=yes gma 'cat ~/.ssh/rogton-deploy.pub'
```
Output must show: `gyorsadmin docker` and one `ssh-ed25519 … rogton-deploy` line. Add that line on GitHub: rogton repo → Settings →
Deploy keys → Add, **read-only**.

**Batch 4 — MAC** (puts the OpenAI key for this install — a NEW key in its own OpenAI project — onto the box without showing it;
save it first as `~/saas/vault/rogton-openai-key.txt`):
```bash
ssh -o BatchMode=yes gma 'git clone -q git@github.com:csillazoldi-cloud/rogton.git ~/admin && install -m 600 ~/admin/uzem/.env.pelda ~/gma/.env && mkdir -p ~/.config/systemd/user && cp ~/admin/uzem/systemd/gma-kirak.* ~/.config/systemd/user/'
ssh -o BatchMode=yes gma 'cd ~/gma && sed -i "s|^KM_TULAJ_JELSZO=.*|KM_TULAJ_JELSZO=$(openssl rand -hex 24)|; s|^KM_APP_JELSZO=.*|KM_APP_JELSZO=$(openssl rand -hex 24)|" .env'
ssh -o BatchMode=yes gma 'K=$(cat); sed -i "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$K|" ~/gma/.env' < ~/saas/vault/rogton-openai-key.txt
ssh -o BatchMode=yes gma "sed -i 's|^RENDSZERGAZDA_EMAIL=.*|RENDSZERGAZDA_EMAIL=admin@gyorsmedia.hu|; s|^NYILVANOS_CIM=.*|NYILVANOS_CIM=https://admin.gyorsmedia.hu|' ~/gma/.env"
ssh -o BatchMode=yes gma 'stat -c "%a %U" ~/gma/.env; grep -c CHANGE_ME ~/gma/.env; git -C ~/admin log --oneline -1'
```
Output must show: `600 gyorsadmin`, `0` (no placeholder left), and the latest `main` commit.

**Batch 5 — MAC** (first deploy by hand, then the timer):
```bash
ssh -o BatchMode=yes gma 'bash ~/admin/uzem/kirak.sh --kenyszer; echo KIRAK_KOD=$?'
ssh -o BatchMode=yes gma 'systemctl --user daemon-reload && systemctl --user enable --now gma-kirak.timer && systemctl --user list-timers gma-kirak.timer --no-pager'
```
Output must show: `kint van: <sha12>`, `KIRAK_KOD=0`, and the timer with a next run within 2 minutes. The first run builds
both images (several minutes).

**Batch 6 — MAC** (check it, then look at it in the browser through a tunnel):
```bash
ssh -o BatchMode=yes gma 'curl -s 127.0.0.1:8410/api/egeszseg; echo; docker ps --filter name=gma- --format "{{.Names}} {{.Status}} {{.Ports}}"'
ssh -o BatchMode=yes gma 'ss -ltnH | grep -E ":(8410|8601|5432|3000) "; docker exec gma-kepgyar node -e "fetch(\"https://example.com\").then(()=>console.log(\"KIFELE: VAN\"),()=>console.log(\"KIFELE: NINCS\"))"'
ssh -f -N -L 8410:127.0.0.1:8410 gma && open http://127.0.0.1:8410/belepes
```
Output must show: `{"allapot":"ok",…}`; four `gma-*` containers Up, only `gma-web` with `127.0.0.1:8410->80/tcp`; only
`127.0.0.1:8410` from this project in the port list (the 8601 line is the old `km-kepgyar`, not ours); `KIFELE: NINCS` from the
image maker; the login page opens in the Mac browser.

## By hand

```bash
cd ~/gma && docker compose -p gma --env-file .env -f forras/$(cut -c1-12 allapot/kint)/uzem/docker-compose.yml ps
bash ~/admin/uzem/kirak.sh --proba        # build + guard only, nothing switched
tail -50 ~/gma/naplo/kirak-$(date +%Y%m).log
```

Restore a pre-migration dump into an EMPTY `km` database:
`gunzip -c ~/gma/mentes/<file>.sql.gz | docker exec -i gma-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km`

## G6/G7 batches — WARP egress, network fence, Cloudflare Tunnel

Design and reasons: `docs/decisions/2026-10-18-g6-g7-halozat.md`. G6 goes live by itself once the `g6-g7` branch is merged into
`main` (the timer deploys it). Batches 7 and 11 are the only ones you run before or outside that.

**Batch 7 — MAC** (before the merge: what the outside sees today):
```bash
ssh -n gma 'docker exec gma-app node -e "fetch(\"https://www.cloudflare.com/cdn-cgi/trace\").then(r=>r.text()).then(t=>console.log(t.split(\"\\n\").filter(l=>/^(ip|loc|warp)=/.test(l)).join(\" \")))"'
```
Output must show: `ip=<the office IP> loc=RO warp=off` — note the ip; after G6 it must be different.

Now merge `g6-g7` into `main` on GitHub (your click). Within ~2 minutes the timer builds and deploys it (a few minutes).

**Batch 8 — MAC** (the first G6 deploy):
```bash
ssh -n gma 'grep -E "kirakás:|kint van|kimenő forgalom|PIROS|MEGÁLL" ~/gma/naplo/kirak-$(date +%Y%m).log | tail -6'
ssh -n gma 'docker ps --filter name=gma- --format "{{.Names}} {{.Status}}"'
```
Output must show: `kint van: <sha12>` and `kimenő forgalom: WARP (on)` for the new commit; `gma-egress … (healthy)`, `gma-app`, `gma-db`, `gma-kepgyar`, `gma-web` Up.

**Batch 9 — MAC** (egress probe):
```bash
ssh -n gma 'docker exec gma-app node -e "fetch(\"https://www.cloudflare.com/cdn-cgi/trace\").then(r=>r.text()).then(t=>console.log(t.split(\"\\n\").filter(l=>/^(ip|loc|colo|warp)=/.test(l)).join(\" \")))"'
ssh -n gma 'docker exec gma-app getent hosts db kepgyar; docker exec gma-egress warp-cli --accept-tos settings | grep -iE "mode|exclude" | head -6'
ssh -n gma 'docker exec gma-egress ss -tunp | grep -E "warp" | head -4'
ssh -n gma 'curl -s -o /dev/null -w "belepes %{http_code}\n" 127.0.0.1:8410/belepes'
```
Output must show: `warp=on` (or `plus`) and an `ip=` DIFFERENT from Batch 7 (loc may still say RO — free WARP exits at the nearest Cloudflare site; what matters is that the address is Cloudflare's, not the office's); two lines for db and kepgyar; `Mode: tunnel_only` and the excluded ranges including 172.16.0.0/12; warp-svc connected to a 162.159.x address; `belepes 200`.

**Batch 10 — MAC** (kill-switch: WARP off, then the egress container off — the site may go 502 for up to 2 minutes, then heals):
```bash
ssh -n gma 'docker exec gma-egress warp-cli --accept-tos disconnect; sleep 5; docker exec gma-app node -e "fetch(\"https://example.com\",{signal:AbortSignal.timeout(8000)}).then(r=>console.log(\"SZIVAROG\",r.status),e=>console.log(\"ZARVA\",e.cause?.code||e.name))"; docker exec gma-egress warp-cli --accept-tos connect'
ssh -n gma 'docker stop gma-egress >/dev/null; docker exec gma-app node -e "fetch(\"https://example.com\",{signal:AbortSignal.timeout(8000)}).then(r=>console.log(\"SZIVAROG\",r.status),e=>console.log(\"ZARVA\",e.cause?.code||e.name))"; curl -s -o /dev/null -w "belepes %{http_code}\n" 127.0.0.1:8410/belepes; docker start gma-egress >/dev/null'
ssh -n gma 'sleep 170; curl -s -o /dev/null -w "belepes %{http_code}\n" 127.0.0.1:8410/belepes; grep "újraalkotom" ~/gma/naplo/kirak-$(date +%Y%m).log | tail -1'
```
Output must show: `ZARVA …` twice and never `SZIVAROG`; `belepes 502` while egress is stopped (the app has no network then — accepted, it fails closed); after ~3 minutes `belepes 200` and the log line `gma-app nincs a mostani gma-egress hálózatában — újraalkotom`.

**Batch 11 — GIGABYTE (the ONE sudo batch of G6 — run it in an interactive `ssh gigabyte` session, it asks for your password once):**
```bash
sudo install -m 755 -o root -g root /home/gyorsadmin/admin/uzem/kerites.sh /usr/local/sbin/gma-kerites.sh
sudo install -m 644 -o root -g root /home/gyorsadmin/admin/uzem/systemd/gma-kerites.service /etc/systemd/system/gma-kerites.service
sudo systemctl daemon-reload && sudo systemctl enable --now gma-kerites.service
sudo /usr/local/sbin/gma-kerites.sh --mutat | grep -cE "DROP"
systemctl is-active gma-kerites.service
```
Output must show: a number ≥ 8 (the DROP rules for both gma subnets) and `active`.

**Batch 12 — MAC** (the fence from a gma container that has no kill-switch of its own — gma-web):
```bash
ssh -n gma 'for u in http://192.168.1.144 http://100.89.241.71 http://192.168.1.249:8601/eletjel http://172.17.0.1; do docker exec gma-web wget -T 5 -q -O /dev/null "$u" && echo "ELERHETO $u" || echo "TILTVA $u"; done'
ssh -n gma 'curl -s -o /dev/null -w "belepes %{http_code}\n" 127.0.0.1:8410/belepes; docker exec gma-app node -e "fetch(\"https://telex.hu/rss\").then(r=>console.log(\"hir\",r.status),e=>console.log(\"HIBA\",e.cause?.code))"'
```
Output must show: four `TILTVA` lines (NAS, Tailscale, the host's own port, another docker network), `belepes 200`, `hir 200`.

### G7 — Cloudflare (dashboard clicks, in this order)

1. **Account:** dash.cloudflare.com, sign up with your Gmail, turn on 2FA.
2. **Zone:** Add a domain → `gyorsmedia.hu` → Free plan. Keep the imported records; there is no MX/TXT today (probe P1).
3. **Pages (the static site):** Workers & Pages → Create → Pages → Upload assets (the site folder) → project name `gyorsmedia` → Deploy. (Done as a Worker in the end — measured by the coordinator 2026-10-18; the custom domains attach the same way.) Then Custom domains → add `gyorsmedia.hu` and `www.gyorsmedia.hu` (they activate after step 12).
4. **Tunnel:** Zero Trust → Networks → Tunnels → Create a tunnel → Cloudflared → name `gm-admin` → on the install screen copy ONLY the long token after `--token` into `~/saas/vault/rogton-cf-tunnel-token.txt` on the Mac (do not run the install command — the tunnel runs as a container) → Next.
5. **Public hostname** (same wizard): Subdomain `admin`, Domain `gyorsmedia.hu`, Path empty → Service Type `HTTP`, URL `gma-web:80` → Save.
6. **Access application:** Zero Trust → Access → Applications → Add → Self-hosted → name `Rögtön admin`, domain `admin.gyorsmedia.hu`, session 24 hours → Login method One-time PIN → policy `Engedélyezett`: Action Allow, Include → Emails → `csillazoldi@gmail.com` → Save.
7. **Bypass for the app icon** (same application → Policies → Add): name `Ikon`, Action Bypass, Include → Everyone; then in the application's paths add `admin.gyorsmedia.hu/manifest.webmanifest`, `admin.gyorsmedia.hu/favicon.ico`, `admin.gyorsmedia.hu/r18/ikon/*` (create it as a second self-hosted application named `Rögtön ikonok` with these three paths and the Bypass policy if the UI does not allow paths on the first one).
8. **Redirect:** gyorsmedia.hu zone → Rules → Redirect Rules → Create → Single Redirect → Custom filter: `(http.host in {"gyorsmedia.hu" "www.gyorsmedia.hu"} and starts_with(http.request.uri.path, "/admin/saas"))` → Static, URL `https://admin.gyorsmedia.hu`, Status 302, Preserve query string off → Deploy.
9. **SSL/TLS:** Overview → Full (strict). Edge Certificates → Always Use HTTPS ON, Minimum TLS Version 1.2, Automatic HTTPS Rewrites ON (HSTS: only after a stable week).
10. **Turn off page rewriting:** Scrape Shield → Email Address Obfuscation OFF. Speed → Optimization → Rocket Loader OFF. Web Analytics: no automatic injection on admin.gyorsmedia.hu.
11. **Cache rule:** Caching → Cache Rules → Create: name `admin nem cache-el`, expression `(http.host eq "admin.gyorsmedia.hu" and not starts_with(http.request.uri.path, "/_next/static/"))` → Bypass cache → Deploy.
12. **Nameservers (LAST):** at RackForest (portal.rackforest.com → domain → nameservers) set the two Cloudflare nameservers from step 2 (the RackForest account holder clicks this). Wait for „Active” in Cloudflare.

**Batch 13 — MAC** (token into the .env without showing it, trusted-proxy count, start the tunnel):
```bash
ssh gma 'K=$(cat); if grep -q "^CF_TUNNEL_TOKEN=" ~/gma/.env; then sed -i "s|^CF_TUNNEL_TOKEN=.*|CF_TUNNEL_TOKEN=$K|" ~/gma/.env; else echo "CF_TUNNEL_TOKEN=$K" >> ~/gma/.env; fi' < ~/saas/vault/rogton-cf-tunnel-token.txt
ssh -n gma 'cd ~/gma && sed -i "s|^MEGBIZHATO_PROXY_DB=.*|MEGBIZHATO_PROXY_DB=1|" .env && (grep -q "^COMPOSE_PROFILES=tunnel" .env || echo COMPOSE_PROFILES=tunnel >> .env) && stat -c "%a" .env'
ssh -n gma 'cd ~/gma && docker compose -p gma --env-file .env -f forras/$(cut -c1-12 allapot/kint)/uzem/docker-compose.yml up -d --no-build tunnel app 2>&1 | tail -3'
ssh -n gma 'sleep 15; docker logs --tail 20 gma-tunnel 2>&1 | grep -cE "Registered tunnel connection"'
```
Output must show: `600`, the tunnel and app containers started, and a number ≥ 1 (usually 4 registered connections).

**Batch 14 — MAC** (after the nameservers are Active):
```bash
dig +short admin.gyorsmedia.hu; dig +short gyorsmedia.hu
curl -sI https://admin.gyorsmedia.hu/belepes | grep -iE "^(HTTP|location)"
curl -sI https://gyorsmedia.hu/admin/saas | grep -iE "^(HTTP|location)"
curl -s -o /dev/null -w "manifest %{http_code}\n" https://admin.gyorsmedia.hu/manifest.webmanifest
```
Output must show: only Cloudflare addresses (104.x / 172.6x.x — never the office IP); `302` to a `cloudflareaccess.com` login for /belepes; `302` with `location: https://admin.gyorsmedia.hu` for /admin/saas; `manifest 200`.

Last check by hand: on your phone (mobile data) open `gyorsmedia.hu/admin/saas` → PIN mail → the Rögtön login → log in → open
`https://admin.gyorsmedia.hu/api/belso/cim`: „ahogy_latjuk” must be your phone's public address, not a 172.x address.

## G6b batches — after merging `g6b-javitasok`

**Batch 15 — MAC** (the deploy that brings G6b — watch the hand-over, the seed accounts and the self-heal):
```bash
ssh -n gma 'grep -E "kirakás:|átadom neki|lefutott: 0184|fiókok:|kint van|kimenő forgalom|PIROS|MEGÁLL" ~/gma/naplo/kirak-$(date +%Y%m).log | tail -8'
ssh -n gma "docker exec gma-db psql -U km_tulaj -d km -tAc \"SELECT email, felfuggesztve IS NOT NULL, rendszergazda FROM fiok WHERE email LIKE '%.example' OR rendszergazda ORDER BY 1\""
```
Output must show: `a kirak.sh ebben a változatban más — átadom neki`, `lefutott: 0184_g6b_mintafiokok_kivonva`, `fiókok: nincs aktív .example fiók`, `kint van`, `kimenő forgalom: WARP (on)`; the three `@teszt-…example` rows with `t | f` (suspended, not admin) and your own address with `rendszergazda` = `t` (if it is not, log out and back in once: the first-admin rule now ignores suspended admins).

**Batch 16 — MAC** (the restart case that stayed 502 before G6b):
```bash
ssh -n gma 'docker restart gma-egress >/dev/null; sleep 5; curl -s -o /dev/null -w "kozvetlenul utana %{http_code}\n" 127.0.0.1:8410/belepes'
ssh -n gma 'sleep 170; curl -s -o /dev/null -w "3 perc mulva %{http_code}\n" 127.0.0.1:8410/belepes; grep -E "újraindult a gma-app után|nem válaszol" ~/gma/naplo/kirak-$(date +%Y%m).log | tail -1'
```
Output must show: `kozvetlenul utana 502` (accepted — the app's namespace died with the restart), then `3 perc mulva 200` and the log line `gma-egress újraindult a gma-app után … — gma-app újraindítása`.

## G8 batches — nightly backup, off-box copy, restore drill, heartbeat

Merge `g8-uzem` into `main` first; the timer deploys it within minutes and moves `~/admin` to it (the scripts and units come from
there). The private backup key is made on the Mac and never leaves it — **put `~/saas/vault/rogton-mentes-kulcs` in your own
backup of the vault: without it no backup can ever be opened.**

**Batch 17 — MAC** (the backup key pair; only the public half goes to the box):
```bash
command -v age >/dev/null || brew install age
[ -f ~/saas/vault/rogton-mentes-kulcs ] || age-keygen -o ~/saas/vault/rogton-mentes-kulcs 2>/dev/null; chmod 600 ~/saas/vault/rogton-mentes-kulcs
age-keygen -y ~/saas/vault/rogton-mentes-kulcs | ssh gma 'cat > ~/gma/mentes-kulcs.pub && cat ~/gma/mentes-kulcs.pub'
ssh -n gma 'git -C ~/admin log --oneline -1; ls ~/admin/uzem/mentes.sh ~/admin/uzem/systemd/gma-mentes.timer'
```
Output must show: one line starting `age1`, the merged G8 commit, and both files listed.

**Batch 18 — GIGABYTE (the ONE sudo batch of G8 — run it in an interactive `ssh gigabyte` session, it asks for your password once):**
```bash
sudo apt-get install -y age
age --version
```
Output must show: a version line (e.g. `v1.2.1`) — Ubuntu's `age` package from the universe repository.

**Batch 19 — MAC** (timers in, first backup and first heartbeat by hand):
```bash
ssh -n gma 'cp ~/admin/uzem/systemd/gma-mentes.* ~/admin/uzem/systemd/gma-szivdobbanas.* ~/.config/systemd/user/ && systemctl --user daemon-reload && systemctl --user enable --now gma-mentes.timer gma-szivdobbanas.timer'
ssh -n gma 'systemctl --user start gma-mentes.service; tail -4 ~/gma/naplo/mentes-$(date +%Y%m).log'
ssh -n gma 'systemctl --user start gma-szivdobbanas.service; tail -1 ~/gma/naplo/szivdobbanas-$(date +%Y%m).log'
ssh -n gma 'systemctl --user list-timers --no-pager | grep gma-'
```
Output must show: `adatbázis: … fiok/szervezet: …`, `fájlok: …`, `mentés kész: /home/gyorsadmin/gma/mentes/napi/<date>.age <size>`;
`rendben: életjel 200, warp=on`; three timers (`gma-kirak`, `gma-mentes` next at 03:4x, `gma-szivdobbanas`).

**Batch 20 — MAC** (the copy to the Mac, then the restore drill on it):
```bash
mkdir -p ~/saas/rogton-uzem && scp -q gma:admin/uzem/mentes-lehuz.sh ~/saas/rogton-uzem/
bash ~/saas/rogton-uzem/mentes-lehuz.sh
age -d -i ~/saas/vault/rogton-mentes-kulcs "$(ls -1 ~/saas/mentes/rogton/*.age | tail -1)" | ssh gma 'bash ~/admin/uzem/mentes-visszatolt.sh -'
ssh -n gma 'docker ps -a --filter name=gma-proba-db --format "{{.Names}}" | wc -l'
```
Output must show: `lehúzva: <date>.age …`, `próba-visszafejtés: rendben`, the drill's `fiok: N szervezet: M` equal to the counts at
backup time, `visszatöltési próba: ZÖLD`, and `0` (the throwaway database is gone). Run lines 2–3 again whenever you want a fresh
copy on the Mac; scheduling it on the Mac is an open item.

**Batch 21 — MAC** (OPTIONAL: Telegram alert. Make a bot with @BotFather, save its token as `~/saas/vault/rogton-riasztas-telegram-token.txt`
and your chat id — send the bot one message, then open `https://api.telegram.org/bot<token>/getUpdates`, `"chat":{"id":…}` — as
`~/saas/vault/rogton-riasztas-telegram-chat.txt`):
```bash
ssh gma 'T=$(cat); sed -i "/^RIASZTAS_TELEGRAM_TOKEN=/d" ~/gma/.env; echo "RIASZTAS_TELEGRAM_TOKEN=$T" >> ~/gma/.env' < ~/saas/vault/rogton-riasztas-telegram-token.txt
ssh gma 'C=$(cat); sed -i "/^RIASZTAS_TELEGRAM_CHAT=/d" ~/gma/.env; echo "RIASZTAS_TELEGRAM_CHAT=$C" >> ~/gma/.env' < ~/saas/vault/rogton-riasztas-telegram-chat.txt
ssh -n gma 'stat -c %a ~/gma/.env; bash ~/admin/uzem/szivdobbanas.sh --proba-uzenet'
```
Output must show: `600`, `telegram: elküldve`, and the test message on your phone. To switch it off again: empty both lines.

**Batch 22 — MAC** (the floating „Visszajelzés” button off, and the `/api/belso/cim` charset — both come with the G8 deploy itself;
the `.env` line only makes the default explicit, so no `up -d` is needed when you run this AFTER the G8 deploy is live):
```bash
ssh -n gma 'sed -i "/^VISSZAJELZES_GOMB=/d" ~/gma/.env && echo "VISSZAJELZES_GOMB=ki" >> ~/gma/.env && grep -c "^VISSZAJELZES_GOMB=ki$" ~/gma/.env'
ssh -n gma 'git -C ~/admin log --oneline -1; docker exec gma-app printenv VISSZAJELZES_GOMB'
ssh -n gma 'curl -s -D - -o /dev/null 127.0.0.1:8410/api/belso/cim | grep -i "^content-type"'
```
Output must show: `1`, the merged G8 commit and `ki`, and `content-type: application/json; charset=utf-8`. Then open the site on the
phone: no floating button bottom right, no „Visszajelzés” row in the ☰ menu. (If `printenv` prints nothing, the G8 deploy is not
live yet — wait for it; the compose default is `ki` anyway.)

## G9 — the site gate (one shared password) instead of Cloudflare Access

Reasons and behaviour: `docs/decisions/2026-10-18-g9-kapu.md`. Order matters: **password into the `.env` first (Batch 23), then
merge `g9-kapu`** (after `g8-uzem`) — so the very first G9 deploy already has its password. (Without one, the gate fails CLOSED
towards Cloudflare: „A belépés most nem elérhető.” for everyone outside the box. Nothing breaks, but nobody gets in.) Access stays
on until Batch 24 has measured the gate live; only then remove it (Cloudflare steps below).

**Batch 23 — MAC** (the gate password: made on the Mac, kept in the vault, pushed into the box's `.env` through stdin — never on a
command line, never printed):
```bash
[ -f ~/saas/vault/rogton-kapu-jelszo ] || (umask 077; openssl rand -base64 18 | tr -d '\n' > ~/saas/vault/rogton-kapu-jelszo); chmod 600 ~/saas/vault/rogton-kapu-jelszo
ssh gma 'J=$(cat); sed -i "/^KAPU_JELSZO=/d" ~/gma/.env; printf "KAPU_JELSZO=%s\n" "$J" >> ~/gma/.env; grep -c "^KAPU_JELSZO=." ~/gma/.env; stat -c %a ~/gma/.env' < ~/saas/vault/rogton-kapu-jelszo
```
Output must show: `1` and `600`. Now merge `g9-kapu` into `main` (after `g8-uzem`); the timer deploys it within minutes and the new
`gma-app` reads the password at start — no separate `up -d` needed. (If G9 is ALREADY live when you run this batch, add:
`ssh -n gma 'cd ~/gma && docker compose -p gma --env-file .env -f forras/$(cut -c1-12 allapot/kint)/uzem/docker-compose.yml up -d --no-build app'`.)

**Batch 24 — MAC** (measure the gate on the box, through nginx, pretending to be Cloudflare with a `cf-connecting-ip` header from the documentation range — Access is still on outside):
```bash
ssh -n gma 'git -C ~/admin log --oneline -1; docker exec gma-app sh -c "test -n \"\$KAPU_JELSZO\" && echo kapu-be"; curl -s -o /dev/null -w "%{http_code}\n" -H "cf-connecting-ip: 203.0.113.7" 127.0.0.1:8410/api/program/lista'
ssh -n gma 'curl -s 127.0.0.1:8410/belepes | grep -o "action=\"/kapu\"\|name=\"jelszo\"" | sort -u; curl -s -o /dev/null -w "egeszseg %{http_code} " 127.0.0.1:8410/api/egeszseg; curl -s -o /dev/null -w "manifest %{http_code}\n" 127.0.0.1:8410/manifest.webmanifest'
ssh -n gma 'for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w "%{http_code} " -H "cf-connecting-ip: 203.0.113.250" -d "jelszo=rossz-$i" 127.0.0.1:8410/kapu; done; echo'
```
Output must show: the merged G9 commit, `kapu-be`, `401`; `action="/kapu"` and `name="jelszo"`, `egeszseg 200 manifest 200`;
`401 401 401 401 401 429`. (The tests go through nginx on the box with a documentation address, so your own address is never
rate-limited by them. Run line 3 only once per 15 minutes — a second run shows six `429`s.) Then open https://admin.gyorsmedia.hu on the phone: Access PIN first (still on), then the gate page →
type the password from the vault → the app's own login page.

**Cloudflare — after Batch 24 is green (clicks, nothing on the box):**
1. Zero Trust → Access controls → Applications → „Rögtön admin” → Delete; „Rögtön ikonok” → Delete (the bypass app is not needed).
2. Security → WAF → Rate limiting rules → Create rule (Free plan: 1 rule) → name `kapu` → custom expression
   `(http.host eq "admin.gyorsmedia.hu" and http.request.uri.path eq "/kapu" and http.request.method eq "POST")` → 10 requests per
   10 seconds, counted by IP → Action Block, duration 1 minute → Deploy. (Backstop only; the app's own limit is the real one.)
3. Keep the tunnel, the redirect, SSL and the cache rule as they are.

**Batch 25 — MAC** (after the Access apps are gone: the gate is the first thing a stranger sees, with no Access redirect):
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://admin.gyorsmedia.hu/belepes
curl -s https://admin.gyorsmedia.hu/belepes | grep -c 'action="/kapu"'
curl -s -w " %{http_code}\n" https://admin.gyorsmedia.hu/api/program/lista
curl -s -o /dev/null -w "%{http_code}\n" https://admin.gyorsmedia.hu/api/egeszseg
```
Output must show: `200 ` (no `cloudflareaccess.com` redirect), `1`, `{"hiba":"kapu"} 401`, `200`.
