import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Assent: verifiable parental consent",
  description:
    "Parents give apps verifiable, revocable consent for their children's data, without handing over the child's identity.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh font-sans antialiased`}>
        <header className="border-b border-line bg-surface/80 backdrop-blur">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm">
            <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
              <Logo />
              Assent
            </Link>
            <div className="ml-auto flex flex-wrap gap-x-5 gap-y-1 text-ink-soft">
              <Link className="hover:text-ink" href="/parent">For parents</Link>
              <Link className="hover:text-ink" href="/demo/doodle-quest">Demo app</Link>
              <Link className="hover:text-ink" href="/audit">Audit</Link>
              <Link className="hover:text-ink" href="/legal">Legal</Link>
              <Link className="hover:text-ink" href="/developers">Developers</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-ink-soft">
          Hackathon prototype for the BLI Legal Tech Hackathon 2. Identity checks are simulated; runs on a test network.
        </footer>
      </body>
    </html>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect width="24" height="24" rx="7" fill="var(--brand)" />
      <path d="M7 12.5l3.2 3.2L17 9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
