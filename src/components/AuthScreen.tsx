"use client";

import { useState } from "react";

export default function AuthScreen({ onAutenticato }: { onAutenticato: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [caricamento, setCaricamento] = useState(false);

  async function invia() {
    setErrore(null);
    setCaricamento(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrore(data.errore || "Qualcosa è andato storto.");
        return;
      }
      onAutenticato();
    } catch {
      setErrore("Impossibile contattare il server.");
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="panel w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold tracking-tight text-ink-900">ARPAC</div>
          <div className="text-ink-500 text-sm mt-1">Il manager AI del tuo team</div>
        </div>

        <div className="space-y-3">
          <input
            className="input-field w-full"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && invia()}
          />
          <input
            className="input-field w-full"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && invia()}
          />

          {errore && <div className="text-signal-risk text-sm">{errore}</div>}

          <button className="btn-primary w-full mt-2" onClick={invia} disabled={caricamento || !email || !password}>
            {caricamento ? "Un attimo..." : "Accedi"}
          </button>

          <div className="text-ink-300 text-xs text-center pt-2">
            Non hai un account? Chiedi all'owner del team di crearlo per te.
          </div>
        </div>
      </div>
    </div>
  );
}
