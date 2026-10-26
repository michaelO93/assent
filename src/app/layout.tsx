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
    // Same mark as src/app/icon.svg: a parent and child inside a shield.
    <svg width="24" height="24" viewBox="0 0 512 512" aria-hidden>
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4c6ef5" />
          <stop offset="1" stopColor="#6741d9" />
        </linearGradient>
        <clipPath id="logo-shield">
          <path d="M256 104 L388 152 V258 C388 344 332 398 256 426 C180 398 124 344 124 258 V152 Z" />
        </clipPath>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#logo-bg)" />
      <path d="M256 104 L388 152 V258 C388 344 332 398 256 426 C180 398 124 344 124 258 V152 Z" fill="#fff" />
      <g clipPath="url(#logo-shield)">
        <circle cx="226" cy="236" r="38" fill="#5b55e6" />
        <path d="M160 440 v-78 a66 66 0 0 1 132 0 v78 z" fill="#5b55e6" />
        <circle cx="306" cy="286" r="26" fill="#f59f00" stroke="#fff" strokeWidth="8" />
        <path d="M266 440 v-64 a40 40 0 0 1 80 0 v64 z" fill="#f59f00" stroke="#fff" strokeWidth="8" />
      </g>
    </svg>
  );
}
