import clsx from "clsx";

import type { LeaderboardEntry } from "@/lib/game/types";

export function LeaderboardCard({
  entries,
  currentPlayerId,
  title = "Leaderboard",
  className,
}: {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
  title?: string;
  className?: string;
}) {
  return (
    <section className={clsx("glass-panel rounded-[28px] p-5", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-2xl font-semibold text-white">{title}</h3>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
          Top 10
        </span>
      </div>

      <div className="space-y-2">
        {entries.slice(0, 10).map((entry) => (
          <div
            key={entry.playerId}
            className={clsx(
              "flex items-center justify-between rounded-2xl border px-4 py-3 transition",
              currentPlayerId === entry.playerId
                ? "border-cyan-300/50 bg-cyan-300/10"
                : "border-white/8 bg-white/[0.04]",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white">
                {entry.rank}
              </div>
              <div>
                <p className="font-semibold text-white">{entry.nickname}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  {entry.connected ? "Connected" : "Reconnecting"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-xl font-semibold text-white">{entry.scoreTotal}</p>
              <p className="text-xs text-slate-300">+{entry.lastPointsEarned} last round</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
