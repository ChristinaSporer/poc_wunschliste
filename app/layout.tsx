import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Geschenke-Manager PoC",
  description: "Proof-of-Concept als Next.js Web-App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <header className="site-header">
          <nav className="site-nav">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/people">Personen</Link>
            <Link href="/print">Drucken</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
