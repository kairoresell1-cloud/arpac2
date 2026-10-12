"use client";

import { useState } from "react";
import Avatar, { AvatarData, CHIAVI_ICONE, PALETTE_AVATAR } from "./Avatar";

export default function ProfileModal({
  nomeAttuale,
  ruoloAttuale,
  avatarAttuale,
  onChiudi,
  onSalvato
}: {
  nomeAttuale: string;
  ruoloAttuale: string;
  avatarAttuale: AvatarData;
  onChiudi: () => void;
  onSalvato: () => void;
}) {
  const [nome, setNome] = useState(nomeAttuale);
  const [ruolo, setRuolo] = useState(ruoloAttuale);
  const [avatar, setAvatar] = useState<AvatarData>(avatarAttuale);
  const [salvataggio, setSalvataggio] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  async function salva() {
    setSalvataggio(true);
    setErrore(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, ruolo, avatar })
      });
      if (!res.ok) {
        const data = await res.json();
        setErrore(data.errore || "Errore nel salvataggio.");
        return;
      }
      onSalvato();
      onChiudi();
    } finally {
      setSalvataggio(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink-900/30 flex items-center justify-center z-50 px-4" onClick={onChiudi}>
      <div className="panel w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold mb-4">Il tuo profilo</div>

        <div className="flex items-center gap-3 mb-5">
          <Avatar avatar={avatar} nome={nome} size="lg" />
          <div className="text-ink-500 text-sm">Scegli colore e icona qui sotto</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-ink-500 mb-1 block">Nome</label>
            <input className="input-field w-full" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-ink-500 mb-1 block">Ruolo nel team</label>
            <input
              className="input-field w-full"
              placeholder="es. Sviluppatore, Designer, Marketing..."
              value={ruolo}
              onChange={(e) => setRuolo(e.target.value)}
            />
            <div className="text-ink-300 text-xs mt-1">ARPAC usa questo per capire a chi assegnare cosa.</div>
          </div>

          <div>
            <label className="text-xs text-ink-500 mb-1 block">Colore</label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE_AVATAR.map((c) => (
                <button
                  key={c}
                  onClick={() => setAvatar((a) => ({ ...a, colore: c }))}
                  className={`w-7 h-7 rounded-full transition-transform ${avatar.colore === c ? "ring-2 ring-offset-2 ring-accent scale-105" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-500 mb-1 block">Icona</label>
            <div className="flex gap-2 flex-wrap">
              {CHIAVI_ICONE.map((chiave) => (
                <button
                  key={chiave}
                  onClick={() => setAvatar((a) => ({ ...a, icona: chiave }))}
                  className={`rounded-full transition-transform ${
                    avatar.icona === chiave ? "ring-2 ring-offset-2 ring-accent scale-105" : ""
                  }`}
                >
                  <Avatar avatar={{ colore: avatar.colore, icona: chiave }} nome="" size="md" />
                </button>
              ))}
            </div>
          </div>

          {errore && <div className="text-signal-risk text-sm">{errore}</div>}

          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex-1" onClick={salva} disabled={salvataggio || !nome.trim()}>
              {salvataggio ? "Salvo..." : "Salva"}
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
