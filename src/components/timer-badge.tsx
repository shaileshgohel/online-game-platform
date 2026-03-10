"use client";

import { useEffect, useState } from "react";

function formatSeconds(value: number) {
  const totalSeconds = Math.max(0, Math.ceil(value / 1000));
  return `${totalSeconds}s`;
}

export function TimerBadge({
  startedAt,
  durationMs,
}: {
  startedAt: number | null;
  durationMs: number;
}) {
  const [remainingMs, setRemainingMs] = useState(durationMs);

  useEffect(() => {
    if (!startedAt || durationMs <= 0) {
      setRemainingMs(durationMs);
      return;
    }

    const tick = () => {
      const next = Math.max(0, durationMs - (Date.now() - startedAt));
      setRemainingMs(next);
    };

    tick();
    const interval = window.setInterval(tick, 120);
    return () => window.clearInterval(interval);
  }, [startedAt, durationMs]);

  const progress = durationMs > 0 ? remainingMs / durationMs : 0;

  return (
    <div className="min-w-[180px] rounded-3xl border border-white/10 bg-white/8 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
        <span>Timer</span>
        <span className="font-display text-lg font-semibold text-white">{formatSeconds(remainingMs)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-cyan-300 via-cyan-200 to-orange-300 transition-[width] duration-100"
          style={{ width: `${Math.max(progress * 100, 2)}%` }}
        />
      </div>
    </div>
  );
}
