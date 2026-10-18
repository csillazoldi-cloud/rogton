#!/bin/sh
# Halozati kerites a SaaS dobozainak. A NAS-on fut, rendszergazdakent.
#
# MIERT: a letoltest vegzo doboz ellenseges bemenettel dolgozik (barki barmilyen hirforrast
# felvehet). Kerites nelkul abbol a dobozbol elerheto volt a NAS sajat felulete, az ssh-ja,
# a masik negy projekt halozata es a Dell is — merve 2026-09-10-en.
# Biztonsagi felulvizsgalat 2026-09-10, B-03 kiegeszitese (Vilmos dontese: halozati kerites).
#
# MIT ENGED: a sajat halozatan beluli forgalmat (adatbazis, AI-hid, nginx) es a NYILVANOS internetet.
# MIT TILT: minden mas belso tartomanyt, es azt is, hogy a doboz kapcsolatot KEZDEMENYEZZEN a NAS fele.
#           A mar futo kapcsolatok valaszai atmennek — kulonben az oldal allna le.
#
# IDEMPOTENS: ahanyszor lefut, ugyanaz az eredmeny. A kirakas minden alkalommal meghivja.
# Visszavonas:  sh kerites.sh --le
set -e
H=${KM_HALOZAT:-172.23.0.0/16}

van() { iptables -C "$@" 2>/dev/null; }
tesz() { van "$@" || iptables -I "$@"; }

if [ "$1" = "--le" ]; then
  iptables -D INPUT -s $H -m conntrack --ctstate NEW -j DROP 2>/dev/null || true
  iptables -D INPUT -s $H -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || true
  for t in 169.254.0.0/16 100.64.0.0/10 192.168.0.0/16 172.16.0.0/12 10.0.0.0/8; do
    iptables -D DOCKER-USER -s $H -d $t -j DROP 2>/dev/null || true
  done
  iptables -D DOCKER-USER -s $H -d $H -j ACCEPT 2>/dev/null || true
  iptables -D DOCKER-USER -s $H -d ${KM_KEPGYAR:-192.168.1.249} -p tcp --dport ${KM_KEPGYAR_PORT:-8601} -j ACCEPT 2>/dev/null || true
  echo "kerites levéve"
  exit 0
fi

# 0. Szuk kivetel (V-6, Vilmos dontese 2026-09-24): a kepgyarto a Gigabyte-on — CSAK ez a gep, CSAK ez a port.
#    A DROP-ok ELE kerul (az -I 1 miatt az utoljara betett all legfelul, ezert a ciklus UTAN tesszuk be).
KEPGYAR=${KM_KEPGYAR:-192.168.1.249}
KEPGYAR_PORT=${KM_KEPGYAR_PORT:-8601}

# 1. Tovabbitott forgalom (mas gepek fele): a sajat halozat ENGEDVE, a tobbi belso tartomany TILTVA.
#    A sorrend szamit: a sajat halozat ACCEPT-je legyen a DROP-ok ELOTT.
for t in 169.254.0.0/16 100.64.0.0/10 192.168.0.0/16 172.16.0.0/12 10.0.0.0/8; do
  tesz DOCKER-USER 1 -s $H -d $t -j DROP
done
tesz DOCKER-USER 1 -s $H -d $H -j ACCEPT
tesz DOCKER-USER 1 -s $H -d $KEPGYAR -p tcp --dport $KEPGYAR_PORT -j ACCEPT

# 2. Maga a NAS fele: uj kapcsolat TILTVA, a mar futok valasza ATMEGY.
tesz INPUT 1 -s $H -m conntrack --ctstate NEW -j DROP
tesz INPUT 1 -s $H -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

echo "kerites a helyen ($H)"
