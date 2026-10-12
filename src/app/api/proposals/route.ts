import { NextRequest, NextResponse } from "next/server";
import { readDB } from "@/lib/store";
import { getActiveMemberId } from "@/lib/session";

export async function GET(req: NextRequest) {
  const mittenteId = await getActiveMemberId();
  if (!mittenteId) {
    return NextResponse.json({ errore: "Non autenticato." }, { status: 401 });
  }
  const db = await readDB();
  // Senza progettoId in query: tutte le proposte (vista "generale").
  // Con progettoId: solo quelle di quel progetto.
  const progettoId = req.nextUrl.searchParams.get("progettoId");
  const proposte = db.proposte.filter((p) => (progettoId ? p.progettoId === progettoId : true));
  return NextResponse.json({ proposte: proposte.slice().reverse() });
}
