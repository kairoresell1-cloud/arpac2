"use client";

import { useEffect, useRef, useState } from "react";
import Avatar, { AvatarData } from "./Avatar";
import { CanaleSelezionato, etichettaCanale } from "@/lib/canale";

type Membro = { id: string; nome: string; ruolo: string; isOwner: boolean; avatar: AvatarData };
type Messaggio = { id: string; canale: string; autoreId: string; testo: string; timestamp: string };

export default function ChatWindow({
  canale,
  io,
  membri,
  onProposteCambiate
}: {
  canale: CanaleSelezionato;
  io: Membro;
  membri: Membro[];
  onProposteCambiate: () => void;
}) {
  const [messaggi, setMessaggi] = useState<Messaggio[]>([]);
  const [bozza, setBozza] = useState("");
  const [invio, setInvio] = useState(false);
  const fineRef = useRef<HTMLDivElement>(null);

  function parametriQuery() {
    const p = new URLSearchParams();
    p.set("tipo", canale.tipo);
    if ((canale.tipo === "progetto" || canale.tipo === "privato") && canale.progettoId) {
      p.set("progettoId", canale.progettoId);
    }
    return p.toString();
  }

  async function carica() {
    const res = await fetch(`/api/chat?${parametriQuery()}`);
    if (res.ok) {
      const data = await res.json();
      setMessaggi(data.messaggi);
    }
  }

  useEffect(() => {
    carica();
    const interval = setInterval(carica, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canale.tipo, canale.tipo === "progetto" ? canale.progettoId : canale.tipo === "privato" ? canale.progettoId : null]);

  useEffect(() => {
    fineRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messaggi]);

  function membro(autoreId: string) {
    return membri.find((m) => m.id === autoreId);
  }

  async function invia() {
    if (!bozza.trim() || invio) return;
    const testo = bozza;
    setBozza("");
    setInvio(true);
    setMessaggi((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, canale: "", autoreId: io.id, testo, timestamp: new Date().toISOString() }
    ]);
    try {
      const body: Record<string, unknown> = { testo, tipo: canale.tipo };
      if ((canale.tipo === "progetto" || canale.tipo === "privato") && canale.progettoId) {
        body.progettoId = canale.progettoId;
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.propostaIds?.length) onProposteCambiate();
        await carica();
      }
    } finally {
      setInvio(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col panel m-3 overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-200 text-sm font-medium text-ink-900">{etichettaCanale(canale)}</div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messaggi.length === 0 && (
          <div className="text-ink-300 text-sm text-center mt-10">Nessun messaggio ancora. Scrivi qualcosa ad ARPAC.</div>
        )}
        {messaggi.map((m) => {
          const mio = m.autoreId === io.id;
          const ai = m.autoreId === "arpac";
          const autore = membro(m.autoreId);
          return (
            <div key={m.id} className={`flex gap-2 ${mio ? "justify-end" : "justify-start"}`}>
              {!mio && !ai && autore && <Avatar avatar={autore.avatar} nome={autore.nome} size="sm" />}
              <div
                className={`max-w-[70%] rounded-token-sm px-3.5 py-2.5 text-sm leading-relaxed ${
                  mio
                    ? "bg-accent text-white"
                    : ai
                    ? "bg-accent-soft border border-accent/20 text-ink-900"
                    : "bg-surface-100 text-ink-900"
                }`}
              >
                {!mio && <div className="text-xs opacity-60 mb-0.5">{ai ? "ARPAC" : autore?.nome || "???"}</div>}
                <div className="whitespace-pre-wrap">{m.testo}</div>
              </div>
            </div>
          );
        })}
        <div ref={fineRef} />
      </div>

      <div className="p-3 border-t border-surface-200 flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="Scrivi un messaggio..."
          value={bozza}
          onChange={(e) => setBozza(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              invia();
            }
          }}
        />
        <button className="btn-primary" onClick={invia} disabled={invio || !bozza.trim()}>
          Invia
        </button>
      </div>
    </div>
  );
}
