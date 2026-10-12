import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDB } from "@/lib/store";
import { createSessionCookie } from "@/lib/session";
import { assicuraAccountOwner } from "@/lib/owner";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ errore: "Email e password richiesti." }, { status: 400 });
  }

  // Self-healing: se le variabili OWNER_* sono configurate, l'account
  // owner nel DB viene sempre allineato a loro prima di tentare il login.
  await assicuraAccountOwner();

  const db = await readDB();
  const membro = db.members.find((m) => m.email.toLowerCase() === String(email).toLowerCase());
  if (!membro) {
    return NextResponse.json({ errore: "Credenziali non valide." }, { status: 401 });
  }

  const valida = await bcrypt.compare(password, membro.passwordHash);
  if (!valida) {
    return NextResponse.json({ errore: "Credenziali non valide." }, { status: 401 });
  }

  await createSessionCookie(membro.id);
  return NextResponse.json({
    ok: true,
    membro: { id: membro.id, nome: membro.nome, ruolo: membro.ruolo, isOwner: membro.isOwner, avatar: membro.avatar }
  });
}
