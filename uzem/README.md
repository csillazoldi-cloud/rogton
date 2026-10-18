# uzem — running Rögtön on the Gigabyte

One compose project `gma` under its own Linux user `gyorsadmin`. Nothing here touches the other projects on the box
(other users' units, `km-kepgyar` on :8601, `misszio-masolat-*`, `festival-*`).

| What | Where |
|---|---|
| user | `gyorsadmin` (docker group, linger; no sudo) |
| deploy-script checkout | `~/admin` (moved to the live commit after each deploy) |
| data root `GMA_GYOKER` | `~/gma` — `adatok/{postgres,fajlok,album}`, `mentes/` (pre-migration dumps), `uzem-aktiv/` (live config), `forras/<sha12>/` (sources, last 5), `naplo/`, `allapot/`, `_torolni/` |
| secrets | `~/gma/.env` (mode 600) — template `uzem/.env.pelda` |
| containers | `gma-db`, `gma-app`, `gma-kepgyar`, `gma-web` |
| networks | `gma-belso` (internal, no gateway: db, kepgyar), `gma-kimeno` (app, web) |
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
