"use client";

import { useState } from "react";

export default function NewProjectModal({ onChiudi, onCreato }: { onChiudi: () => void; onCreato: () => void }) {
  const [nome, setNome] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [creazione, setCreazione] = useState(false);

  async function crea() {
    setErrore(null);
    setCreazione(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, descrizione })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrore(data.errore || "Errore nella creazione.");
        return;
      }
      onCreato();
      onChiudi();
    } finally {
      setCreazione(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink-900/30 flex items-center justify-center z-50 px-4" onClick={onChiudi}>
      <div className="panel w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold mb-4">Nuovo progetto</div>
        <div className="space-y-3">
          <input className="input-field w-full" placeholder="Nome del progetto" value={nome} onChange={(e) => setNome(e.target.value)} />
          <textarea
            className="input-field w-full resize-none"
            rows={3}
            placeholder="Descrizione (opzionale)"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
          />
          {errore && <div className="text-signal-risk text-sm">{errore}</div>}
          <div className="flex gap-2 pt-1">
            <button className="btn-primary flex-1" onClick={crea} disabled={creazione || !nome.trim()}>
              {creazione ? "Creo..." : "Crea progetto"}
            </button>
            <button className="btn-ghost" onClick={onChiudi}>
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
