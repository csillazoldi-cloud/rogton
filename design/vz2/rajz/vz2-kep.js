// VZ-2 · a kép vázlata (a valódi képet a gép rajzolja a munkatér arculatából)
(function () {
  var CEGEK = {
    tibor: { nev: 'Kövesi Térkő', logo: 'KÖVESI TÉRKŐ', fo: '#2f5d50', foSzoveg: '#ffffff', hatter: '#f1ede4', szoveg: '#1f2421', foto1: '#c9c1b1', foto2: '#bcb3a2', betu: "'Archivo',sans-serif" },
    piroska: { nev: 'Piroska Pékség', logo: 'Piroska Pékség', fo: '#b4532a', foSzoveg: '#fff8ef', hatter: '#fbf1e2', szoveg: '#3a2419', foto1: '#e3c9a4', foto2: '#d8ba90', betu: "'Public Sans',sans-serif" },
    semleges: { nev: 'Kövesi Térkő', logo: 'Kövesi Térkő', fo: '#2b2e36', foSzoveg: '#ffffff', hatter: '#f4f4f2', szoveg: '#1d1f24', foto1: '#d6d6d2', foto2: '#cacac5', betu: "'Public Sans',sans-serif" }
  };
  var HELYZETEK = [
    { id: 'kesz', nev: 'Kész munka', leiras: 'Egy fotó a kész munkáról, vagy előtte–utána.', cimke: 'KÉSZ MUNKA' },
    { id: 'akcio', nev: 'Akció, ajánlat', leiras: 'Mire adsz kedvezményt, mennyit, meddig.', cimke: 'AKCIÓ' },
    { id: 'uj', nev: 'Újdonság', leiras: 'Új termék vagy szolgáltatás, fotóval.', cimke: 'ÚJ' },
    { id: 'hir', nev: 'Fontos hír', leiras: 'Zárva tartás, nyitvatartás, szabad időpontok.', cimke: 'FONTOS' },
    { id: 'tudtad', nev: 'Tudtad?', leiras: 'Egy hasznos tipp a szakmádból.', cimke: 'TUDTAD?' },
    { id: 'esemeny', nev: 'Esemény', leiras: 'Nyílt nap, vásár, bemutató: mi, hol, mikor.', cimke: 'ESEMÉNY' },
    { id: 'szam', nev: 'Egy szám', leiras: 'Egy nagy szám és egy mondat róla.', cimke: '' }
  ];
  var SZOVEG = {
    tibor: {
      kesz: { cim: 'Kész a Fenyő utcai udvar', sor: '180 m² gránit kocka, 6 nap alatt.', ro: 'Curtea de pe str. Bradului e gata.' },
      akcio: { szam: '−15%', cim: 'a szürke kockakőre', sor: 'május 31-ig', ro: 'Reducere la pavajul gri — până pe 31 mai.' },
      uj: { cim: 'Új: fagyálló antik kocka', sor: 'Már raktáron, Ákosfalván.', ro: 'Nou: pavaj antic rezistent la îngheț.' },
      hir: { cim: 'Szabad időpontok júniusra', sor: 'Hívj, és megnézzük az udvarod.', mikor: 'június 2–27.', ro: 'Locuri libere în iunie.' },
      tudtad: { cim: 'Télen ne sózd a térkövet.', sor: 'Homok vagy fűrészpor kíméli a felületet.', ro: 'Iarna nu pune sare pe pavaj.' },
      esemeny: { cim: 'Nyílt nap a telepen', hol: 'Ákosfalva, Fő út 12.', mikor: 'október 12., szombat 9–14', ro: 'Zi porți deschise.' },
      szam: { szam: '120', cim: 'udvart raktunk le 2025-ben.', ro: 'curți pavate în 2025.' }
    },
    piroska: {
      kesz: { cim: 'Megújult a Fő téri boltunk', sor: 'Hétfőtől újra nyitva, várunk!', ro: 'Magazinul din Piața Mare s-a renovat.' },
      akcio: { szam: '−20%', cim: 'minden kenyérre', sor: 'este 6 után', ro: 'La toate pâinile, după ora 18.' },
      uj: { cim: 'Friss kürtőskalács 7-től', sor: 'Minden reggel, amíg a készlet tart.', ro: 'Kürtőskalács proaspăt de la 7.' },
      hir: { cim: 'Hétfőn zárva vagyunk', sor: 'Kedden reggel 6-tól várunk.', mikor: 'szeptember 29., hétfő', ro: 'Luni suntem închiși.' },
      tudtad: { cim: 'A kovászos kenyér 3 napig friss.', sor: 'Vászonzacskóban tárold, ne nejlonban.', ro: 'Pâinea cu maia rămâne proaspătă 3 zile.' },
      esemeny: { cim: 'Kóstoló a Fő téren', hol: 'Szászrégen, Fő tér', mikor: 'október 5., vasárnap 8–12', ro: 'Degustare în Piața Mare.' },
      szam: { szam: '18', cim: 'éve sütünk Szászrégenben.', ro: 'ani de copt în Reghin.' }
    }
  };

  function E(t, p) { var a = [t, p]; for (var i = 2; i < arguments.length; i++) a.push(arguments[i]); return React.createElement.apply(React, a); }
  var ARANY = { poszt: 1.25, story: 16 / 9, negyzet: 1 };

  function foto(c, u, st, cimke) {
    return E('div', { style: Object.assign({ position: 'relative', background: 'repeating-linear-gradient(135deg,' + c.foto1 + ' 0 ' + 9 * u + 'px,' + c.foto2 + ' ' + 9 * u + 'px ' + 18 * u + 'px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }, st) },
      E('span', { style: { fontFamily: "'IBM Plex Mono',monospace", fontSize: Math.max(9, 9 * u) + 'px', color: 'rgba(0,0,0,0.45)', background: 'rgba(255,255,255,0.6)', padding: '1px 5px', borderRadius: '3px' } }, cimke || 'fotó'));
  }
  function logo(c, u, szin) { return E('div', { style: { fontFamily: c.betu, fontWeight: 700, fontSize: 10 * u + 'px', letterSpacing: '0.06em', color: szin || c.szoveg, opacity: 0.85 } }, c.logo); }

  // o: { ceg, szoveg (felülírás), ro, halvany, igazit, eu (előtte–utána) }
  function kep(hid, meret, W, o) {
    o = o || {};
    var c = CEGEK[o.ceg || 'tibor'];
    var t = Object.assign({}, (SZOVEG[o.ceg === 'piroska' ? 'piroska' : 'tibor'] || {})[hid], o.szoveg || {});
    var u = W / 240, H = Math.round(W * ARANY[meret]), mag = meret === 'story', lapos = meret === 'negyzet';
    var pad = 14 * u, fs = function (n) { return n * u + 'px'; };
    var ro = o.ro && t.ro ? E('div', { style: { fontSize: fs(10.5), lineHeight: 1.3, opacity: 0.75 } }, t.ro) : null;
    var kicker = function (txt, szin) { return txt ? E('div', { style: { fontFamily: "'IBM Plex Mono',monospace", fontSize: fs(8.5), letterSpacing: '0.12em', color: szin || c.fo, fontWeight: 500 } }, txt) : null; };
    var h = HELYZETEK.filter(function (x) { return x.id === hid; })[0] || HELYZETEK[0];
    var belso;
    var col = { display: 'flex', flexDirection: 'column', gap: 6 * u + 'px' };

    if (hid === 'kesz') {
      var fotok = o.eu
        ? E('div', { style: { flex: mag ? 1.6 : 1.2, display: 'flex', gap: 2 * u + 'px' } }, foto(c, u, { flex: 1 }, 'előtte'), foto(c, u, { flex: 1 }, 'utána'))
        : foto(c, u, { flex: mag ? 1.8 : lapos ? 1 : 1.3 }, 'fotó');
      belso = [fotok, E('div', { key: 'b', style: Object.assign({ padding: pad + 'px' }, col) }, kicker(h.cimke),
        E('div', { style: { fontSize: fs(lapos ? 17 : 19), fontWeight: 700, lineHeight: 1.1 } }, t.cim),
        t.sor ? E('div', { style: { fontSize: fs(11), lineHeight: 1.3 } }, t.sor) : null, ro, E('div', { style: { marginTop: 4 * u + 'px' } }, logo(c, u)))];
    } else if (hid === 'akcio') {
      belso = [E('div', { key: 'a', style: Object.assign({ flex: 1, padding: pad + 'px', justifyContent: 'center' }, col) }, kicker(h.cimke),
        E('div', { style: { alignSelf: 'flex-start', background: c.fo, color: c.foSzoveg, fontSize: fs(mag ? 54 : 44), fontWeight: 800, lineHeight: 1, padding: 6 * u + 'px ' + 10 * u + 'px', borderRadius: 4 * u + 'px' } }, t.szam),
        E('div', { style: { fontSize: fs(19), fontWeight: 700, lineHeight: 1.1 } }, t.cim),
        E('div', { style: { fontSize: fs(12), fontWeight: 600, color: c.fo } }, t.sor), ro),
        lapos ? null : foto(c, u, { height: (mag ? 38 : 26) + '%' }, 'fotó · nem kötelező'),
        E('div', { key: 'l', style: { padding: 10 * u + 'px ' + pad + 'px' } }, logo(c, u))];
    } else if (hid === 'uj') {
      belso = [foto(c, u, { position: 'absolute', inset: 0 }, 'fotó'),
        E('div', { key: 'g', style: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', background: 'linear-gradient(transparent, rgba(0,0,0,0.72))' } }),
        E('div', { key: 't', style: Object.assign({ position: 'absolute', left: pad + 'px', right: pad + 'px', bottom: pad + 'px', color: '#fff' }, col) },
          E('span', { style: { alignSelf: 'flex-start', background: c.fo, color: c.foSzoveg, fontSize: fs(9), fontWeight: 700, letterSpacing: '0.1em', padding: 2 * u + 'px ' + 6 * u + 'px', borderRadius: 3 * u + 'px' } }, 'ÚJ'),
          E('div', { style: { fontSize: fs(20), fontWeight: 700, lineHeight: 1.1 } }, t.cim),
          E('div', { style: { fontSize: fs(11) } }, t.sor), o.ro ? E('div', { style: { fontSize: fs(10.5), opacity: 0.8 } }, t.ro) : null, logo(c, u, '#fff'))];
    } else if (hid === 'hir') {
      belso = [E('div', { key: 'h', style: Object.assign({ flex: 1, background: c.fo, color: c.foSzoveg, padding: pad * 1.2 + 'px', justifyContent: 'center' }, col) },
        kicker(h.cimke, c.foSzoveg),
        E('div', { style: { fontSize: fs(t.cimMeret || (mag ? 30 : 26)), fontWeight: 800, lineHeight: 1.05 } }, t.cim),
        t.mikor ? E('div', { style: { fontSize: fs(12), fontWeight: 600, opacity: 0.9 } }, t.mikor) : null,
        t.sor ? E('div', { style: { fontSize: fs(11), lineHeight: 1.3, opacity: 0.9 } }, t.sor) : null,
        o.ro && t.ro ? E('div', { style: { fontSize: fs(11), opacity: 0.75, borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: 5 * u + 'px' } }, t.ro) : null),
        E('div', { key: 'l', style: { padding: 10 * u + 'px ' + pad + 'px', background: c.fo } }, logo(c, u, c.foSzoveg))];
    } else if (hid === 'tudtad') {
      belso = [E('div', { key: 't', style: Object.assign({ flex: 1, padding: pad * 1.2 + 'px', justifyContent: 'center' }, col) },
        E('div', { style: { fontSize: fs(15), fontWeight: 700, color: c.fo } }, 'Tudtad?'),
        E('div', { style: { fontSize: fs(mag ? 24 : 21), fontWeight: 700, lineHeight: 1.12 } }, t.cim),
        E('div', { style: { height: 2 * u + 'px', width: 30 * u + 'px', background: c.fo } }),
        E('div', { style: { fontSize: fs(11.5), lineHeight: 1.35 } }, t.sor), ro),
        E('div', { key: 'l', style: { padding: 10 * u + 'px ' + pad + 'px' } }, logo(c, u))];
    } else if (hid === 'esemeny') {
      var sor = function (k, v) { return E('div', { style: { display: 'flex', flexDirection: 'column', gap: 1 } }, E('span', { style: { fontSize: fs(8.5), letterSpacing: '0.1em', color: c.fo, fontWeight: 600 } }, k), E('span', { style: { fontSize: fs(12), fontWeight: 600 } }, v)); };
      belso = [lapos ? null : foto(c, u, { height: (mag ? 40 : 30) + '%' }, 'fotó · nem kötelező'),
        E('div', { key: 'e', style: Object.assign({ flex: 1, padding: pad + 'px', justifyContent: 'center' }, col) }, kicker(h.cimke),
          E('div', { style: { fontSize: fs(20), fontWeight: 700, lineHeight: 1.1 } }, t.cim), sor('HOL', t.hol), sor('MIKOR', t.mikor), ro),
        E('div', { key: 'l', style: { padding: 10 * u + 'px ' + pad + 'px' } }, logo(c, u))];
    } else {
      belso = [E('div', { key: 's', style: Object.assign({ flex: 1, padding: pad * 1.2 + 'px', justifyContent: 'center' }, col) },
        E('div', { style: { fontSize: fs(mag ? 96 : 80), fontWeight: 800, lineHeight: 0.95, color: c.fo } }, t.szam),
        E('div', { style: { fontSize: fs(17), fontWeight: 700, lineHeight: 1.15 } }, t.cim), ro),
        E('div', { key: 'l', style: { padding: 10 * u + 'px ' + pad + 'px' } }, logo(c, u))];
    }

    var reteg = [];
    if (o.igazit) reteg.push(E('div', { key: 'ig', style: { position: 'absolute', inset: 4 * u + 'px', border: '2px dashed rgba(255,255,255,0.9)', borderRadius: 3 * u + 'px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 30 * u + 'px', pointerEvents: 'none' } },
      E('span', { style: { background: 'rgba(0,0,0,0.6)', color: '#fff', fontFamily: "'Public Sans',sans-serif", fontSize: Math.max(11, 10 * u) + 'px', padding: '3px 8px', borderRadius: '4px' } }, '✥ húzd el')));
    return E('div', { style: { position: 'relative', width: W + 'px', height: H + 'px', flex: 'none', overflow: 'hidden', borderRadius: 6 * u + 'px', background: c.hatter, color: c.szoveg, fontFamily: c.betu, display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' } },
      E('div', { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', opacity: o.halvany ? 0.4 : 1 } }, belso), reteg);
  }

  window.VZ2 = { CEGEK: CEGEK, HELYZETEK: HELYZETEK, SZOVEG: SZOVEG, kep: kep };
})();
