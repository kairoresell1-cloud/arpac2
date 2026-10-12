import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { mutateDB, readDB } from "@/lib/store";
import { getActiveMemberId } from "@/lib/session";

async function richiedenteEOwner() {
  const id = await getActiveMemberId();
  if (!id) return { ok: false as const, status: 401, errore: "Non autenticato." };
  const db = await readDB();
  const io = db.members.find((m) => m.id === id);
  if (!io?.isOwner) return { ok: false as const, status: 403, errore: "Solo l'owner può gestire gli account." };
  return { ok: true as const, io, db };
}

// Crea un nuovo membro del team. SOLO l'owner può farlo — non esiste più
// un'auto-registrazione pubblica: l'owner genera email e password per ogni
// nuova persona dal pannello Owner.
export async function POST(req: NextRequest) {
  const check = await richiedenteEOwner();
  if (!check.ok) return NextResponse.json({ errore: check.errore }, { status: check.status });

  const { nome, email, ruolo, password } = await req.json();
  if (!nome || !email || !password) {
    return NextResponse.json({ errore: "Nome, email e password richiesti." }, { status: 400 });
  }
  if (check.db.members.length >= 5) {
    return NextResponse.json({ errore: "Il team ha già raggiunto il massimo di 5 membri." }, { status: 400 });
  }
  if (check.db.members.some((m) => m.email.toLowerCase() === String(email).toLowerCase())) {
    return NextResponse.json({ errore: "Esiste già un membro con questa email." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const palette = ["#6E8CFF", "#5FD9A4", "#E8B45C", "#E8705C", "#A9B8FF", "#8A8F9C"];
  const nuovoMembro = {
    id: nanoid(),
    nome: String(nome),
    email: String(email).toLowerCase(),
    ruolo: ruolo ? String(ruolo) : "Membro",
    isOwner: false,
    passwordHash,
    avatar: { colore: palette[Math.floor(Math.random() * palette.length)], icona: "persona" },
    creatoIl: new Date().toISOString()
  };

  await mutateDB((db) => {
    db.members.push(nuovoMembro);
  });

  return NextResponse.json({ ok: true, membro: { id: nuovoMembro.id, nome: nuovoMembro.nome, email: nuovoMembro.email, ruolo: nuovoMembro.ruolo } });
}

// Elenco completo (con email) per il pannello owner — /api/members invece
// espone i membri senza email per il resto dell'app.
export async function GET() {
  const check = await richiedenteEOwner();
  if (!check.ok) return NextResponse.json({ errore: check.errore }, { status: check.status });
  return NextResponse.json({
    membri: check.db.members.map((m) => ({ id: m.id, nome: m.nome, email: m.email, ruolo: m.ruolo, isOwner: m.isOwner }))
  });
}
