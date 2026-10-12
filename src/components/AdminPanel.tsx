"use client";

import { useEffect, useState } from "react";

type MembroAdmin = { id: string; nome: string; email: string; ruolo: string; isOwner: boolean };

export default function AdminPanel({ onChiudi }: { onChiudi: () => void }) {
  const [membri, setMembri] = useState<MembroAdmin[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [ruolo, setRuolo] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [successo, setSuccesso] = useState<string | null>(null);
  const [creazione, setCreazione] = useState(false);

  async function carica() {
    const res = await fetch("/api/admin/members");
    if (res.ok) {
      const data = await res.json();
      setMembri(data.membri);
    }
  }

  useEffect(() => {
    carica();
  }, []);

  async function creaMembro() {
    setErrore(null);
    setSuccesso(null);
    setCreazione(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, ruolo, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrore(data.errore || "Errore nella creazione.");
        return;
      }
      setSuccesso(`Account creato per ${nome}. Condividi email e password con lui/lei.`);
      setNome("");
      setEmail("");
      setRuolo("");
      setPassword("");
      await carica();
    } finally {
      setCreazione(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink-900/30 flex items-center justify-center z-50 px-4" onClick={onChiudi}>
      <div className="panel w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Pannello Owner</div>
          <button onClick={onChiudi} className="text-ink-500 hover:text-ink-900 text-sm">
            Chiudi
          </button>
        </div>

        <div className="text-sm text-ink-700 mb-2 font-medium">Crea un nuovo account</div>
        <div className="space-y-2 mb-5">
          <input className="input-field w-full" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input className="input-field w-full" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-field w-full" placeholder="Ruolo (es. Sviluppatore)" value={ruolo} onChange={(e) => setRuolo(e.target.value)} />
          <input
            className="input-field w-full"
            placeholder="Password iniziale"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errore && <div className="text-signal-risk text-sm">{errore}</div>}
          {successo && <div className="text-signal-ok text-sm">{successo}</div>}
          <button
            className="btn-primary w-full"
            onClick={creaMembro}
            disabled={creazione || !nome || !email || !password}
          >
            {creazione ? "Creo l'account..." : "Crea account"}
          </button>
        </div>

        <div className="text-sm text-ink-700 mb-2 font-medium">Membri del team ({membri.length}/5)</div>
        <div className="space-y-1.5">
          {membri.map((m) => (
            <div key={m.id} className="card px-3 py-2 flex items-center justify-between text-sm">
              <div>
                <div className="text-ink-900">
                  {m.nome} {m.isOwner && <span className="text-ink-300 text-xs">· owner</span>}
                </div>
                <div className="text-ink-500 text-xs">{m.email} · {m.ruolo}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
