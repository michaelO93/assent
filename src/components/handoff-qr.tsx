"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toHex } from "viem";
import { Spinner } from "@/components/ui";

type Approved = { consentId: string; subject: string };

/**
 * Shows a QR code the parent scans with their own phone, then polls the registry until the
 * parent's approval lands. The request id is random and lives only on this device.
 */
export function HandoffQr({ app, onApproved }: { app: string; onApproved: (a: Approved) => void }) {
  const [requestId] = useState(() => toHex(crypto.getRandomValues(new Uint8Array(32))));
  const [qr, setQr] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const link = `${window.location.origin}/consent?${new URLSearchParams({ app, request: requestId })}`;
    setUrl(link);
    QRCode.toDataURL(link, { margin: 1, width: 360, errorCorrectionLevel: "M" }).then(setQr, () => setQr(null));
  }, [app, requestId]);

  useEffect(() => {
    let stopped = false;
    async function poll() {
      try {
        const res = await fetch(`/api/handoff/${requestId}?app=${encodeURIComponent(app)}`, { cache: "no-store" });
        const data = await res.json();
        if (!stopped && data.status === "approved") return onApproved({ consentId: data.consentId, subject: data.subject });
      } catch {
        // network blip: keep polling
      }
      if (!stopped) timer = setTimeout(poll, 3000);
    }
    let timer = setTimeout(poll, 3000);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [app, requestId, onApproved]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl border border-line bg-white p-3">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR code for your grown-up to scan" width={180} height={180} />
        ) : (
          <div className="size-[180px]" />
        )}
      </div>
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Spinner /> Waiting for your grown-up&hellip;
      </p>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="text-xs text-ink-soft underline">
          Open the request link on this computer instead
        </a>
      )}
    </div>
  );
}
