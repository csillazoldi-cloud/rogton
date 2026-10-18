// apps/web/app/hirfigyelo/Attekintes.tsx — RÉSZLET
  const { t, nyelv } = useFeliratok();
  const router = useRouter();

  const [betoltve, setBetoltve] = useState(false);
  const [lassu, setLassu] = useState(false);
  const [hiba, setHiba] = useState<string | null>(null);
  const [beallitas, setBeallitas] = useState<BeallitasValasz | null>(null);
  const [attekintes, setAttekintes] = useState<AttekintesValasz | null>(null);
  const [osszkep, setOsszkep] = useState<OsszkepValasz | null>(null);
  const [osszkepHiba, setOsszkepHiba] = useState(false);
  const [futAllapot, setFutAllapot] = useState<FutAllapot>("all");
  const [futHiba, setFutHiba] = useState<string | null>(null);
  const [szuro, setSzuro] = useState<Szuro>("new");
  const [hiddenNote, setHiddenNote] = useState(false);
  const [kartyak, setKartyak] = useState<Kartya[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [otletHiba, setOtletHiba] = useState<string | null>(null);
  const [otletFut, setOtletFut] = useState(false);
  const [megtekintettHelyi, setMegtekintettHelyi] = useState<Set<string>>(new Set());
  const [ujraFut, setUjraFut] = useState(false);

  const sorbanRef = useRef<SorTetel | null>(null);
  const futAllapotRef = useRef<FutAllapot>("all");
  futAllapotRef.current = futAllapot;

// … (kihagyva) …
    }
    setAttekintes(a.torzs);
    setBeallitas(b.torzs);
    setKartyak(a.torzs.kartyak);
    sorbanRef.current = a.torzs.sorban;
    if (a.torzs.sorban) {
      setFutAllapot("fut");
      void varjSor(a.torzs.sorban.id).then((sor) => {
        if (sor?.allapot === "hiba") {
          setFutAllapot("hiba");
          setFutHiba(t("hf.futas_hiba"));
        } else {
          setFutAllapot("all");
          void ujraBetolt();
        }
      });
    }
    setBetoltve(true);
    // F9-A2: az összkép a háttérben töltődik, nem blokkolja a kártyákat.
    void osszkepBetolt(a.torzs.kartyak);
  }, [router, t, osszkepBetolt]);

  const ujraBetolt = useCallback(async () => {
    const a = await hfKeres<AttekintesValasz>("/api/hirfigyelo/attekintes");
    if (a.statusz === 200) {
      setAttekintes(a.torzs);
      setKartyak(a.torzs.kartyak);
      sorbanRef.current = a.torzs.sorban;
      void osszkepBetolt(a.torzs.kartyak);
    }
  }, [osszkepBetolt]);

  // F9-A6: egy elakadt értékelés újraindítása — a sor-tételre várunk, utána újratöltünk.
  const ertekelesUjra = useCallback(async () => {
    const v = await hfKeres<{ sor: SorTetel }>("/api/hirfigyelo/ertekeles-ujra", "POST", {});
    if (v.statusz === 202 && v.torzs.sor?.id) {
      setUjraFut(true);
      const sor = await varjSor(v.torzs.sor.id);
      setUjraFut(false);
      if (sor) void ujraBetolt();
      return;
    }
    setUjraFut(false);
  }, [ujraBetolt]);

// … (kihagyva) …
      return;
    }
    if (v.statusz === 409 && v.hiba === "FUT_MAR") {
      setFutAllapot("fut");
      // Megpróbáljuk megtalálni a sor-tételt
      const a = await hfKeres<AttekintesValasz>("/api/hirfigyelo/attekintes");
      if (a.statusz === 200 && a.torzs.sorban) {
        sorbanRef.current = a.torzs.sorban;
        void varjSor(a.torzs.sorban.id).then((sor) => {
          if (sor?.allapot === "hiba") {
            setFutAllapot("hiba");
            setFutHiba(t("hf.futas_hiba"));
          } else {
            setFutAllapot("all");
            void ujraBetolt();
          }
        });
      }
      return;
    }
    if (v.statusz === 202 && v.torzs.sor) {
      setFutAllapot("fut");
      sorbanRef.current = v.torzs.sor;
      void varjSor(v.torzs.sor.id).then((sor) => {
        if (sor?.allapot === "hiba") {
          setFutAllapot("hiba");
          setFutHiba(t("hf.futas_hiba"));
        } else {
          setFutAllapot("all");
          void ujraBetolt();
        }
      });
      return;
// … (kihagyva) …
                  ⚠ {t("hf.stPartialShort", { n: forrasHibak.length })}
                </a>
              )}
              {!fut && szerep !== "nezo" && (
                <button className="km-hf-at-futtatas" onClick={() => void futasIndit()}>
                  {t("hf.stRunNow")}
                </button>
              )}
              {fut && (
                <span className="km-hf-at-fut" aria-live="polite">
                  <span className="km-hf-at-porgo" aria-hidden="true" />
                  {t("hf.stRunning")}
                </span>
              )}
            </div>

            {futHibas && (
