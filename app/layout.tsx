import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Target 500 - Communes de France",
  description: "Cartographie dynamique des maires et communes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}