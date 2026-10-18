"use client";

import "./kapcsolo.css";

export function Kapcsolo({
  be,
  valt,
  letiltva,
  cimke,
}: {
  be: boolean;
  valt?: ((be: boolean) => void) | undefined;
  letiltva?: boolean | undefined;
  cimke: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={be}
      aria-label={cimke}
      disabled={letiltva}
      className="km-kapcsolo"
      data-be={be}
      data-letiltva={letiltva ?? false}
      onClick={() => {
        if (!letiltva && valt) {
          valt(!be);
        }
      }}
    >
      <span className="km-kapcsolo-csuszka" aria-hidden="true" />
    </button>
  );
}
