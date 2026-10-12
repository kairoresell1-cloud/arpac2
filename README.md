# ARPAC

Manager AI proattivo per un piccolo team (max 5 persone), multi-progetto. Next.js (App Router) + TypeScript + Tailwind, tema chiaro stile Apple. Modalità file-locale di default (nessun database esterno richiesto), con opzione Supabase per multi-utente reale. AI tramite Groq.

## Come funziona il team

- **Chat Generale**: dove si discute di tutti i progetti insieme.
- **Progetti**: ognuno creato solo dall'owner, con una propria chat principale (ci scrivono tutti i membri) e, per ogni membro, una chat privata 1:1 con ARPAC scoped a quel progetto.
- **Account**: non c'è più auto-registrazione. L'unico account che esiste "di diritto" è l'**owner**, creato automaticamente dalle variabili d'ambiente `OWNER_EMAIL` / `OWNER_PASSWORD` (il nome lo imposti dopo, dal tuo profilo dentro l'app). Da lì, l'owner crea gli account per gli altri membri dal **Pannello Owner** nell'app (email + password), fino a un massimo di 5 persone totali.
- **Profilo**: ogni membro può modificare il proprio nome, ruolo (usato da ARPAC per capire a chi assegnare cosa) e un piccolo avatar stilizzato personalizzabile (colore + icona, nessun upload di immagini).

## Sviluppo locale

```bash
npm install
cp .env.local.example .env.local
# apri .env.local e inserisci GROQ_API_KEY + email/password owner che vuoi usare
npm run dev
```

Apri `http://localhost:3000` e accedi con l'email/password che hai messo in `OWNER_EMAIL`/`OWNER_PASSWORD`. In modalità file-locale i dati vengono salvati in `./data/db.json`.

## Deploy su Railway

1. **Crea un nuovo progetto su Railway** collegato a questo repository GitHub.
2. Railway rileva il `Dockerfile` e builda automaticamente.
3. **Aggiungi un volume**: Settings → Volumes → crea un volume e montalo su `/data`.
4. **Variabili d'ambiente** (Settings → Variables):
   - `GROQ_API_KEY` — la tua chiave Groq
   - `SESSION_SECRET` — `a1487af0896d0c53ea688795c0620dcd0169b45b20c501b6c29a6b3db4d749bb` (già pronto; rigeneralo con `openssl rand -hex 32` se preferisci uno tuo)
   - `OWNER_EMAIL` — l'email con cui accederai come owner
   - `OWNER_PASSWORD` — la password dell'owner (cambiala quando vuoi: basta aggiornare questa variabile e rifare il deploy, l'account si auto-aggiorna)
      - `DATA_DIR` — `/data` (deve combaciare col mount point del volume)
   - `GROQ_MODEL` — opzionale, default `openai/gpt-oss-120b`
   - Per Supabase (opzionale): `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy. Un solo servizio Docker è sufficiente: lo scheduler in background gira dentro allo stesso processo Next.js.
6. Apri l'URL assegnato da Railway e accedi con `OWNER_EMAIL`/`OWNER_PASSWORD`. Da lì, crea i progetti e gli account degli altri membri dal Pannello Owner.

## Quanto spesso scrive ARPAC di sua iniziativa

- **Briefing** alle 8:00 e **report** alle 19:00 sulla chat Generale, una volta al giorno.
- **Check-in proattivo** ogni ~90 minuti sia sulla chat Generale sia su ogni progetto attivo: non solo per emergenze (scadenze, task bloccati), ma anche per follow-up su cose menzionate di recente e mai riprese, curiosità sui risultati di un lavoro in corso, pattern nei dati. Il modello stesso decide se ha davvero qualcosa da dire o se stare in silenzio, ma il prompt la spinge a essere presente di default, non solo ad allarmare.
- Ogni messaggio diretto riceve sempre risposta immediata, ovviamente.

## Modalità Supabase (opzionale)

Se vuoi multi-utente reale su un vero database invece dei file JSON: crea un progetto Supabase, esegui `supabase/schema.sql` nell'editor SQL, poi imposta `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` su Railway. **Nota:** `lib/store.ts` attualmente implementa solo la modalità file-locale — per passare a Supabase in produzione, replica le funzioni `readDB`/`mutateDB` con query Supabase equivalenti (lo schema SQL rispecchia `lib/types.ts`, incluso `email` e `avatar` sui membri).

## Decisioni chiave già prese nel codice

- **Owner da variabili d'ambiente, self-healing**: `lib/owner.ts` crea/aggiorna l'account owner a ogni avvio in base a `OWNER_EMAIL`/`OWNER_PASSWORD` (il nome non è una variabile d'ambiente: si imposta dal profilo dentro l'app) — cambi le variabili, rifai il deploy, l'account si allinea da solo.
- **Canali multi-progetto**: una singola collezione di messaggi con chiave canale (`generale`, `progetto:<id>`, `privato:<id-membro>`, `privato:<id-progetto>:<id-membro>`), risolta SEMPRE lato server dall'id di sessione — mai da un id passato dal client, altrimenti un membro potrebbe leggere la chat privata di un altro.
- **Contesto scoped per progetto**: dentro un progetto, ARPAC vede solo task/finanza/eventi/proposte/memorie di quel progetto; nella chat Generale vede la panoramica di tutti i progetti.
- **Groq non ha embedding**: ricerca semantica delle memorie con embedding locale (hashing trick, `lib/embeddings.ts`), soglia minima di similitudine.
- **`reasoning_format: 'hidden'`** sempre attivo nelle chiamate Groq, `reasoning_effort` esplicito, `max_tokens: 6000`.
- **Parsing JSON robusto**: estrazione del blocco `{...}` più esterno prima di `JSON.parse`, schema Zod con `.nullable().transform()` ovunque.
- **Anti-allucinazioni**: verifica che nomi/orari/date citati dall'AI compaiano letteralmente nei dati reali; nuove memorie accettate solo se la "fonte" è verificabile nel contesto precedente alla risposta.
- **Scheduler integrato** via `src/instrumentation.ts` — deve stare dentro `src/` (non nella root) perché il progetto usa quella cartella, altrimenti Next.js lo ignora silenziosamente. L'import dinamico dello scheduler è condizionato con `if (process.env.NEXT_RUNTIME === "nodejs")`, il pattern esatto che Next.js riconosce per escluderlo dal bundle edge (dove `fs`/`path` non esistono).
- **`HOSTNAME=0.0.0.0` esplicito nel Dockerfile**: Docker imposta da solo una variabile `HOSTNAME` col nome del container, che il server standalone di Next.js userebbe per decidere dove mettersi in ascolto — senza sovrascriverla il server si lega solo a quell'hostname interno e resta irraggiungibile dall'esterno nonostante i log mostrino "Ready".
- **Nessuna porta fissa nel Dockerfile**: l'app legge sempre `process.env.PORT`, quello che Railway assegna a runtime.
- **Lock brevi**: `lib/store.ts` tiene il lock del file SOLO per leggere/scrivere, mai durante le chiamate di rete verso Groq.

## Cosa manca / da rifinire

- Viste dedicate per Task/Finanze/Calendario (le API ci sono già: `/api/tasks`, `/api/finance`, entrambe con `progettoId`; mancano le UI dedicate — per ora si vedono solo dentro al contesto che ARPAC usa per rispondere e nel pannello Proposte).
- Rimozione/modifica di un membro o di un progetto dall'interfaccia (al momento solo creazione).
- Realtime (Supabase Realtime) per la chat — al momento il frontend fa polling ogni 4s sui messaggi e ogni 15s su proposte/progetti.
