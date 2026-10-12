"use client";

export type AvatarData = { colore: string; icona: string };

export const PALETTE_AVATAR = ["#3D6DFF", "#1FA869", "#C98A1E", "#D4473E", "#8A5CF5", "#19A3A3", "#E0588C", "#4B4D55"];

export const ICONE_AVATAR: Record<string, (props: { className?: string }) => JSX.Element> = {
  persona: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="8.5" r="3.4" fill="white" />
      <path d="M5 19.2c1.3-3.4 4-5 7-5s5.7 1.6 7 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  ),
  stella: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="white">
      <path d="M12 3.5l2.3 5.2 5.6.6-4.2 3.8 1.2 5.6L12 15.9l-5 2.8 1.2-5.6-4.2-3.8 5.6-.6L12 3.5z" />
    </svg>
  ),
  razzo: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5c3 1.8 4.5 5 4.5 8.5 0 2-1 4-2 5l-2.5 3-2.5-3c-1-1-2-3-2-5 0-3.5 1.5-6.7 4.5-8.5z" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M9 17l-2 3.5M15 17l2 3.5" />
    </svg>
  ),
  fulmine: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="white">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  ),
  cuore: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="white">
      <path d="M12 20.5s-7.5-4.6-9.8-9C.6 7.8 2.2 4 6 4c2 0 3.5 1.1 4.5 2.6C11.5 5.1 13 4 15 4c3.8 0 5.4 3.8 3.8 7.5-2.3 4.4-9.8 9-9.8 9z" />
    </svg>
  ),
  luna: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="white">
      <path d="M20 14.5A8.5 8.5 0 119.5 4 7 7 0 0020 14.5z" />
    </svg>
  ),
  sole: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" fill="white" stroke="none" />
      <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
    </svg>
  ),
  zampa: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="white">
      <circle cx="7" cy="9" r="2" />
      <circle cx="12" cy="6.5" r="2.1" />
      <circle cx="17" cy="9" r="2" />
      <path d="M12 12c3 0 5.2 1.8 5.2 4.2 0 2-1.6 3.3-3.6 3.3-.7 0-1.2-.2-1.6-.4-.4.2-.9.4-1.6.4-2 0-3.6-1.3-3.6-3.3C6.8 13.8 9 12 12 12z" />
    </svg>
  )
};

export const CHIAVI_ICONE = Object.keys(ICONE_AVATAR);

function iniziali(nome: string): string {
  const parti = nome.trim().split(/\s+/);
  const prime = parti.slice(0, 2).map((p) => p[0]?.toUpperCase() || "");
  return prime.join("") || "?";
}

export default function Avatar({
  avatar,
  nome,
  size = "md"
}: {
  avatar?: AvatarData | null;
  nome: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensioni = { sm: "w-7 h-7", md: "w-9 h-9", lg: "w-16 h-16" }[size];
  const iconaDim = { sm: "w-3.5 h-3.5", md: "w-4.5 h-4.5", lg: "w-8 h-8" }[size];
  const testoDim = { sm: "text-[10px]", md: "text-xs", lg: "text-xl" }[size];

  const colore = avatar?.colore || "#3D6DFF";
  const Icona = avatar?.icona ? ICONE_AVATAR[avatar.icona] : null;

  return (
    <div
      className={`${dimensioni} rounded-full flex items-center justify-center shrink-0 shadow-token-sm`}
      style={{ backgroundColor: colore }}
    >
      {Icona ? <Icona className={iconaDim} /> : <span className={`text-white font-medium ${testoDim}`}>{iniziali(nome)}</span>}
    </div>
  );
}
