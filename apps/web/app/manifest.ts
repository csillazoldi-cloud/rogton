import type { MetadataRoute } from "next";

// R-18 3. kör (Csilla 10-11): a „kezdőképernyőre tétel” neve és ikonja — a termék neve és az a/t jel. A manifest nyelvfüggetlen fájl,
// ezért a magyar név áll benne (a felület maga a választott nyelven fut). Funkció nem változik: csak a név és az ikon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Posztgyár",
    short_name: "Posztgyár",
    start_url: "/kezdolap",
    display: "standalone",
    background_color: "#0a0a0a", // tokenőr: ok — a sötét mód háttere (tema-sotet.json --bg), a manifest nem olvas CSS-t
    theme_color: "#0a0a0a", // tokenőr: ok — ugyanaz
    icons: [
      { src: "/r18/ikon/ikon-sotet-192.png", sizes: "192x192", type: "image/png" },
      { src: "/r18/ikon/ikon-sotet-512.png", sizes: "512x512", type: "image/png" },
      { src: "/r18/ikon/ikon-maszkolhato-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
