              )}
            </div>
          )}

          {/* 3 legfontosabb cím */}
          {hf !== null && hf.elso_cimek.length > 0 && (
            <div className="km-kp-hirek-lista">
              {hf.elso_cimek.map((c) => (
                <Link
                  key={c.talalat_id}
                  href={`/hirfigyelo?talalat=${encodeURIComponent(c.talalat_id)}`}
                  className="km-kp-hirek-sor"
                >
                  <span className="km-kp-hirek-kat">{t(`hf.kat_${c.kategoria}`)}</span>
                  <span className="km-kp-hirek-cimsor">{c.cim}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Ha nincs beállítva a hírfigyelő */}
          {/* R-7b 02: beállítás nélkül a csempe fejléce mondja („Még nem futott"), a fő gomb a lapcím mellett — itt nincs második gomb */}
        </div>

        {/* Üzemállapot-sor */}
        <details className="km-kp-uzemallapot">
