# @rogton/visszajelzes-react

Újrafelhasználható Visszajelzés modul (R-9): lebegő gomb → jelölő mód → buborék → küldés.
Nem tud a befogadó adatbázisáról, végpontjairól, feliratairól — mindent a befogadó ad át.

## Használat

```tsx
import { VisszajelzesModul, type VisszajelzesAdat } from "@rogton/visszajelzes-react";
import "@rogton/visszajelzes-react/stilus.css";

<VisszajelzesModul
  kuldes={async (adat: VisszajelzesAdat) => { /* POST, 201 → true */ return true; }}
  feliratok={f}   // vj.* kulcsokból összeállítva
  nyelv="hu"
  kepMaxSzelesseg={480}
/>
```

## Várt CSS-változók (a befogadó adja)

`--ter-0…14`, `--fs-xs/sm/md/base/title`, `--fw-strong`, `--fw-head`, `--lh`,
`--font-body-active`, `--font-display-active`, `--text`, `--text-mut`, `--text-dim`,
`--bg`, `--bg-elev`, `--line`, `--border-2`, `--r-btn`, `--r-card`, `--r-badge`, `--bw`,
`--shadow-pop`, `--accent-warm`, `--glow-warm`, `--grad-primary`, `--glow-primary`,
`--on-primary`, `--ok`, `--ok-bg`, `--control-min`, `--control-min-s`, `--dur-fast`,
`--dur-med`, `--fatyol-kozep`.
