import bcrypt from "bcryptjs";
import { mutateDB } from "./store";
import { DB } from "./types";

// L'account owner NON si registra più dall'interfaccia: viene creato/
// aggiornato automaticamente da OWNER_EMAIL / OWNER_PASSWORD impostate
// come variabili d'ambiente su Railway. Se cambi quelle variabili e rifai
// il deploy, l'owner esistente viene aggiornato (stesso id, nuovo hash
// password) invece di crearne uno duplicato. Il nome si imposta/modifica
// dal profilo dentro l'app (vedi /api/profile), non da variabile
// d'ambiente: viene scelto solo come default alla primissima creazione.

const OWNER_ID = "owner";
let ultimoHashCalcolato: string | null = null; // evita di ricalcolare bcrypt a ogni chiamata

export function credenzialiOwnerConfigurate(): boolean {
  return Boolean(process.env.OWNER_EMAIL && process.env.OWNER_PASSWORD);
}

function nomeDiDefaultDaEmail(email: string): string {
  const locale = email.split("@")[0] || "Owner";
  return locale.charAt(0).toUpperCase() + locale.slice(1);
}

/**
 * Garantisce che il membro owner nel DB rispecchi le variabili d'ambiente
 * correnti (email/password). Self-healing: se l'owner manca lo crea, se
 * email/password sono cambiate le aggiorna. Il nome, una volta creato
 * l'account, NON viene più sovrascritto da qui: resta quello scelto
 * dall'utente nel proprio profilo. Economico da chiamare spesso: l'hash
 * bcrypt viene ricalcolato solo se OWNER_PASSWORD cambia rispetto
 * all'ultima chiamata in questo processo.
 */
export async function assicuraAccountOwner(): Promise<void> {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password) return; // non configurato: nessun owner da provisionare

  let passwordHash = ultimoHashCalcolato;
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
        nome: nomeDiDefaultDaEmail(email),
        email: email.toLowerCase(),
        ruolo: "Owner",
        isOwner: true,
        passwordHash: passwordHash as string,
        avatar: { colore: "#6E8CFF", icona: "stella" },
        creatoIl: new Date().toISOString()
      });
      return;
    }
    // Il nome NON si tocca qui: resta quello che l'utente ha scelto nel
    // proprio profilo, anche se diverso dal default iniziale.
    esistente.email = email.toLowerCase();
    esistente.passwordHash = passwordHash as string;
    esistente.isOwner = true;
  });
}
