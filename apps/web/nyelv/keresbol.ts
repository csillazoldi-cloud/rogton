import "server-only";
import { NYELV_SUTI } from "@rogton/design-system";
import { nyelvKeresbol } from "./index";

/**
 * A KÉRÉS nyelve: a nyelv-süti, annak hiányában a böngésző nyelve, végül a magyar (E-29c).
 * Akkor kell, ha a fiók még nem VÁLTOTT nyelvet (`fiok.nyelv` üres): a háttérben induló figyelés
 * így is a felhasználó nyelvén válaszol, nem esik vissza automatikusan magyarra.
 */
export function keresNyelve(keres: Request): "hu" | "ro" | "en" {
  const suti = keres.headers.get("cookie") ?? "";
  const ertek = suti
    .split(";")
    .map((r) => r.trim())
    .find((r) => r.startsWith(`${NYELV_SUTI}=`))
    ?.slice(NYELV_SUTI.length + 1);
  return nyelvKeresbol(ertek, keres.headers.get("accept-language"));
}
