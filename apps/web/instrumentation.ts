export async function register(): Promise<void> {
  // Csak a nodejs futásidőben és nem build alatt indul a futtató.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { futtatoIndit } = await import("./hirfigyelo/futtato");
  futtatoIndit();
}
