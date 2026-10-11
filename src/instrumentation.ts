// Hook ufficiale di Next.js (App Router): register() parte UNA SOLA VOLTA
// quando il server si avvia. Funziona perché su Railway/Docker il server
// gira come processo Node persistente (output: 'standalone' in
// next.config.js) — su una piattaforma serverless "a funzioni" questo
// approccio non funzionerebbe, perché il processo si spegne tra una
// richiesta e l'altra. Non serve un secondo servizio/worker separato.
//
// NOTA: questo file DEVE stare dentro src/ (non nella root del progetto)
// perché il progetto usa la cartella src/ — Next.js lo ignora
// silenziosamente (nessun errore, nessun log) se messo nel posto sbagliato.
//
// NOTA 2: Next.js compila instrumentation.ts per DUE runtime (nodejs ed
// edge). Il blocco "if (process.env.NEXT_RUNTIME === 'nodejs') { await
// import(...) }" è il pattern esatto che il bundler di Next riconosce per
// includere quell'import SOLO nel bundle nodejs — che è l'unico dove
// esistono `fs`/`path`, usati da lib/store.ts. Qualunque altra forma
// (early return, variabile intermedia, ecc.) fa fallire la build sul
// bundle edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ticoScheduler } = await import("./lib/scheduler-logic");

    const INTERVALLO_MS = 30_000;

    setInterval(() => {
      // Qualsiasi errore nel ciclo dello scheduler viene intercettato qui:
      // non deve MAI poter far cadere il processo del server web.
      ticoScheduler().catch((err) => {
        console.error("[ARPAC scheduler] errore nel ciclo:", err);
      });
    }, INTERVALLO_MS);

    console.log("[ARPAC] scheduler in background avviato (ogni 30s).");
  }
}
