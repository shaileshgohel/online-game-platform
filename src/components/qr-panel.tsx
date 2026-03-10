"use client";

import { useEffect, useState } from "react";

import QRCode from "qrcode";

export function QrPanel({
  value,
  title,
  subtitle,
}: {
  value: string;
  title: string;
  subtitle: string;
}) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(value, {
      margin: 1,
      width: 320,
      color: {
        dark: "#07111f",
        light: "#0000",
      },
    }).then((url) => {
      if (!cancelled) {
        setDataUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <section className="glass-panel rounded-[28px] p-5">
      <div className="mb-4">
        <h3 className="font-display text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="rounded-[28px] bg-white p-4 shadow-panel">
          {dataUrl ? (
            <img src={dataUrl} alt="Join room QR code" className="h-40 w-40" />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center text-sm text-slate-500">Generating QR...</div>
          )}
        </div>

        <div className="flex-1 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200">
          <p className="mb-2 uppercase tracking-[0.24em] text-slate-400">Join link</p>
          <p className="break-all font-medium text-white">{value}</p>
        </div>
      </div>
    </section>
  );
}
