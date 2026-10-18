# @km/design-system felülete (kivonat)
export const NYELVEK = ["hu", "ro", "en"] as const;
export type Nyelv = (typeof NYELVEK)[number];
export const Nyelv: z.ZodEnum<...>;          // zod séma
export const ALAP_NYELV: Nyelv = "hu";
export const NYELV_SUTI = "km_nyelv" as const;
export const TemaDefinicio: z.ZodObject<...>; // { $schema: "km-theme/2", name: string, tokens: AlapTokenek }
export type TemaDefinicio = z.infer<typeof TemaDefinicio>;
export function cssValtozok(t: AlapTokenek): string; // ":root{--bg:#0c0d13;…}"
// "@km/design-system/tema-alap.json" — az alap témadefiníció JSON-ként importálható
