import { readDB } from "./store";
import { eseguiArpac } from "./ai-session";

// Stato in-memory del processo (unico processo Node persistente su
// Railway/Docker, output:'standalone'). Non serve persisterlo: se il
// container riparte, riparte anche il ciclo.
let ultimoBriefingGiorno: string | null = null;
let ultimoReportGiorno: string | null = null;
const ultimoCheckPerProgetto: Record<string, number> = {}; // progettoId -> timestamp ms, "" = generale

// Più frequente di prima: prima si scriveva quasi solo per emergenze, ora
// ARPAC fa un giro di check-in proattivo ogni ~90 minuti per ciascun
// progetto attivo (oltre che per la chat generale), lasciando poi al
// modello stesso la scelta se dire qualcosa o restare in silenzio — ma con
// un prompt che la spinge a essere presente, non solo ad allarmare.
const INTERVALLO_CHECKIN_MS = 1000 * 60 * 90;

function oggiISO() {
  return new Date().toISOString().slice(0, 10);
}

async function checkInSe(scadutoId: string, canale: string, progettoId: string | null, motivo: string, ora: number) {
  const ultimo = ultimoCheckPerProgetto[scadutoId] || 0;
  if (ora - ultimo < INTERVALLO_CHECKIN_MS) return;
  ultimoCheckPerProgetto[scadutoId] = ora;
  await eseguiArpac({ modalita: "automatico", motivoControllo: motivo, canale, progettoId });
}

/**
 * Chiamata dal loop in src/instrumentation.ts ogni 30s. Briefing/report
 * fissi una volta al giorno sul canale generale, più un check-in
 * proattivo periodico per la chat generale e per ogni progetto attivo.
 */
export async function ticoScheduler() {
  const ora = new Date();
  const oraLocale = ora.getHours();
  const oggi = oggiISO();
  const adesso = ora.getTime();

  if (oraLocale === 8 && ultimoBriefingGiorno !== oggi) {
    ultimoBriefingGiorno = oggi;
    await eseguiArpac({
      modalita: "automatico",
      motivoControllo: "Briefing mattutino: riassumi la giornata che inizia su tutti i progetti (task in scadenza oggi, eventi, proposte in attesa).",
      canale: "generale",
      progettoId: null
    });
    return;
  }

  if (oraLocale === 19 && ultimoReportGiorno !== oggi) {
    ultimoReportGiorno = oggi;
    await eseguiArpac({
      modalita: "automatico",
      motivoControllo: "Report serale: riassumi cosa è successo oggi su tutti i progetti (task completati, movimenti finanziari, novità) e cosa resta aperto.",
      canale: "generale",
      progettoId: null
    });
    return;
  }

  // Check-in proattivo sulla chat generale.
  await checkInSe(
    "generale",
    "generale",
    null,
    "Check-in periodico sulla chat generale: hai qualcosa di utile o interessante da dire sull'insieme dei progetti? Scadenze vicine, task bloccati, pattern nei dati, oppure semplicemente un follow-up su qualcosa menzionato di recente e mai più ripreso.",
    adesso
  );

  // Check-in proattivo per ogni progetto attivo.
  const db = await readDB();
  for (const progetto of db.progetti.filter((p) => p.stato === "attivo")) {
    await checkInSe(
      progetto.id,
      `progetto:${progetto.id}`,
      progetto.id,
      `Check-in periodico sul progetto "${progetto.nome}": hai qualcosa di utile o interessante da dire? Scadenze vicine, task bloccati o fermi da un po', spese ricorrenti anomale, un membro sovraccarico, oppure semplicemente curiosità/follow-up su qualcosa menzionato di recente nella chat (es. risultati di un lavoro in corso) di cui nessuno ha più parlato.`,
      adesso
    );
  }
}
