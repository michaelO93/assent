"use client";

import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, Mono, short } from "@/components/ui";
import { getApp, type AppManifest } from "@/lib/apps";
import { AGE_BANDS } from "@/lib/consent";

// A stand-in for a third-party children's app that integrates Assent. It stores only the
// consent id and the per-app pseudonym, and re-checks the registry before unlocking features.

type Saved = { consentId: string; subject: string };
type Verdict = { valid: boolean; ageBand: number | null; scopes: string[]; revokedAt: number | null };

const storageKey = (slug: string) => `demo-app:${slug}`;

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export default function DemoAppPage({ params }: { params: Promise<{ app: string }> }) {
  const { app: slug } = use(params);
  const app = getApp(slug);
  if (!app) return <Card>Unknown demo app.</Card>;
  return (
    <Suspense>
      <DemoApp app={app} />
    </Suspense>
  );
}

function DemoApp({ app }: { app: AppManifest }) {
  const router = useRouter();
  const params = useSearchParams();
  const [saved, setSaved] = useState<Saved | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Handle the redirect back from Assent, checking the state we sent out.
  useEffect(() => {
    const consentId = params.get("consentId");
    const subject = params.get("subject");
    const state = params.get("state");
    if (consentId && subject && state && state === load<string>(`${storageKey(app.slug)}:state`)) {
      save(storageKey(app.slug), { consentId, subject });
      save(`${storageKey(app.slug)}:state`, null);
      router.replace(`/demo/${app.slug}`);
    }
    setSaved(load<Saved>(storageKey(app.slug)));
    setLoaded(true);
  }, [app.slug, params, router]);

  const check = useCallback(async () => {
    if (!saved) return setVerdict(null);
    const q = new URLSearchParams({ app: app.slug, consentId: saved.consentId, subject: saved.subject });
    const res = await fetch(`/api/verify?${q}`, { cache: "no-store" });
    if (res.ok) setVerdict(await res.json());
  }, [app.slug, saved]);

  useEffect(() => {
    void check();
    if (!saved) return;
    const id = setInterval(check, 4000);
    return () => clearInterval(id);
  }, [check, saved]);

  function askParent() {
    const state = crypto.randomUUID();
    save(`${storageKey(app.slug)}:state`, state);
    const q = new URLSearchParams({ app: app.slug, return: `/demo/${app.slug}`, state });
    window.location.assign(`/consent?${q}`);
  }

  function signOut() {
    save(storageKey(app.slug), null);
    setSaved(null);
    setVerdict(null);
  }

  if (!loaded) return null;

  const revoked = saved && verdict && !verdict.valid;
  const allowed = !!verdict?.valid;

  return (
    <div className="space-y-6">
      <p className="text-xs uppercase tracking-wide text-ink-soft">Demo third-party app &middot; integrates Assent</p>
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 text-white" style={{ background: app.accent }}>
          <div>
            <h1 className="text-2xl font-bold">{app.name}</h1>
            <p className="text-sm opacity-90">{app.tagline}</p>
          </div>
          {allowed && <Badge tone="neutral">Grown-up approved</Badge>}
        </div>

        <div className="p-6">
          {!saved && (
            <div className="mx-auto max-w-md space-y-4 py-8 text-center">
              <p className="text-5xl">🖍️</p>
              <h2 className="text-xl font-semibold">Ask a grown-up to say yes</h2>
              <p className="text-sm text-ink-soft">
                Before you can play, a parent or carer needs to give permission. They&rsquo;ll see exactly what{" "}
                {app.name} wants to do.
              </p>
              <Button onClick={askParent} className="w-full sm:w-auto">I&rsquo;m the grown-up: review the request</Button>
              <p className="text-xs text-ink-soft">
                In production the child&rsquo;s device shows a QR code and the request opens on the parent&rsquo;s phone.
              </p>
            </div>
          )}

          {saved && !verdict && <p className="py-8 text-center text-sm text-ink-soft">Checking permission&hellip;</p>}

          {revoked && (
            <div className="mx-auto max-w-md space-y-4 py-8 text-center">
              <p className="text-5xl">🔒</p>
              <h2 className="text-xl font-semibold">Your grown-up turned off {app.name}</h2>
              <p className="text-sm text-ink-soft">
                Permission was withdrawn{verdict.revokedAt ? "" : " or has expired"}. {app.name} has stopped using this
                child&rsquo;s data and must now delete it under its retention policy.
              </p>
              <Button variant="secondary" onClick={signOut}>Start over</Button>
            </div>
          )}

          {allowed && <Playground app={app} scopes={verdict.scopes} />}
        </div>
      </div>

      {saved && (
        <Card className="space-y-2 text-sm">
          <h2 className="font-semibold">What {app.name} knows about this child</h2>
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[max-content_1fr]">
            <dt className="text-ink-soft">Pseudonym</dt>
            <dd><Mono>{short(saved.subject, 10)}</Mono></dd>
            <dt className="text-ink-soft">Age band</dt>
            <dd>{verdict?.ageBand != null ? AGE_BANDS[verdict.ageBand]?.label : "-"}</dd>
            <dt className="text-ink-soft">Consent</dt>
            <dd><Mono>{short(saved.consentId, 10)}</Mono></dd>
            <dt className="text-ink-soft">Status</dt>
            <dd>{verdict ? (verdict.valid ? <Badge tone="good">Valid</Badge> : <Badge tone="bad">Not valid</Badge>) : "…"}</dd>
          </dl>
          <p className="text-xs text-ink-soft">Re-checked against the registry every 4 seconds.</p>
        </Card>
      )}
    </div>
  );
}

function Playground({ app, scopes }: { app: AppManifest; scopes: string[] }) {
  const optional = app.scopes.filter((s) => !s.required);
  return (
    <div className="space-y-5">
      {app.slug === "doodle-quest" ? <DrawingCanvas /> : <MathPractice />}
      <div className="flex flex-wrap gap-2">
        {optional.map((s) => {
          const on = scopes.includes(s.id);
          return (
            <span
              key={s.id}
              title={on ? "Allowed by your grown-up" : "Your grown-up didn't allow this"}
              className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-good/40 bg-good/10 text-good" : "border-line text-ink-soft line-through"}`}
            >
              {on ? "✓" : "🔒"} {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function DrawingCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState("#f97316");

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * e.currentTarget.width, ((e.clientY - r.top) / r.height) * e.currentTarget.height];
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["#f97316", "#3b5bdb", "#16a34a", "#db2777", "#1d2433"].map((c) => (
          <button
            key={c}
            aria-label={`Colour ${c}`}
            onClick={() => setColor(c)}
            className={`size-8 rounded-full border-2 ${color === c ? "border-ink" : "border-transparent"}`}
            style={{ background: c }}
          />
        ))}
        <Button variant="ghost" className="ml-auto" onClick={() => {
          const ctx = ref.current?.getContext("2d");
          ctx?.clearRect(0, 0, ref.current!.width, ref.current!.height);
        }}>Clear</Button>
      </div>
      <canvas
        ref={ref}
        width={800}
        height={360}
        className="h-64 w-full touch-none rounded-2xl border border-line bg-white sm:h-80"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = e.currentTarget.getContext("2d")!;
          const [x, y] = point(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = e.currentTarget.getContext("2d")!;
          const [x, y] = point(e);
          ctx.lineTo(x, y);
          ctx.strokeStyle = color;
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.stroke();
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerLeave={() => (drawing.current = false)}
      />
    </div>
  );
}

function MathPractice() {
  const [q, setQ] = useState(() => newQuestion());
  const [answer, setAnswer] = useState("");
  const [score, setScore] = useState(0);
  return (
    <form
      className="mx-auto max-w-sm space-y-4 py-6 text-center"
      onSubmit={(e) => {
        e.preventDefault();
        if (Number(answer) === q[0] + q[1]) setScore((s) => s + 1);
        setQ(newQuestion());
        setAnswer("");
      }}
    >
      <p className="text-4xl font-bold">{q[0]} + {q[1]} = ?</p>
      <input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        inputMode="numeric"
        className="w-32 rounded-xl border border-line bg-surface px-3 py-2 text-center text-xl"
      />
      <p className="text-sm text-ink-soft">Score: {score}</p>
    </form>
  );
}

function newQuestion(): [number, number] {
  return [Math.ceil(Math.random() * 20), Math.ceil(Math.random() * 20)];
}
