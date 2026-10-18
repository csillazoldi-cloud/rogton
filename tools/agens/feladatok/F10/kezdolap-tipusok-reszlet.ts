  /** hány forrás akadt el a legutóbbi futásban (különböző forrás_id-k száma) */
  forrashiba: number;
  /** R-7b 02 (D-F42 E1): a legfontosabb 3 friss cím a Hírek csempére — fontos → érdekes sorrendben, elrejtett nélkül */
  elso_cimek: { talalat_id: string; cim: string; kategoria: "fontos" | "erdekes" | "hatter" }[];
  /** hány találat értékelése függőben (fuggoben + keret_kimerult) */
  fuggoben: number;
  /** igaz, ha van keret_kimerult állapotú találat — a csempe a kezdolap.keret_elfogyott mondatot mutatja */
