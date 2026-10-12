import { nanoid } from "nanoid";
import { readDB, mutateDB } from "./store";
import { costruisciContesto, contestoPrecedenteTestuale } from "./context";
import { chiamaArpac } from "./groq";
import { parseArpacResponse } from "./ai-schema";
import { verificaTesto, filtraMemorieVerificabili } from "./anti-allucinazioni";
import { ARPAC_SYSTEM_PROMPT } from "./prompt";
import { DB, Messaggio } from "./types";

type EsecuzioneArpacInput =
  | { modalita: "diretto"; mittenteId: string; testoMessaggio: string; canale: string; progettoId: string | null }
  | { modalita: "automatico"; motivoControllo: string; canale: string; progettoId: string | null };

export type EsecuzioneArpacOutput = {
  messaggioAI: Messaggio | null;
  propostaIds: string[];
  memorieSalvate: number;
  avvisiVerifica: string[];
};

/**
 * Esegue un ciclo completo: legge il DB (lettura pura, no lock), chiama
 * Groq (chiamata di rete, NESSUN lock tenuto durante questa fase), poi
 * applica verifica anti-allucinazioni e scrive il risultato con un lock
 * breve. Pattern da seguire ovunque: mai tenere mutateDB() aperto a
 * cavallo di una await di rete.
 */
export async function eseguiArpac(input: EsecuzioneArpacInput): Promise<EsecuzioneArpacOutput> {
  const dbLettura = await readDB();
  const contesto = costruisciContesto(dbLettura, input);
  const contestoPrecedente = contestoPrecedenteTestuale(dbLettura);

  const rawRisposta = await chiamaArpac({
    systemPrompt: ARPAC_SYSTEM_PROMPT,
    contesto,
    reasoningEffort: "medium"
  });

  const risposta = parseArpacResponse(rawRisposta);

  const forzaRisposta = input.modalita === "diretto" && risposta.silenzio;
  const testoFinale = forzaRisposta
    ? "Ho ricevuto il tuo messaggio ma non sono riuscito a formulare una risposta utile in questo momento. Puoi riformulare?"
    : risposta.testo;

  if (input.modalita === "automatico" && (risposta.silenzio || !testoFinale)) {
    return { messaggioAI: null, propostaIds: [], memorieSalvate: 0, avvisiVerifica: [] };
  }

  const verifica = verificaTesto(testoFinale, dbLettura);
  const testoDaMostrare = verifica.ok
    ? testoFinale
    : `${testoFinale}\n\n(Nota: alcuni dettagli di questa risposta non sono stati verificabili nei dati del team e sono stati segnalati internamente.)`;

  const memorieVerificate = filtraMemorieVerificabili(risposta.nuoveMemorie, contestoPrecedente);

  const idMessaggio = nanoid();
  const propostaIds: string[] = [];

  await mutateDB((db: DB) => {
    db.messaggi.push({
      id: idMessaggio,
      canale: input.canale,
      autoreId: "arpac",
      testo: testoDaMostrare,
      timestamp: new Date().toISOString()
    });

    for (const p of risposta.proposte) {
      const id = nanoid();
      propostaIds.push(id);
      db.proposte.push({
        id,
        tipo: p.tipo,
        titolo: p.titolo,
        descrizione: p.descrizione,
        motivazione: p.motivazione,
        payload: p.payload,
        progettoId: input.progettoId,
        stato: "in_attesa",
        creataIl: new Date().toISOString(),
        decisaIl: null,
        decisaDa: null
      });
    }

    for (const m of memorieVerificate) {
      db.memorie.push({
        id: nanoid(),
        contenuto: m.contenuto,
        fonte: m.fonte,
        progettoId: input.progettoId,
        creataIl: new Date().toISOString()
      });
    }
  });

  const messaggioAI: Messaggio = {
    id: idMessaggio,
    canale: input.canale,
    autoreId: "arpac",
    testo: testoDaMostrare,
    timestamp: new Date().toISOString()
  };

  return {
    messaggioAI,
    propostaIds,
    memorieSalvate: memorieVerificate.length,
    avvisiVerifica: verifica.motivi
  };
}
