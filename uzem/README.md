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
| log | `~/gma/naplo/kirak-<YYYYMM>.log`, build and migration logs next to it |

Deploy steps, rollback rules and exit codes: the header of `kirak.sh`.

**Order:** the timer deploys `origin/main`. Run Batch 5 only after the branch with the banned-string guard (G4) is merged
into `main` — `kirak.sh` refuses to deploy a commit without `tools/tiltott`. Before Batch 5, a Docker prune on the box is worth
doing (`docker builder prune` reclaims ~70 GB, measured at G0) — that is Csilla's click, not part of these batches.

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
3. **Pages (the static site):** Workers & Pages → Create → Pages → Upload assets (the site folder) → project name `gyorsmedia` → Deploy. Then Custom domains → add `gyorsmedia.hu` and `www.gyorsmedia.hu` (they activate after step 12).
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
