// Tipi condivisi lato frontend per la selezione del canale attivo.
export type CanaleSelezionato =
  | { tipo: "generale" }
  | { tipo: "progetto"; progettoId: string; nome: string }
  | { tipo: "privato"; progettoId: string | null; nomeProgetto?: string };

export function etichettaCanale(c: CanaleSelezionato): string {
  if (c.tipo === "generale") return "# Generale";
  if (c.tipo === "progetto") return `# ${c.nome}`;
  return c.progettoId ? `Privata con ARPAC — ${c.nomeProgetto ?? ""}` : "Privata con ARPAC";
}

export function chiaveCanale(c: CanaleSelezionato): string {
  if (c.tipo === "generale") return "generale";
  if (c.tipo === "progetto") return `progetto:${c.progettoId}`;
  return c.progettoId ? `privato:${c.progettoId}` : "privato";
}
