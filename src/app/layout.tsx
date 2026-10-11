import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARPAC",
  description: "Manager AI per il team"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-base-950 text-ink-100 font-sans antialiased">{children}</body>
    </html>
  );
}
