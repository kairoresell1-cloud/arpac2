FROM node:20-slim AS base

# --- deps ---
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev=false

# --- build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Garantisce che la cartella esista SEMPRE nell'immagine, anche se il
# metodo di upload usato (zip, drag&drop, git senza file dentro) ha
# "perso" la cartella public perché era vuota.
RUN mkdir -p public
# Rete di sicurezza: rimuove file di versioni precedenti del progetto che
# possono essere rimasti nel repo collegato (es. git non ha rimosso un
# file eliminato in una versione più recente di questo codice). Senza
# questo, un repo non perfettamente sincronizzato fa fallire la build con
# errori di tipo su file che nel codice attuale non dovrebbero esistere.
RUN rm -rf src/app/api/auth/register instrumentation.ts
RUN npm run build

# --- runtime ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATA_DIR=/data
# Docker imposta da solo una variabile HOSTNAME col nome/ID del container.
# Il server standalone di Next.js la legge per decidere l'indirizzo su cui
# mettersi in ascolto: se non la sovrascriviamo, si lega solo a quel
# hostname interno invece che a tutte le interfacce, e resta irraggiungibile
# da fuori il container anche se i log mostrano "Ready" ed è sano.
ENV HOSTNAME=0.0.0.0

# Utente non-root
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 arpac

COPY --from=builder /app/public ./public
COPY --from=builder --chown=arpac:nodejs /app/.next/standalone ./
COPY --from=builder --chown=arpac:nodejs /app/.next/static ./.next/static

RUN mkdir -p /data && chown -R arpac:nodejs /data

USER arpac
EXPOSE 8080

# NESSUN valore fisso qui: Railway inietta la propria variabile PORT a
# runtime e il server.js di Next.js la legge automaticamente
# (process.env.PORT). Forzare un valore qui può disallinearsi dalla porta
# che Railway usa davvero per il routing pubblico, causando
# "Application failed to respond" anche con un container sano e in ascolto.

CMD ["node", "server.js"]
