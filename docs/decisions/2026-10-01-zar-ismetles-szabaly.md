# Zár-ismétlés szabály: a ROMLOTT piros csak többséggel számít (2026-10-01, Csilla)

## A baj (mérve)
A Sonnet bíráló a 4–6 pontos sávban futásonként ±1–2 pontot ingadozik. Mérve 10-01:
ugyanaz a képernyőkép 16 futásból 1-szer piros (06b rajz); a 22:07-es teljes kapufutásban
három, a kirakás által NEM érintett lapnézet (arculat-mas-szin/asztali, arculat-nevlogo/asztali,
posztszoveg/telefon) pixelre azonos képpel fordult sárgából pirosba, mindhárom pont 4-gyel,
miközben a telefonos/asztali párja 5–6 pontos sárga maradt. ~25 lapnézet áll az 5–6 pontos
sávban, így minden teljes futás kockajáték a nem érintett lapokon — a zár emiatt zárt olyan
kirakáson is, amely minden célzott lapot javított (próba 22→28, regresszió nélkül).

## A szabály (kibővítve 2026-10-02, Csilla: „ez már nevetséges” — a kapu kockajátéka megszűnik)
MINDEN lapnézet-piros, ami a zárat zárná (új R-15-ös lapé és ROMLOTT egyaránt), csak akkor
számít, ha 3 bírálatból legalább 2 piros ugyanazon a képernyőképen. A többséget a
`tools/tibor-biro/ismetlo.py` állítja elő; minden futás eltéve az elem `ismetlesek` mezőjében.
A teljes kapufutást a `tools/tibor-proba/kapu.py` fogja össze: próba → bíráló → a zárat záró
pirosok automatikus 3-futásos ismétlése → zár. A mérce nem csökken: a determinisztikus piros
(2/3 vagy 3/3) ugyanúgy zár, mint eddig — 10-02 hajnalban pontosan így bukott le a kezdőlap
03c2 valódi hibája (3/3 piros), miközben a hirek/telefon (1/3) zajnak bizonyult.

Az eredeti, szűkebb változat (csak nem érintett ROMLOTT nézetek, kézzel megnevezve) 10-01-én
egy estét élt: a 22:07-es és az 05:54-es futás más-más, nem érintett vagy már átment lapokat
fordított pirosba — lapnézetenként ±1–2 pont ingadozással a 42 nézet együtt sosem áll meg.

## Miért így
- A racsni célja a valódi romlás megfogása, nem a bíráló zajának begyűjtése.
- A többségi szavazat a meglévő bírálót használja, új küszöböt nem vezet be (a pont ≤ 4 piros
  határ változatlan); 2 extra bírálat nézetenként centekbe kerül.
- Az alternatíva (ROMLOTT-nál pont ≤ 3 a határ) tompította volna a valódi romlás-jelzést is.

Vilmos utólagos jóváhagyása kérve (a 2026-10-01-biralo-piros-szabaly.md mintájára).
