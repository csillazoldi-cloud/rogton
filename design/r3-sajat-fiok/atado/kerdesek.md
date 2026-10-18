# Kérdések — R-3 · Saját fiók

## 1. A „kiléptetés mindenhol" és a jelszóváltás ugyanazt a választ adja — egy vagy két mondat?

A `POST /api/fiok/kileptetes-mindenhol` és a `PUT /api/fiok/jelszo` is megmondja, hány munkamenet szűnt meg. A rajz **két külön mondatot** használ (`sajat.jelszo_kesz_szoveg` és `sajat.kileptetes_kesz`), mert a kontextus más: az egyiknél a jelszó is megváltozott.

Ha egy mondatot akarunk mindkettőre, az rövidebb szótár, de a jelszóváltás sikere nem derül ki belőle. A rajz a kétmondatos utat választotta — ha másképp döntesz, egy kulcs kiesik.

## 2. Mit mutat a lap, ha a fiók egyetlen munkatérnek sem tagja

Elvileg előfordulhat: valaki kilép az egyetlen munkateréből, ahol nem volt utolsó tulajdonos. Ilyenkor a Munkatereim lista **üres**, és a sáv munkatér-váltója sem tud mit mutatni.

Nem rajzoltam meg, mert nem tudom, a gépezet engedi-e egyáltalán ezt az állapotot (a `POST /api/tagok/kilep` csak az utolsó tulajdonost tiltja, az utolsó tagságot nem). Ha előfordulhat, kell egy hatodik artboard: üres lista + egy mondat arról, mit tehet (meghívót kérni, vagy új munkateret létrehozni — ha ez utóbbi lehetséges).

## 3. Mi történik a kilépés után, ha az aktuális munkatérből lép ki

A `POST /api/tagok/kilep` az **aktuális** munkatérre vonatkozik. A rajzon a **másik** munkatérből („Demo ügyfél Kft.") lép ki a felhasználó — ez a tiszta eset, mert utána ott marad, ahol volt.

Amit nem tudok: ha az aktuális munkatérből lép ki, hova kerül? A másik munkaterébe automatikusan, vagy egy választó képernyőre? Ez a D-F25 (a munkatér-váltás a fiókon tárolt választás) folytatása, de a kilépés esetét a döntés nem említi.

## 4. Az „utolsó belépésem" pontossága

A rajz időpontot mutat (2026-09-12 08:41). Amit nem tudok: ez a **mostani** munkamenet kezdete, vagy az **azt megelőző** belépés? A kettő más jelentés: az első önmagát mutatja, a második használható arra, hogy a felhasználó észrevegye az idegen belépést.

Ha az elsőt tárolja a gépezet, a mondatot át kell írni („Mostani belépésem"), mert különben félrevezet.

## 5. Amit a feladatlap kért, de a gépezet nem tud

Nincs ilyen tétel. A feladatlap hét blokkja mindegyikéhez van végpont, és mind a rajzon van.


## v2 · 2026-09-13 — egy ellentmondás a leírás és a mai gépezet között

**„Kiléptetés minden eszközről" — ezen a gépen is?** A 2026-09-13-i leírás azt írja: utána *mindenhol* újra be kell lépni, ezen a gépen is. A mai végpont viszont a **többi** munkamenetet szünteti meg, és a választ is így fogalmazza („Ezen az eszközön belépve maradtál"). A rajz a mai gépezetet mutatja, mert a rajz azt mutassa, ami van. **Ha az a döntés, hogy ez az eszköz is lépjen ki**, az végpont-változás, és a rajzon a gomb szövege, a megerősítés és a siker-mondat is cserélődik — szólj, és egy körben átírom.
