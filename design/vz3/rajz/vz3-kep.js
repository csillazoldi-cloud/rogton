// VZ-3 · színváltozatok a cég arculatából — a gép szabálya vázlatban
(function () {
  function hx(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; }); }
  function lin(c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function L(h) { var x = hx(h).map(lin); return 0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2]; }
  function cr(a, b) { var x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function sotetit(h, k) { return '#' + hx(h).map(function (c) { return Math.round(c * k * 255).toString(16).padStart(2, '0'); }).join(''); }
  function crMin(a, veg) { return Math.min.apply(null, veg.map(function (b) { return cr(a, b); })); }
  function legjobb(alap, sotet) { var v = Array.isArray(alap) ? alap : [alap]; return crMin('#ffffff', v) >= crMin(sotet, v) ? '#ffffff' : sotet; }
  function atmenet(a, b) { return 'linear-gradient(160deg,' + a + ' 0%,' + b + ' 100%)'; }

  var MARKAK = {
    kovesi: { nev: 'Kövesi Térkő', logo: 'KÖVESI TÉRKŐ', fo: '#2f5d50', masodik: '#c9a86a', hatter: '#f1ede4', szoveg: '#1f2421', foto1: '#c9c1b1', foto2: '#bcb3a2', betu: "'Archivo',sans-serif" },
    ait: { nev: 'aitmetica', logo: 'aitmetica', fo: '#2f5d4e', masodik: '#d9a441', hatter: '#f5f1e8', szoveg: '#1e2622', foto1: '#cfd6cf', foto2: '#c2cbc3', betu: "'Public Sans',sans-serif" },
    semleges: { nev: 'Kövesi Térkő', logo: 'Kövesi Térkő', fo: '#2b2e36', masodik: null, hatter: '#f4f4f2', szoveg: '#1d1f24', foto1: '#d6d6d2', foto2: '#cacac5', betu: "'Public Sans',sans-serif" }
  };
  var AIT = {
    kesz: { cim: 'Elindult a Marosi Pékség hírfigyelője', sor: 'Napi 12 helyi hír, magyarul és románul.' },
    akcio: { szam: '−20%', cim: 'az első három hónapra', sor: 'október 31-ig' },
    uj: { cim: 'Új: képek egy koppintással', sor: 'A céged színeiben, a saját fotóddal.' },
    hir: { cim: 'Hétfőn frissítjük a rendszert', mikor: 'szeptember 29., 6–8 óra', sor: 'Utána minden a régi helyén lesz.' },
    tudtad: { cim: 'A jó poszt egy dolgot mond.', sor: 'Egy kép, egy mondat, egy kérés — ennyi elég.' },
    esemeny: { cim: 'Bemutató kisvállalkozóknak', hol: 'Marosvásárhely, Kultúrpalota', mikor: 'október 9., 17 óra' },
    szam: { szam: '5', cim: 'perc alatt kész egy kép.' }
  };
  var VALT = ['vilagos', 'szines', 'sotet', 'masodik', 'atmenet'];
  var NEV = { vilagos: 'Világos', szines: 'Színes', sotet: 'Sötét', masodik: 'Másik szín', atmenet: 'Átmenet' };
  // amit a kiemelő szín hordoz az adott képen
  var ELEMEK = {
    kesz: ['cimke'], akcio: ['cimke', 'doboz', 'kisSzoveg'], uj: ['cimke'], hir: ['panel', 'cimke'],
    tudtad: ['nagySzoveg', 'csik'], esemeny: ['cimke', 'kisSzoveg'], szam: ['nagySzoveg']
  };

  // minden változat: háttér (szín vagy átmenet) + a háttér végpontjai (ezeken mérünk)
  function egy(h, sz, k, p) { return { hatter: h, veg: [h], szoveg: sz, kiem: k, panel: p, panelVeg: [p] }; }
  function paletta(m, v) {
    if (v === 'vilagos') return egy(m.hatter, m.szoveg, m.fo, m.fo);
    if (v === 'szines') return egy(m.fo, legjobb(m.fo, m.szoveg), m.masodik, m.fo);
    if (v === 'sotet') { var d = sotetit(m.fo, 0.55); return egy(d, '#ffffff', m.masodik, d); }
    if (v === 'masodik') return egy(m.hatter, m.szoveg, m.masodik, m.masodik);
    // Átmenet: a fő színből a második színbe; ha azon a szöveg nem olvasható, a fő színből a sötétített fő színbe
    var parok = [[m.fo, m.masodik], [m.fo, sotetit(m.fo, 0.55)]];
    for (var i = 0; i < parok.length; i++) {
      var sz = legjobb(parok[i], m.szoveg);
      if (crMin(sz, parok[i]) >= 4.5 || i === parok.length - 1) {
        var g = atmenet(parok[i][0], parok[i][1]);
        return { hatter: g, veg: parok[i], szoveg: sz, kiem: i === 0 ? m.fo : m.masodik, panel: g, panelVeg: parok[i], par: i === 0 ? 'fő → második' : 'fő → sötétített fő' };
      }
    }
  }
  function f(n) { return n.toFixed(1).replace('.', ','); }

  function vizsgal(hid, mid, v) {
    var m = MARKAK[mid], hibak = [];
    if (v !== 'vilagos' && !m.masodik) return { ok: false, hibak: ['nincs második szín'] };
    var p = paletta(m, v);
    if (hid !== 'uj' && hid !== 'hir' && crMin(p.szoveg, p.veg) < 4.5) hibak.push('szöveg a háttéren ' + f(crMin(p.szoveg, p.veg)) + ' < 4,5');
    ELEMEK[hid].forEach(function (e) {
      var r;
      if (e === 'cimke' || e === 'doboz') { r = cr(legjobb(p.kiem, m.szoveg), p.kiem); if (r < 4.5) hibak.push('szöveg a kiemelő dobozon ' + f(r) + ' < 4,5'); }
      if (e === 'kisSzoveg') { r = crMin(p.kiem, p.veg); if (r < 4.5) hibak.push('kis kiemelt szöveg ' + f(r) + ' < 4,5'); }
      if (e === 'nagySzoveg') { r = crMin(p.kiem, p.veg); if (r < 3) hibak.push('nagy kiemelt szöveg ' + f(r) + ' < 3'); }
      if (e === 'csik') { r = crMin(p.kiem, p.veg); if (r < 3) hibak.push('kiemelő vonal ' + f(r) + ' < 3'); }
      if (e === 'panel') { r = crMin(legjobb(p.panelVeg, m.szoveg), p.panelVeg); if (r < 4.5) hibak.push('szöveg a hír hátterén ' + f(r) + ' < 4,5'); }
    });
    return { ok: !hibak.length, hibak: hibak };
  }
  function alairas(hid, mid, v) {
    var p = paletta(MARKAK[mid], v);
    if (hid === 'uj') return p.kiem;              // a fotó eltakarja a hátteret
    if (hid === 'hir') return p.panel + '|' + p.kiem;
    return [p.hatter, p.szoveg, p.kiem].join('|');
  }
  // a gép döntése: melyik változat marad, és miért esett ki a többi
  function dontes(hid, mid) {
    var latott = {};
    return VALT.map(function (v) {
      var t = vizsgal(hid, mid, v);
      if (!t.ok) return { id: v, nev: NEV[v], marad: false, ok: t.hibak.join(' · ') };
      var s = alairas(hid, mid, v);
      if (latott[s]) return { id: v, nev: NEV[v], marad: false, ok: 'ugyanúgy néz ki, mint a(z) ' + NEV[latott[s]] };
      latott[s] = v;
      return { id: v, nev: NEV[v], marad: true, ok: '' };
    });
  }
  function valtozatok(hid, mid) { return dontes(hid, mid).filter(function (d) { return d.marad; }).map(function (d) { return d.id; }); }

  function kep(hid, meret, W, mid, v, o) {
    o = o || {};
    var m = MARKAK[mid], p = paletta(m, v), key = '__vz3_' + mid + '_' + v;
    window.VZ2.CEGEK[key] = {
      nev: m.nev, logo: m.logo, fo: p.kiem, foSzoveg: legjobb(p.kiem, m.szoveg), hatter: p.hatter, szoveg: p.szoveg,
      foto1: m.foto1, foto2: m.foto2, betu: m.betu, hirHatter: p.panel, hirSzoveg: legjobb(p.panelVeg, m.szoveg)
    };
    var sz = Object.assign({}, mid === 'ait' ? AIT[hid] : null, o.szoveg || {});
    return window.VZ2.kep(hid, meret, W, Object.assign({}, o, { ceg: key, pill: true, szoveg: sz }));
  }

  window.VZ3 = { MARKAK: MARKAK, VALT: VALT, NEV: NEV, paletta: paletta, vizsgal: vizsgal, dontes: dontes, valtozatok: valtozatok, kep: kep };
})();
