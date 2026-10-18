// apps/web/app/sajat-fiok/SajatFiok.tsx — RÉSZLET (a nyelv mezője)
];

export function SajatFiok({ nezet }: { nezet: SajatFiokNezet }) {
  const { t, nyelv } = useFeliratok();

  const [nev, setNev] = useState(nezet.fiok.nev);
  const [nevMentesAllapot, setNevMentesAllapot] = useState<NevMentesAllapot>("ures");
// … (kihagyva) …
            <span className="km-sf-mezo-megj">{t("sajat.email_megj")}</span>
          </div>

          <div className="km-sf-mezo-csoport">
            <label htmlFor="sf-nyelv" className="km-sf-mezo-cimke">{t("sajatfiok.felulet_nyelve")}</label>
            <select
              id="sf-nyelv"
              value={nezet.fiok.nyelv ?? "hu"}
              onChange={(e) => nyelvValt(e.target.value as "hu" | "ro" | "en")}
              className="km-sf-mezo km-sf-mezo-select"
            >
              {NYELVEK.map((n) => (
                <option key={n.kod} value={n.kod}>{n.nev}</option>
