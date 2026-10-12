import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { mutateDB, readDB } from "@/lib/store";
import { getActiveMemberId } from "@/lib/session";

export async function GET() {
  const membroId = await getActiveMemberId();
  if (!membroId) return NextResponse.json({ errore: "Non autenticato." }, { status: 401 });
  const db = await readDB();
  return NextResponse.json({ progetti: db.progetti });
}

// Solo l'owner può creare un nuovo progetto (e la sua chat/sezione
// dedicata). I membri normali possono scrivere nella chat del progetto ma
// non crearne di nuovi.
export async function POST(req: NextRequest) {
  const membroId = await getActiveMemberId();
  if (!membroId) return NextResponse.json({ errore: "Non autenticato." }, { status: 401 });

  const db = await readDB();
  const io = db.members.find((m) => m.id === membroId);
  if (!io?.isOwner) {
    return NextResponse.json({ errore: "Solo l'owner può creare un progetto." }, { status: 403 });
  }

  const { nome, descrizione } = await req.json();
  if (!nome) return NextResponse.json({ errore: "Nome del progetto richiesto." }, { status: 400 });

  const nuovo = {
    id: nanoid(),
    nome: String(nome),
    descrizione: descrizione ? String(descrizione) : "",
    stato: "attivo" as const,
    creatoIl: new Date().toISOString(),
    creatoDa: membroId
  };

  await mutateDB((db) => {
    db.progetti.push(nuovo);
  });

  return NextResponse.json({ ok: true, progetto: nuovo });
}
