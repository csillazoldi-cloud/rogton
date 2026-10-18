// apps/web/app/hirfigyelo/beallitas/Beallitas.tsx — RÉSZLET
  const [betoltesHiba, setBetoltesHiba] = useState(false);
  const [mentesAllapot, setMentesAllapot] = useState<"nyugto" | "mentes" | "sikeres" | "hiba">("nyugto");
  const [mentesUzenet, setMentesUzenet] = useState<string>("");
  const [javaslatFolyik, setJavaslatFolyik] = useState(false);
  const [javaslatHiba, setJavaslatHiba] = useState(false);
  const [javaslatKesz, setJavaslatKesz] = useState(false);
  const [javaslatTervezet, setJavaslatTervezet] = useState<BeallitasTipus | null>(null);
  const [probaAllapot, setProbaAllapot] = useState<"nyugto" | "fut" | "kesz">("nyugto");
  const [probaHiba, setProbaHiba] = useState(false);
  const [ujTema, setUjTema] = useState("");
  const [sajatNev, setSajatNev] = useState("");
  const [sajatNevMod, setSajatNevMod] = useState<"csak_szervezet" | "nevemet_is">("csak_szervezet");
  const [hibasMezok, setHibasMezok] = useState<Set<string>>(new Set());
  const [tervezetIdozito, setTervezetIdozito] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [savedOkV, setSavedOkV] = useState<number | null>(null);
  const [piszkos, setPiszkos] = useState(false);
  const [vanAktiv, setVanAktiv] = useState(false);
  const [tervezetVan, setTervezetVan] = useState(false);
  const [aktivBeallitas, setAktivBeallitas] = useState<BeallitasTipus | null>(null);
  const [mentveIdo, setMentveIdo] = useState<string | null>(null);
  const betoltveRef = useRef(false);
// … (kihagyva) …

  // Próbafuttatás
  const probaFuttatas = async () => {
    if (!szerkesztheto || probaAllapot === "fut" || !vanAktiv) return;
    setProbaAllapot("fut");
    setProbaHiba(false);
    const v = await hfKeres<{ sor: { id: string } }>("/api/hirfigyelo/futas", "POST", { proba: true });
    if (v.statusz === 202 && v.torzs.sor) {
      const sor = await varjSor(v.torzs.sor.id);
      if (sor && sor.allapot === "kesz") {
        setProbaAllapot("kesz");
      } else {
        setProbaAllapot("nyugto");
        setProbaHiba(true);
      }
    } else if (v.statusz === 409 && v.hiba === "NINCS_BEALLITAS") {
      setProbaAllapot("nyugto");
    } else {
      setProbaAllapot("nyugto");
      setProbaHiba(true);
    }
  };

  // Napi figyelés bekapcsolása
  const napiBekapcsol = async () => {
// … (kihagyva) …
            <button
              type="button"
              className="km-hf-be-gomb km-hf-be-gomb-szellem"
              onClick={probaFuttatas}
              disabled={probaAllapot === "fut" || !vanAktiv}
            >
              {probaAllapot === "fut" ? t("hf.trialRunningBtn") : t("hf.proba_inditasa")}
            </button>
            {!vanAktiv && <div className="km-hf-be-megj">{t("hf.proba_miert_nem")}</div>}
            {beallitas.idozites.mod === "napi" ? (
              <div className="km-hf-be-megj">{t("hf.schDaily")}</div>
