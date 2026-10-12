import { DB } from "./types";
import { cercaRilevanti } from "./embeddings";

type TipoContesto =
  | { modalita: "diretto"; mittenteId: string; testoMessaggio: string; canale: string; progettoId: string | null }
  | { modalita: "automatico"; motivoControllo: string; canale: string; progettoId: string | null };

function elencoMembri(db: DB): string {
  return (
    db.members.map((m) => `- ${m.nome} (${m.ruolo})${m.isOwner ? " [owner]" : ""} (id:${m.id})`).join("\n") ||
    "(nessun membro registrato)"
  );
}

function elencoProgetti(db: DB): string {
  return (
    db.progetti
      .map((p) => `- [${p.stato}] ${p.nome} — ${p.descrizione || "nessuna descrizione"} (id:${p.id})`)
      .join("\n") || "(nessun progetto creato finora)"
  );
}

/**
 * Costruisce il contesto per il modello. Una risposta diretta a un
 * messaggio di una persona vera riceve LO STESSO livello di contesto
 * (task attivi, membri, memorie, cronologia recente) di un messaggio
 * spontaneo programmato — mai un prompt vuoto con solo il testo appena
 * scritto. Senza dati veri da cui partire, l'AI riempie il vuoto
 * inventando.
 *
 * Nel canale "generale" il contesto è una panoramica di TUTTI i progetti
 * (si discute di tutto il team lì). Nel canale di un progetto specifico,
 * il contesto è filtrato SOLO sui dati di quel progetto (task, finanza,
 * eventi, proposte, memorie), così ARPAC resta pertinente e non mescola
 * progetti diversi nella stessa conversazione.
 */
export function costruisciContesto(db: DB, tipo: TipoContesto): string {
  const progettoId = tipo.progettoId;
  const progettoCorrente = progettoId ? db.progetti.find((p) => p.id === progettoId) : null;

  const taskRilevanti = db.tasks
    .filter((t) => t.stato !== "fatto" && (progettoId ? t.progettoId === progettoId : true))
    .map((t) => `- [${t.stato}] ${t.titolo} — assegnato a: ${t.assegnatoA ?? "nessuno"} — scadenza: ${t.scadenza ?? "nessuna"} (id:${t.id})`)
    .join("\n") || "(nessun task attivo)";

  const prossimiEventi = db.calendario
    .filter((e) => (progettoId ? e.progettoId === progettoId : true))
    .slice()
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 10)
    .map((e) => `- ${e.data} — ${e.titolo} (id:${e.id})`)
    .join("\n") || "(nessun evento imminente)";

  const movimentiRecenti = db.finanza
    .filter((f) => (progettoId ? f.progettoId === progettoId : true))
    .slice(-15)
    .map((f) => `- ${f.data} ${f.tipo} ${f.importo}€ — ${f.descrizione} (id:${f.id})`)
    .join("\n") || "(nessun movimento registrato)";

  const propostePendenti = db.proposte
    .filter((p) => p.stato === "in_attesa" && (progettoId ? p.progettoId === progettoId : true))
    .map((p) => `- [${p.tipo}] ${p.titolo} (id:${p.id})`)
    .join("\n") || "(nessuna proposta in attesa)";

  const cronologiaRecente = db.messaggi
    .filter((m) => m.canale === tipo.canale)
    .slice(-30)
    .map((m) => `[${m.timestamp}] (id:${m.id}) ${m.autoreId}: ${m.testo}`)
    .join("\n") || "(nessun messaggio precedente in questo canale)";

  const queryMemoria = tipo.modalita === "diretto" ? tipo.testoMessaggio : tipo.motivoControllo;
  const memorieRilevanti = cercaRilevanti(
    queryMemoria,
    db.memorie
      .filter((m) => (progettoId ? m.progettoId === progettoId || m.progettoId === null : true))
      .map((m) => ({ testo: m.contenuto, dato: m })),
    8
  )
    .map((r) => `- (id:${r.dato.id}) ${r.dato.contenuto}`)
    .join("\n") || "(nessuna memoria pertinente trovata)";

  const intestazioneModalita =
    tipo.modalita === "diretto"
      ? `QUESTO È UN MESSAGGIO DIRETTO DI UNA PERSONA VERA (${tipo.mittenteId}), NON un controllo automatico. Sta aspettando una risposta: non usare mai "silenzio: true" qui.\nMessaggio ricevuto: "${tipo.testoMessaggio}"`
      : `QUESTO È UN CONTROLLO AUTOMATICO IN BACKGROUND. Motivo del controllo: ${tipo.motivoControllo}. Se davvero non c'è nulla di utile da dire, rispondi con silenzio: true — ma ricorda che il tuo compito è anche essere presente e interessata ai progetti, non solo segnalare emergenze.`;

  const sezioneAmbito = progettoCorrente
    ? `## Ambito di questa conversazione\nSei dentro al progetto "${progettoCorrente.nome}" (id:${progettoCorrente.id}). Tutto il contesto sotto (task, eventi, finanza, proposte, memorie) è filtrato SOLO su questo progetto. Non menzionare altri progetti a meno che l'utente non li nomini lui stesso.`
    : `## Ambito di questa conversazione\nSei nella chat GENERALE del team, dove si discute di tutti i progetti insieme. Ecco l'elenco di tutti i progetti esistenti:\n${elencoProgetti(db)}`;

  return `${intestazioneModalita}

${sezioneAmbito}

## Membri del team (il loro ruolo dichiarato guida come assegni compiti/competenze)
${elencoMembri(db)}

## Task attivi
${taskRilevanti}

## Prossimi eventi in calendario
${prossimiEventi}

## Movimenti finanziari recenti
${movimentiRecenti}

## Proposte in attesa di approvazione
${propostePendenti}

## Cronologia recente di questo canale
${cronologiaRecente}

## Memorie rilevanti
${memorieRilevanti}`;
}

export function contestoPrecedenteTestuale(db: DB): string {
  return JSON.stringify({
    messaggi: db.messaggi.map((m) => m.id),
    tasks: db.tasks.map((t) => t.id),
    eventi: db.calendario.map((e) => e.id),
    finanza: db.finanza.map((f) => f.id),
    memorie: db.memorie.map((m) => m.id)
  });
}
