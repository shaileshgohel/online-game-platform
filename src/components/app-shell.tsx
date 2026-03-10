import type { ReactNode } from "react";

import clsx from "clsx";

import { LogoMark } from "./logo-mark";

export function AppShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-stage-gradient text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-pink-400/10 blur-3xl" />
      </div>

      <div className={clsx("relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8", className)}>
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="font-display text-xl font-bold tracking-tight">PulseQuiz Live</p>
              <p className="text-sm text-slate-300">Fast-paced quiz rooms for meetups, classrooms, and team games.</p>
            </div>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 sm:block">
            Host on one screen. Project on another. Players answer on their own devices.
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
