"use client";

import { useEffect, useState } from "react";
import { Check, Copy, X } from "lucide-react";

export function TableQrModal({
  open,
  onClose,
  tableId,
  tableName,
}: {
  open: boolean;
  onClose: () => void;
  tableId: string;
  tableName: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  if (!open) return null;

  const link = origin ? `${origin}/o/${tableId}` : "";
  const qrImageUrl = link
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`
    : "";

  function handleCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-xs p-6 text-center">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">QR &mdash; {tableName}</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {qrImageUrl && (
          <img
            src={qrImageUrl}
            alt={`QR code untuk ${tableName}`}
            className="mx-auto mb-4 rounded-lg border border-surface-border"
            width={200}
            height={200}
          />
        )}

        <p className="mb-3 break-all text-xs text-ink-muted">{link}</p>

        <button
          onClick={handleCopy}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-surface-border py-2.5 text-sm font-medium text-ink hover:bg-surface"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Tersalin!" : "Salin Link"}
        </button>

        <p className="mt-3 text-xs text-ink-muted">
          Print QR ini dan tempel di meja. Tamu tinggal scan buat lihat
          menu &amp; order sendiri dari HP mereka.
        </p>
      </div>
    </div>
  );
}
