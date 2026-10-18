import { MUNKAMENET_SUTI } from "@rogton/contracts";

export function munkamenetSutiBeallit(valasz: Response, token: string, lejar: Date): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const suti = `${MUNKAMENET_SUTI}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${lejar.toUTCString()}${secure}`;
  valasz.headers.append("set-cookie", suti);
}

export function munkamenetSutiTorol(valasz: Response): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const suti = `${MUNKAMENET_SUTI}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
  valasz.headers.append("set-cookie", suti);
}

export function munkamenetTokenKeresbol(keres: Request): string | undefined {
  const cookieFejlec = keres.headers.get("cookie");
  if (!cookieFejlec) return undefined;
  for (const resz of cookieFejlec.split(";")) {
    const [nev, ...ertekReszek] = resz.trim().split("=");
    if (nev === MUNKAMENET_SUTI) {
      return ertekReszek.join("=");
    }
  }
  return undefined;
}
