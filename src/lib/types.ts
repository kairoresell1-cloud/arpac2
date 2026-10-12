export type Avatar = {
  colore: string; // es. "#6E8CFF"
  icona: string; // chiave di un'icona dal set predefinito (vedi components/Avatar.tsx)
};

export type Member = {
  id: string;
  nome: string;
  email: string;
  ruolo: string;
  isOwner: boolean;
  passwordHash: string;
  avatar: Avatar;
  creatoIl: string;
};

export type Task = {
  id: string;
  titolo: string;
  descrizione: string;
  stato: "da_fare" | "in_corso" | "bloccato" | "fatto";
  assegnatoA: string | null;
  scadenza: string | null;
  progettoId: string | null;
  creatoIl: string;
  aggiornatoIl: string;
};

export type Progetto = {
  id: string;
  nome: string;
  descrizione: string;
  stato: "attivo" | "in_pausa" | "concluso";
  creatoIl: string;
  creatoDa: string;
};

export type MovimentoFinanziario = {
  id: string;
  tipo: "entrata" | "uscita";
  importo: number;
  descrizione: string;
  ricorrente: boolean;
  progettoId: string | null;
  data: string;
  creatoIl: string;
};

export type EventoCalendario = {
  id: string;
  titolo: string;
  data: string;
  note: string | null;
  progettoId: string | null;
  creatoIl: string;
};

// Chiavi canale:
//  "generale"                      -> chat principale del team
//  "progetto:<progettoId>"         -> chat principale di un progetto (ci scrivono tutti)
//  "privato:<membroId>"            -> chat privata membro<->ARPAC, non legata a un progetto
//  "privato:<progettoId>:<membroId>" -> chat privata membro<->ARPAC dentro un progetto
export type Messaggio = {
  id: string;
  canale: string;
  autoreId: string; // id membro, oppure "arpac"
  testo: string;
  timestamp: string;
};

export type Proposta = {
  id: string;
  tipo: "progetto" | "task" | "scadenza" | "finanza" | "altro";
  titolo: string;
  descrizione: string;
  motivazione: string;
  payload: Record<string, unknown>;
  progettoId: string | null;
  stato: "in_attesa" | "approvata" | "rifiutata";
  creataIl: string;
  decisaIl: string | null;
  decisaDa: string | null;
};

export type Memoria = {
  id: string;
  contenuto: string;
  fonte: string;
  progettoId: string | null;
  creataIl: string;
};

export type DB = {
  members: Member[];
  tasks: Task[];
  progetti: Progetto[];
  finanza: MovimentoFinanziario[];
  calendario: EventoCalendario[];
  messaggi: Messaggio[];
  proposte: Proposta[];
  memorie: Memoria[];
};

export const emptyDB = (): DB => ({
  members: [],
  tasks: [],
  progetti: [],
  finanza: [],
  calendario: [],
  messaggi: [],
  proposte: [],
  memorie: []
});
