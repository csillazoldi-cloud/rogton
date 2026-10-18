# E-24 — a román és angol feliratok lektorálása
## Javítások
| kulcs | nyelv | most | javasolt | miért |
|---|---|---|---|---|
| stNever | ro | Nicio monitorizare rulată încă | Încă nu a rulat nicio monitorizare | "Nicio...încă" zavaros, a "rulată" melléknévként furcsán hat; természetesebb: "Încă nu a rulat nicio monitorizare" |
| stNextRun | ro | Următoarea rulare: {t} (Europa/București) | Următoarea rulare: {t} (Europa/Budapesta) | A magyar eredeti Budapestet ír, a románnak is összhangban kell lennie a forrással (a rendszer időzónája Budapest) |
| stAiPend | ro | Cădere AI | Eșec AI | "Cădere" (zuhanás) szó szerinti tükörfordítás; "eșec" a szakmai román |
| stAiPend | en | AI outage | AI failure | "Outage" áramszünet/szolgáltatáskiesés; itt az értékelés nem fut le, nem a rendszer esik ki — "failure" pontosabb |
| ovFirstBody | ro | AI a pregătit | AI-ul a pregătit | Hiányzik a határozott névelő, "AI" önállóan nem hat természetesen románul |
| ovFirstCta | ro | Configurare monitorizare → | Setare monitorizare → | A "Configurare" túl hosszú gombfeliratnak; a szakmai szóhasználat egységesítése: "setare" = beállítás (lásd pSetup) |
| partialBody | ro | Rezultatele celorlalte surse sunt complete | Rezultatele celorlalte surse sunt complete | "celorlalte" helyesírás: "celorlalte" → "celorlalte" (ellenőrizve: helyes, de "celelalte" a standard) — mégis: "Rezultatele de la celelalte surse sunt complete" természetesebb |
| partialBody | ro | pe pagina Configurare | pe pagina Setări | "Configurare" nem létezik oldalcím; a pSetup = "Configurare", de a felületen "Figyelés beállítása" → "Setări" vagy maradjon "Configurare" ha az oldalcím. Inkább: "pagina de configurare" (kisbetűvel, általánosan) |
| fNew | ro | Noi | Nou | Gombfelirat, egyes számú találatra vonatkozik (szemben a "Mind"/"Toate"-tel); "Nou" konzisztensebb az "Új"-val |
| impLow | ro | Context | Fundal | A magyar "Háttér" itt fontossági szint (nem információs háttér); "Fundal" vagy "Háttérjellegű" — de gombfeliratnak "Fundal" |
| detIdeaBtn | ro | Cere idee de conținut | Idee de conținut | Gombfelirat, rövidítés kell; a magyar is csak "Kérek tartalomötletet" → cselekvés, de a román imperatívus túl direkt. Maradhat "Cere idee", de inkább: "Idee de conținut" (címke) vagy "Generează idee" — átírva: "Generează idee" |
| srcGroupPress | ro | Surse profesionale și de știri | Surse profesionale și de presă | A "știri" (hírek) vs "presă" (sajtó) egységesítése: a modTitle "Monitorizare presă", tehát a forrás is "presă" legyen |
| srcAddPh | ro | Adresă RSS sau site… | Adresă RSS sau site web… | "Site" önmagában szleng; "site web" vagy "adresă de site" formálisabb |
| srcErr | ro | defect | eroare / indisponibil | "Defect" fizikai hibát jelent (törött); webforrásnál "eroare" vagy "indisponibil" |
| srcLimitedDetail | ro | doar titlurile pot fi citite, textul complet nu | doar titlurile pot fi extrase, textul complet nu | "citite" (olvasni) helyett "extrase" (kinyerni) — a rendszer nem olvas, hanem kinyer |
| honestyNote | ro | Conectarea unui serviciu de căutare | Integrarea unui serviciu de căutare | "Conectarea" fizikai kapcsolat; szoftvernél "integrarea" szakszerűbb |
| schTz | ro | Fus orar: Europa/București | Fus orar: Europa/Budapesta | Lásd stNextRun — a forrás Budapest, konzisztencia |
| trialRunningBtn | ro | Proba rulează… | Proba rulează… | "Proba" (főnév) + "rulează" (ige) helyes, de "Rulare probă…" vagy "Se execută proba…" — maradhat, de "Proba în desfășurare…" természetesebb gombfelirat |
| saveFailBody | ro | Toate setările există | Toate setările tale sunt intacte | A magyar "Minden beállításod megvan" — a román "există" túl száraz; "sunt intacte" vagy "sunt păstrate" |
| tuEmpty | ro | Nu există încă feedback de dat | Încă nu există feedback de oferit | "Feedback de dat" nem természetes; "de oferit" vagy "de dat" → inkább "Nu ai feedback de oferit încă" (tegezés!) |
| tuTrialNote | ro | Marcajul tău | Marcajele tale | "Marcajul" egyes szám, de a felhasználó több találatot is jelölhet; többes szám pontosabb |
| cmpCaveat | ro | Dintr-un singur eșantion nu afirmăm o îmbunătățire generală | Dintr-un singur eșantion nu putem afirma o îmbunătățire generală | "Nu afirmăm" passzív-tudományos; "nu putem afirma" közvetlenebb, a magyar "nem állítunk"-nak megfelel |
| verMadeWith | ro | cu configurația v{v} | cu setarea v{v} | "Configurația" hosszú, a "setare" egységesebb a pSetup "Configurare" → "setare" vonalával (vagy maradjon "configurație" ha az elterjedt) — inkább: "cu setările v{v}" |
| profileTouch | ro | Aceasta ar afecta profilul comun | Aceasta ar afecta profilul comun | "Aceasta" (ez) távolságtartó; "Acest lucru" természetesebb, de elfogadható. Inkább: "Această modificare ar afecta profilul comun" |
| on | ro | ON | PORNIT | A magyar "BE" / "KI" — a román "ON"/"OFF" angol maradt; "PORNIT"/"OPRIT" vagy "ACTIV"/"INACTIV" |
| off | ro | OFF | OPRIT | Lásd fent — egységesítés a magyarral |
| pSetup | en | Monitoring setup | Monitor setup | "Monitoring" folyamat; a magyar "Figyelés beállítása" = a figyelő beállítása; "Monitor setup" rövidebb, szintén szakmai |
| stRunning | en | Monitoring runs in the background | Monitoring is running in the background | "Runs" egyszerű jelen; a folyamatban lévőség: "is running" |
| stOk | en | Monitoring completed successfully | The monitoring run completed successfully | "Monitoring" önmagában főnév; "the monitoring run" egyértelműsíti a futást |
| ovFirstBody | en | The AI prepared a monitoring proposal from your shared profile | The AI has prepared a monitoring proposal based on your shared profile | "From" helyett "based on" pontosabb; present perfect a cselekvés befejezettségére |
| ovSummaryBadge | en | AI summary · cites sources | AI summary · with source citations | "Cites sources" ige + tárgy; címkeként "with source citations" természetesebb |
| ovNoNewBody | en | Monitoring ran fine | The monitoring run completed normally | "Ran fine" túl kötetlen; "completed normally" szakmai |
| partialBody | en | Results from the other sources are complete | Results from the remaining sources are complete | "The other sources" = a másik források; "remaining sources" = a megmaradt/hátralévő — pontosabb |
| freeBtn | en | Update setup from this | Update settings from this text | "Setup" főnévként zavaros; "settings" egyértelmű; "from this" kiegészítve "from this text" |
| srcAiWarn | en | does not count as a verified source until actually checked | does not count as a verified source until checked | "Actually" felesleges; "until checked" elegendő |
| schTz | en | Time zone: Europe/Budapest | Time zone: Europe/Budapest | Megjegyzés: a román București-re javítandó Budapestre, az angol marad Budapest — konzisztens a forrással |
| trialNote | en | The trial works on a limited sample | The trial runs on a limited sample | "Works on" = ezen dolgozik; "runs on" = ezen fut — pontosabb |
| tuIntro | en | Mark on real hits what matters and what does not | Mark real hits as what matters and what doesn't | "On" felesleges; "mark real hits as..." struktúra tisztább |
| tuEmpty | en | Nothing to give feedback on yet | No feedback to give yet | Tömörebb, természetesebb |
| cmpCaveat | en | One sample does not prove a general quality gain | A single sample does not prove general quality improvement | "One sample" → "a single sample" hangsúlyosabb; "general quality gain" → "general quality improvement" szakszerűbb |
| verHitNote | en | each shows which variant produced it | each shows which configuration variant produced it | "Variant" önmagában zavaros; "configuration variant" egyértelmű (a v{v}-re utalva) |
| profileTouch | en | This would affect the shared client profile (audience) | This would affect the shared client profile | "(Audience)" zavaró betoldás; a magyar nem teszi zárójelbe, az angol se tegye, vagy magyarázó mondatban |
| detIdeaBtn | en | Request content idea | Get content idea | "Request" hivatalos; gombfeliratnak "Get" rövidebb, közvetlenebb |
| srcLastOk | en | last successful processing: {t} | last successful fetch: {t} | "Processing" túl általános; a forrás "feldolgozása" itt konkrétan "fetch" = lekérés |
| srcLimited | en | limited | restricted | "Limited" korlátozott képességű; "restricted" korlátozott hozzáférésű — a forrás nem teljesen érhető el, "restricted" pontosabb |
| srcErrDetail | en | the page does not respond (timeout) | page unresponsive (timeout) | "The page does not respond" → "page unresponsive" szakszerűbb, rövidebb |
| stPartialShort | en | {n} sources cannot be processed | {n} sources unavailable | "Cannot be processed" passzív; "unavailable" aktív, rövidebb gombfeliratnak |
| suDraft | en | Draft — the running monitor only changes on save | Draft — active monitoring updates only on save | "The running monitor" bőbeszédű; "active monitoring updates" tisztább |
| suClarify | en | One question: should we also watch mentions of your own name, or only the organisation? (optional) | One question: should we monitor mentions of your own name, or only the organisation? (optional) | "Watch" figyel; "monitor" szakterminus, egységesítve a többi "monitor" használattal |
| honestyNote | en | Connecting a search service is a future extension | Search service integration is planned for a future release | "Connecting...future extension" bőbeszédű; "integration is planned" szakszerűbb |
| fbThanks | en | Recorded — it feeds the proposal below | Recorded — included in the proposal below | "Feeds" táplál; "included in" egyértelműbb |
| suActive | en | Active configuration (v{v}) | Active settings (v{v}) | "Configuration" hosszú; "settings" egységes a "pSetup = Monitoring setup" vonalán |
| sugTry | en | Try it | Try out | "Try it" tárgyas; "Try out" kipróbál — a magyar "Kipróbálom" visszaadása |
| sugAccept | en | Accept | Apply | "Accept" elfogad; de a javaslatot alkalmazni kell; "Apply" pontosabb (szoftveres kontextus) |
| sugReject | en | Reject | Dismiss | "Reject" elutasít; "Dismiss" elvet (kevésbé drasztikus, szoftveres szokás) |
| cmpKept | en | ranked higher | moved up | "Ranked higher" rangsorolva; a kontextusban "moved up" egyszerűbb |
| cmpDown | en | ranked lower | moved down | "Ranked lower" → "moved down" egységesítés a fentivel |
| detIdeaWorking | en | Preparing content idea… | Generating content idea… | "Preparing" előkészít; "Generating" generál — az AI generál, nem készít elő |
| stNew | en | {n} new hits | {n} new result(s) | "Hits" szleng/szakzsargon; "result(s)" vagy "findings" — de "hits" elfogadható maradhat; mégis: "{n} new items" semleges |

## Megjegyzések
- A tegezés/magázás egységes: románul "tu" forma (tegezés), angolul semleges "you" nélküli konstrukciók vagy "your" birtokos.
- "Presă" vs "știri": a modul neve "Monitorizare presă", ezért a források is "surse de presă" legyenek, nem "surse de știri".
- A helyőrzők minden javított szövegben megmaradtak, nem lettek lefordítva.
- A román időzóna-kijelzés (București → Budapesta) kritikus javítás, mert a rendszer valóban Budapest időzónáját használja.
- A gombfeliratok rövidítése prioritás: "Generează idee", "Get content idea", "Apply", "Dismiss".
- A "configurare" vs "setare" szóhasználat nem teljesen egységes a forrásban sem; a javaslatok a rövidebb, gombbarát formákat részesítik előnyben.
