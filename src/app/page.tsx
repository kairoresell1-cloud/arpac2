"use client";

import { useEffect, useState } from "react";
import AuthScreen from "@/components/AuthScreen";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import ProposalsPanel from "@/components/ProposalsPanel";
import ProfileModal from "@/components/ProfileModal";
import AdminPanel from "@/components/AdminPanel";
import NewProjectModal from "@/components/NewProjectModal";
import { AvatarData } from "@/components/Avatar";
import { CanaleSelezionato } from "@/lib/canale";

type Membro = { id: string; nome: string; ruolo: string; isOwner: boolean; avatar: AvatarData };
type Progetto = { id: string; nome: string; descrizione: string; stato: string };

export default function Home() {
  const [caricamento, setCaricamento] = useState(true);
  const [io, setIo] = useState<Membro | null>(null);
  const [membri, setMembri] = useState<Membro[]>([]);
  const [progetti, setProgetti] = useState<Progetto[]>([]);
  const [canaleAttivo, setCanaleAttivo] = useState<CanaleSelezionato>({ tipo: "generale" });
  const [pannelloProposteAperto, setPannelloProposteAperto] = useState(false);
  const [numeroProposte, setNumeroProposte] = useState(0);
  const [aggiornaProposte, setAggiornaProposte] = useState(0);
  const [profiloAperto, setProfiloAperto] = useState(false);
  const [adminAperto, setAdminAperto] = useState(false);
  const [nuovoProgettoAperto, setNuovoProgettoAperto] = useState(false);

  async function caricaStato() {
    const res = await fetch("/api/members");
    const data = await res.json();
    setMembri(data.membri || []);
    setIo(data.io || null);
    setCaricamento(false);
  }

  async function caricaProgetti() {
    const res = await fetch("/api/projects");
    if (res.ok) {
      const data = await res.json();
      setProgetti(data.progetti || []);
    }
  }

  async function caricaNumeroProposte() {
    const res = await fetch("/api/proposals");
    if (res.ok) {
      const data = await res.json();
      setNumeroProposte(data.proposte.filter((p: any) => p.stato === "in_attesa").length);
    }
  }

  useEffect(() => {
    caricaStato();
  }, []);

  useEffect(() => {
    if (!io) return;
    caricaProgetti();
    caricaNumeroProposte();
    const interval = setInterval(() => {
      caricaNumeroProposte();
      caricaProgetti();
    }, 15000);
    return () => clearInterval(interval);
  }, [io, aggiornaProposte]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setIo(null);
  }

  if (caricamento) {
    return <div className="min-h-screen flex items-center justify-center text-ink-300 text-sm">Caricamento...</div>;
  }

  if (!io) {
    return <AuthScreen onAutenticato={caricaStato} />;
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        membri={membri}
        progetti={progetti}
        io={io}
        canaleAttivo={canaleAttivo}
        onCambiaCanale={setCanaleAttivo}
        numeroProposte={numeroProposte}
        pannelloProposteAperto={pannelloProposteAperto}
        onTogglePannelloProposte={() => setPannelloProposteAperto((v) => !v)}
        onApriProfilo={() => setProfiloAperto(true)}
        onApriAdmin={() => setAdminAperto(true)}
        onApriNuovoProgetto={() => setNuovoProgettoAperto(true)}
        onLogout={logout}
      />
      <ChatWindow canale={canaleAttivo} io={io} membri={membri} onProposteCambiate={() => setAggiornaProposte((v) => v + 1)} />
      {pannelloProposteAperto && (
        <ProposalsPanel onChiudi={() => setPannelloProposteAperto(false)} aggiorna={aggiornaProposte} canale={canaleAttivo} />
      )}

      {profiloAperto && (
        <ProfileModal
          nomeAttuale={io.nome}
          ruoloAttuale={io.ruolo}
          avatarAttuale={io.avatar}
          onChiudi={() => setProfiloAperto(false)}
          onSalvato={caricaStato}
        />
      )}
      {adminAperto && <AdminPanel onChiudi={() => setAdminAperto(false)} />}
      {nuovoProgettoAperto && (
        <NewProjectModal onChiudi={() => setNuovoProgettoAperto(false)} onCreato={caricaProgetti} />
      )}
    </div>
  );
}
