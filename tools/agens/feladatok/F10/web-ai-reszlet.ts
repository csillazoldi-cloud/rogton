        break;
      }
      case "hf_relevancia": {
        const b = bemenet as { profil: unknown; beallitas: unknown; kivonat: { cim: string; szoveg: string; csonkolt: boolean; url: string; megjelenes: string | null } };
        const temak = (b.beallitas as { temak?: { nev: string; nevvaltozatok?: string[] }[] })?.temak ?? [];
        const temakSzoveg = temak.flatMap((t) => [t.nev, ...(t.nevvaltozatok ?? [])]).join(", ");
        szoveg = `<<ADAT profil>>\n${JSON.stringify(b.profil)}\n<<ADAT VÉGE>>\n\n<<ADAT beallitas>>\n${JSON.stringify(b.beallitas)}\n<<ADAT VÉGE>>\n\n<<TÉMÁK>>\n${temakSzoveg}\n<<TÉMÁK VÉGE>>\n\nCikk címe: ${b.kivonat.cim}\n${promptAdatBlokk("cikk", b.kivonat.szoveg, b.kivonat.csonkolt)}`;
        rendszerFajl = "hf_relevancia";
        maxKiToken = 1000; // E-23 óta összefoglaló is van a válaszban; 300-nál a Dellen 9/49 válasz üres/csonka volt (mérve 2026-09-08); F9-AI1 MÉRVE 2026-09-15 gpt-5-mini: 700-nál 12-ből 1 válasz csonka (szebben tördelt JSON), 1000 elég
        break;
      }
