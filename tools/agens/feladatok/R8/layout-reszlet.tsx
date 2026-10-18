  const nyelv = nyelvKeresbol(sutik.get(NYELV_SUTI)?.value, fejlecek.get("accept-language"));
  const szervezetId = await szervezetAzonosito(sutik.get(MUNKAMENET_SUTI)?.value);
  const [tokenek, f] = await Promise.all([hatasosTema(szervezetId), feliratok(nyelv, szervezetId)]);
  return (
    <html lang={nyelv}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Public+Sans:wght@400;500;600&family=Space+Grotesk:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&display=swap"
        />
        <style id="km-tokenek">{cssValtozok(tokenek)}</style>
      </head>
      <body>
        <FeliratokSzolgaltato f={f} nyelv={nyelv}>{children}</FeliratokSzolgaltato>
      </body>
    </html>
  );
