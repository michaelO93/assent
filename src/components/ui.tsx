import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-2xl border border-line bg-surface p-6 shadow-sm ${className}`} {...props} />;
}

type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "secondary" | "danger" | "ghost" };

const variants = {
  primary: "bg-brand text-white hover:bg-brand-strong disabled:bg-brand/50",
  secondary: "border border-line bg-surface text-ink hover:bg-muted",
  danger: "border border-danger/30 bg-surface text-danger hover:bg-danger/10",
  ghost: "text-ink-soft hover:text-ink hover:bg-muted",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: keyof typeof variants;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}

const tones = {
  neutral: "bg-muted text-ink-soft",
  good: "bg-good/12 text-good",
  bad: "bg-danger/10 text-danger",
  warn: "bg-warn/15 text-warn",
  brand: "bg-brand/10 text-brand",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <code className={`break-all font-mono text-xs text-ink-soft ${className}`}>{children}</code>;
}

export function short(hex: string, size = 6) {
  return hex.length > size * 2 + 2 ? `${hex.slice(0, size + 2)}…${hex.slice(-size)}` : hex;
}

export function formatDate(seconds: number) {
  return new Date(seconds * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function Spinner() {
  return <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}
