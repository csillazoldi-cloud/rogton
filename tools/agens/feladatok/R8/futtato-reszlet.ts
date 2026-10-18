    console.error("[hirfigyelo-futtato] beragadtakElenged hiba:", h);
  }

  // E-34: takarítás óránként egyszer (az óra első percének első tickjén) — lejárt munkamenetek,
  // felhasznált visszaállító jegyek, régi belépési kísérletek.
  if (most.getMinutes() === 0 && most.getSeconds() < 5 && most.getHours() !== utolsoTakaritottOra) {
    utolsoTakaritottOra = most.getHours();
    try {
      const t = await oraiTakaritas(most);
      if (t.munkamenet + t.jegy + t.naplo + t.esemeny > 0) {
        console.log(`[hirfigyelo-futtato] takaritas: ${t.munkamenet} munkamenet, ${t.jegy} jegy, ${t.naplo} naplosor, ${t.esemeny} esemeny (30 nap, T-24)`);
      }
    } catch (h) {
      console.error("[hirfigyelo-futtato] takaritas hiba:", h);
    }
  }

  // Napi ütemezés percenként egyszer (a perc első tickjén)
  if (most.getSeconds() < 5) {
