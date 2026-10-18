"use client";
// R-17 A2 (12f2, Kati #11 „mit jelent a négyzetes logó?”): a kijelölt „Profilképnek” hely előnézete — egy közösségi oldal fejléce
// (borító + kerek profilkép a négyzetes logóval, alatta a cég neve). Tisztán kliens-oldali minta, végpont nincs; a logó a munkatér
// SAJÁT fájlja (GET /api/arculat/fajl/<id>). A minta fehér kártyája a 08b Facebook-előnézet értékeivel (tokenek.md: tartalom-makett).
import { useFeliratok } from "../../../../nyelv/kliens";

export function ProfilkepMinta({ logoId, hatter, borito, nev, alcim }: { logoId: string; hatter: string; borito: string; nev: string; alcim: string }) {
  const { t } = useFeliratok();
  return (
    <div className="r16a-igy" data-r15="eredmeny">
      <p className="r15-info r17-pk-cimke" data-r15="info">{t("r17.arculat.logok.igy_profilkep")}</p>
      <div className="r17-pk">
        <div className="r17-pk-borito" style={{ background: borito }} />
        <div className="r17-pk-kor" style={{ background: hatter }}>
          <img src={`/api/arculat/fajl/${logoId}`} alt="" />
        </div>
        <div className="r17-pk-test">
          <div className="r17-pk-nev">{nev}</div>
          {alcim ? <div className="r17-pk-alcim">{alcim}</div> : null}
          <div className="r17-pk-gombok" aria-hidden="true"><span /><span /></div>
        </div>
      </div>
    </div>
  );
}
