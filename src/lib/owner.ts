import bcrypt from "bcryptjs";
import { mutateDB } from "./store";
import { DB } from "./types";

// L'account owner NON si registra più dall'interfaccia: viene creato/
// aggiornato automaticamente da OWNER_EMAIL / OWNER_PASSWORD / OWNER_NOME
// impostate come variabili d'ambiente su Railway. Se cambi quelle
// variabili e rifai il deploy, l'owner esistente viene aggiornato (stesso
// id, nuovo hash password) invece di crearne uno duplicato.

const OWNER_ID = "owner";
let ultimoHashCalcolato: string | null = null; // evita di ricalcolare bcrypt a ogni chiamata

export function credenzialiOwnerConfigurate(): boolean {
  return Boolean(process.env.OWNER_EMAIL && process.env.OWNER_PASSWORD);
}

/**
 * Garantisce che il membro owner nel DB rispecchi le variabili d'ambiente
 * correnti. Self-healing: se l'owner manca lo crea, se email/nome/password
 * sono cambiati li aggiorna. Economico da chiamare spesso: l'hash bcrypt
 * viene ricalcolato solo se OWNER_PASSWORD cambia rispetto all'ultima
 * chiamata in questo processo.
 */
export async function assicuraAccountOwner(): Promise<void> {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  const nome = process.env.OWNER_NOME || "Owner";
  if (!email || !password) return; // non configurato: nessun owner da provisionare

  let passwordHash = ultimoHashCalcolato;
  // Ricalcola l'hash solo se non l'abbiamo già in cache per questo processo.
  const chiaveCache = `${email}::${password}`;
  if (!passwordHash || (global as any).__arpacOwnerCacheKey !== chiaveCache) {
    passwordHash = await bcrypt.hash(password, 10);
    ultimoHashCalcolato = passwordHash;
    (global as any).__arpacOwnerCacheKey = chiaveCache;
  }

  await mutateDB((db: DB) => {
    const esistente = db.members.find((m) => m.id === OWNER_ID);
    if (!esistente) {
      db.members.unshift({
        id: OWNER_ID,
        nome,
        email: email.toLowerCase(),
        ruolo: "Owner",
        isOwner: true,
        passwordHash: passwordHash as string,
        avatar: { colore: "#6E8CFF", icona: "stella" },
        creatoIl: new Date().toISOString()
      });
      return;
    }
    esistente.nome = nome;
    esistente.email = email.toLowerCase();
    esistente.passwordHash = passwordHash as string;
    esistente.isOwner = true;
  });
}
