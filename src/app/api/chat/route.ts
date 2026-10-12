import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { mutateDB, readDB } from "@/lib/store";
import { getActiveMemberId } from "@/lib/session";
import { eseguiArpac } from "@/lib/ai-session";

type TipoRichiesta = "generale" | "progetto" | "privato";

/**
 * Risolve SEMPRE la chiave canale lato server, usando l'id del membro
 * autenticato dalla sessione — mai un id passato dal client. Per i canali
 * privati questo impedisce a un membro di leggere/scrivere nella chat
 * privata di un altro semplicemente passando un id diverso.
 */
function risolviCanale(tipo: TipoRichiesta, progettoId: string | null, mittenteId: string): string {
  if (tipo === "generale") return "generale";
  if (tipo === "progetto") return `progetto:${progettoId}`;
  // privato
  return progettoId ? `privato:${progettoId}:${mittenteId}` : `privato:${mittenteId}`;
}

export async function GET(req: NextRequest) {
  const mittenteId = await getActiveMemberId();
  if (!mittenteId) return NextResponse.json({ errore: "Non autenticato." }, { status: 401 });

  const tipo = (req.nextUrl.searchParams.get("tipo") || "generale") as TipoRichiesta;
  const progettoId = req.nextUrl.searchParams.get("progettoId");
  const canale = risolviCanale(tipo, progettoId, mittenteId);

  const db = await readDB();
  const messaggi = db.messaggi.filter((m) => m.canale === canale).slice(-150);
  return NextResponse.json({ messaggi });
}

export async function POST(req: NextRequest) {
  const mittenteId = await getActiveMemberId();
  if (!mittenteId) return NextResponse.json({ errore: "Non autenticato." }, { status: 401 });

  const { testo, tipo, progettoId } = await req.json();
  if (!testo || typeof testo !== "string") {
    return NextResponse.json({ errore: "Testo del messaggio mancante." }, { status: 400 });
  }
  const tipoFinale: TipoRichiesta = tipo === "progetto" || tipo === "privato" ? tipo : "generale";
  const progettoIdFinale = progettoId ? String(progettoId) : null;
  const canale = risolviCanale(tipoFinale, progettoIdFinale, mittenteId);

  // Salva subito il messaggio dell'utente (lock breve, no rete).
  await mutateDB((db) => {
    db.messaggi.push({
      id: nanoid(),
      canale,
      autoreId: mittenteId,
      testo,
      timestamp: new Date().toISOString()
    });
  });

  const risultato = await eseguiArpac({
    modalita: "diretto",
    mittenteId,
    testoMessaggio: testo,
    canale,
    progettoId: progettoIdFinale
  });

  return NextResponse.json(risultato);
}
