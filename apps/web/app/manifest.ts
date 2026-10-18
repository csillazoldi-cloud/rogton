import type { MetadataRoute } from "next";

// A „kezdőképernyőre tétel” neve és ikonja — a termék neve (G4: Rögtön) és a jele. A manifest nyelvfüggetlen fájl; a felület magyar.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rögtön",
    short_name: "Rögtön",
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
