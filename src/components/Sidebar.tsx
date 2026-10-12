"use client";

import { useState } from "react";
import Avatar, { AvatarData } from "./Avatar";
import { CanaleSelezionato, chiaveCanale } from "@/lib/canale";

type Membro = { id: string; nome: string; ruolo: string; isOwner: boolean; avatar: AvatarData };
type Progetto = { id: string; nome: string; descrizione: string; stato: string };

export default function Sidebar({
  membri,
  progetti,
  io,
  canaleAttivo,
  onCambiaCanale,
  numeroProposte,
  pannelloProposteAperto,
  onTogglePannelloProposte,
  onApriProfilo,
  onApriAdmin,
  onApriNuovoProgetto,
  onLogout
}: {
  membri: Membro[];
  progetti: Progetto[];
  io: Membro;
  canaleAttivo: CanaleSelezionato;
  onCambiaCanale: (c: CanaleSelezionato) => void;
  numeroProposte: number;
  pannelloProposteAperto: boolean;
  onTogglePannelloProposte: () => void;
  onApriProfilo: () => void;
  onApriAdmin: () => void;
  onApriNuovoProgetto: () => void;
  onLogout: () => void;
}) {
  const [progettiEspansi, setProgettiEspansi] = useState<Record<string, boolean>>({});

  const attiva = (c: CanaleSelezionato) => chiaveCanale(c) === chiaveCanale(canaleAttivo);

  return (
    <aside className="w-72 shrink-0 panel flex flex-col m-3 mr-0">
      <div className="p-4 border-b border-surface-200 flex items-center gap-3">
        <Avatar avatar={io.avatar} nome={io.nome} size="md" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink-900 truncate">{io.nome}</div>
          <div className="text-xs text-ink-500 truncate">{io.ruolo}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        <button
          onClick={() => onCambiaCanale({ tipo: "generale" })}
          className={`w-full text-left px-3 py-2 rounded-token-sm text-sm transition-colors ${
            attiva({ tipo: "generale" }) ? "bg-accent-soft text-accent-strong font-medium" : "text-ink-700 hover:bg-surface-100"
          }`}
        >
          # Generale
        </button>
        <button
          onClick={() => onCambiaCanale({ tipo: "privato", progettoId: null })}
          className={`w-full text-left px-3 py-2 rounded-token-sm text-sm transition-colors ${
            attiva({ tipo: "privato", progettoId: null }) ? "bg-accent-soft text-accent-strong font-medium" : "text-ink-700 hover:bg-surface-100"
          }`}
        >
          Chat privata con ARPAC
        </button>

        <div className="px-2 pt-4 pb-1 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-ink-300">Progetti</span>
          {io.isOwner && (
            <button onClick={onApriNuovoProgetto} className="text-accent text-xs font-medium hover:text-accent-strong">
              + Nuovo
            </button>
          )}
        </div>

        {progetti.length === 0 && <div className="px-3 py-1 text-xs text-ink-300">Nessun progetto ancora.</div>}

        {progetti.map((p) => {
          const espanso = progettiEspansi[p.id] ?? true;
          return (
            <div key={p.id}>
              <button
                onClick={() => setProgettiEspansi((s) => ({ ...s, [p.id]: !espanso }))}
                className="w-full text-left px-3 py-1.5 text-xs text-ink-500 hover:text-ink-700 flex items-center gap-1"
              >
                <span className={`inline-block transition-transform ${espanso ? "rotate-90" : ""}`}>›</span>
                {p.nome}
              </button>
              {espanso && (
                <div className="ml-3 space-y-0.5">
                  <button
                    onClick={() => onCambiaCanale({ tipo: "progetto", progettoId: p.id, nome: p.nome })}
                    className={`w-full text-left px-3 py-1.5 rounded-token-sm text-sm transition-colors ${
                      attiva({ tipo: "progetto", progettoId: p.id, nome: p.nome })
                        ? "bg-accent-soft text-accent-strong font-medium"
                        : "text-ink-700 hover:bg-surface-100"
                    }`}
                  >
                    # {p.nome}
                  </button>
                  <button
                    onClick={() => onCambiaCanale({ tipo: "privato", progettoId: p.id, nomeProgetto: p.nome })}
                    className={`w-full text-left px-3 py-1.5 rounded-token-sm text-sm transition-colors ${
                      attiva({ tipo: "privato", progettoId: p.id })
                        ? "bg-accent-soft text-accent-strong font-medium"
                        : "text-ink-500 hover:bg-surface-100"
                    }`}
                  >
                    Privata con ARPAC
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div className="px-2 pt-4 pb-1 text-xs uppercase tracking-wide text-ink-300">Team</div>
        {membri.map((m) => (
          <div key={m.id} className="px-3 py-1.5 text-sm text-ink-500 flex items-center gap-2">
            <Avatar avatar={m.avatar} nome={m.nome} size="sm" />
            <span className="truncate">
              {m.nome} {m.isOwner && <span className="text-ink-300">· owner</span>}
            </span>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-surface-200 space-y-0.5">
        <button
          onClick={onTogglePannelloProposte}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-token-sm text-sm transition-colors ${
            pannelloProposteAperto ? "bg-accent-soft text-accent-strong font-medium" : "text-ink-700 hover:bg-surface-100"
          }`}
        >
          <span>Proposte</span>
          {numeroProposte > 0 && (
            <span className="bg-accent text-white text-xs font-medium rounded-full px-2 py-0.5">{numeroProposte}</span>
          )}
        </button>
        <button onClick={onApriProfilo} className="w-full text-left px-3 py-2 rounded-token-sm text-sm text-ink-700 hover:bg-surface-100">
          Il tuo profilo
        </button>
        {io.isOwner && (
          <button onClick={onApriAdmin} className="w-full text-left px-3 py-2 rounded-token-sm text-sm text-ink-700 hover:bg-surface-100">
            Pannello Owner
          </button>
        )}
        <button onClick={onLogout} className="w-full text-left px-3 py-2 rounded-token-sm text-sm text-ink-500 hover:bg-surface-100">
          Esci
        </button>
      </div>
    </aside>
  );
}
