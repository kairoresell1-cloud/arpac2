import { NextResponse } from "next/server";
import { readDB } from "@/lib/store";
import { getActiveMemberId } from "@/lib/session";
import { assicuraAccountOwner } from "@/lib/owner";

export async function GET() {
  // Garantisce che l'owner (da variabili d'ambiente) esista prima di
  // rispondere, così al primissimo avvio compare subito senza bisogno di
  // nessuna registrazione manuale.
  await assicuraAccountOwner();

  const membroId = await getActiveMemberId();
  const db = await readDB();
  const membri = db.members.map((m) => ({ id: m.id, nome: m.nome, ruolo: m.ruolo, isOwner: m.isOwner, avatar: m.avatar }));
  const io = membri.find((m) => m.id === membroId) ?? null;
  return NextResponse.json({ membri, io });
}
