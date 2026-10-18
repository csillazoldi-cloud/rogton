"use client";

import { useRef, type KeyboardEvent, type ReactElement } from "react";

export type IranytuBlokkKod =
  | "celok"
  | "vizio"
  | "ertekek"
  | "idoszakok"
  | "tolni"
  | "kerulni";

export type IranytuBlokkSor = {
  kod: IranytuBlokkKod;
  cim: string;
  allapot: string;
};

export function BlokkValaszto({
  sorok,
  aktiv,
  valaszt,
}: {
  sorok: IranytuBlokkSor[];
  aktiv: IranytuBlokkKod;
  valaszt: (kod: IranytuBlokkKod) => void;
}): ReactElement {
  const gombokRef = useRef<Array<HTMLButtonElement | null>>([]);

  function fokusz(index: number): void {
    const cel = gombokRef.current[index];
    if (cel) {
      cel.focus();
    }
  }

  function billentyu(
    esemeny: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ): void {
    const utolso = sorok.length - 1;
    if (utolso < 0) {
      return;
    }
    switch (esemeny.key) {
      case "ArrowUp": {
        esemeny.preventDefault();
        fokusz(index <= 0 ? utolso : index - 1);
        break;
      }
      case "ArrowDown": {
        esemeny.preventDefault();
        fokusz(index >= utolso ? 0 : index + 1);
        break;
      }
      case "Home": {
        esemeny.preventDefault();
        fokusz(0);
        break;
      }
      case "End": {
        esemeny.preventDefault();
        fokusz(utolso);
        break;
      }
      default:
        break;
    }
  }

  return (
    <nav className="km-ir-nav" aria-label="Iránytű blokkok">
      {sorok.map((sor, index) => {
        const aktivE = sor.kod === aktiv;
        return (
          <button
            key={sor.kod}
            type="button"
            ref={(elem) => {
              gombokRef.current[index] = elem;
            }}
            className={aktivE ? "km-ir-nav-aktiv" : undefined}
            aria-current={aktivE ? "true" : undefined}
            onClick={() => valaszt(sor.kod)}
            onKeyDown={(esemeny) => billentyu(esemeny, index)}
          >
            <span className="km-ir-nav-cim">{sor.cim}</span>
            <span className="km-ir-nav-allapot">{sor.allapot}</span>
          </button>
        );
      })}
    </nav>
  );
}
