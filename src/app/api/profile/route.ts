import { NextRequest, NextResponse } from "next/server";
import { mutateDB } from "@/lib/store";
import { getActiveMemberId } from "@/lib/session";

// Un membro aggiorna SOLO il proprio profilo: nome, ruolo (da cui ARPAC
// deduce come assegnare compiti/competenze) e avatar stilizzato
// (colore + icona dal set predefinito, niente upload di immagini).
export async function PATCH(req: NextRequest) {
  const membroId = await getActiveMemberId();
  if (!membroId) return NextResponse.json({ errore: "Non autenticato." }, { status: 401 });

  const { nome, ruolo, avatar } = await req.json();

  const trovato = await mutateDB((db): boolean => {
    const m = db.members.find((m) => m.id === membroId);
    if (!m) return false;
    if (typeof nome === "string" && nome.trim()) m.nome = nome.trim();
    if (typeof ruolo === "string") m.ruolo = ruolo.trim();
    if (avatar && typeof avatar.colore === "string" && typeof avatar.icona === "string") {
      m.avatar = { colore: avatar.colore, icona: avatar.icona };
    }
    return true;
  });

  if (!trovato) return NextResponse.json({ errore: "Membro non trovato." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
