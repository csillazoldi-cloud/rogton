import "server-only";
import zavar from "@rogton/vizual-receptek/receptek/recept-zavar.json";
import allitas from "@rogton/vizual-receptek/receptek/recept-allitas.json";
import adatsavok from "@rogton/vizual-receptek/receptek/recept-adatsavok.json";
import zavarMinta from "@rogton/vizual-receptek/minta/zavar.json";
import allitasMinta from "@rogton/vizual-receptek/minta/allitas.json";
import adatsavokMinta from "@rogton/vizual-receptek/minta/adatsavok.json";

// VZ-1: a sablonok a munkatér saját adataiból — a szerkesztő mezői akkor is megjelennek, ha a képgyártó nem válaszol
// (a rajz 07-es állapota: a mezők maradnak, csak a kép helyén van hiba).
// 1. kör: minden munkatér a próba-arculatot kapja, ezért a képen a nyelvrend ro, hu (a próba-arculat szerint).

type Nyers = { recept: Record<string, unknown>; mezok: Record<string, unknown>[] };
const NYELVEK: [string, string] = ["ro", "hu"];
const LISTA: [Nyers, { mezok: unknown }][] = [
  [zavar as unknown as Nyers, zavarMinta],
  [allitas as unknown as Nyers, allitasMinta],
  [adatsavok as unknown as Nyers, adatsavokMinta],
];

export function sablonLista() {
  return LISTA.map(([r, minta]) => {
    const ill = (m: Record<string, unknown>) => (m["illesztes"] ?? {}) as Record<string, unknown>;
    return {
      azonosito: String(r.recept["azonosito"]),
      nev: String(r.recept["nev"]),
      alap: minta.mezok,
      nyelvek: NYELVEK,
      mezok: r.mezok.map((m) => ({
        azonosito: m["azonosito"],
        cimke: m["cimke"],
        tipus: m["tipus"],
        kotelezo: m["kotelezo"],
        nyelvpar: m["nyelvpar"],
        rovid_megadhato: ill(m)["rovid_valtozat_megadhato"] === true,
      })),
    };
  });
}

export const SABLON_AZONOSITOK = LISTA.map(([r]) => String(r.recept["azonosito"]));
