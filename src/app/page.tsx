"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { ArrowRight, Play, Upload, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import sampleQuiz from "../../data/sample-quiz.json";
import { AppShell } from "@/components/app-shell";
import { getSocket } from "@/lib/client/socket";
import { writeHostToken } from "@/lib/client/storage";
import { normalizeQuiz } from "@/lib/game/quiz";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sample" | "custom">("sample");
  const [customQuizText, setCustomQuizText] = useState(JSON.stringify(sampleQuiz, null, 2));
  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleCreated = (payload: { roomCode: string; hostToken: string }) => {
      writeHostToken(payload.roomCode, payload.hostToken);
      router.push(`/host/${payload.roomCode}?token=${payload.hostToken}`);
    };

    const handleError = (payload: { message?: string }) => {
      setCreating(false);
      setErrorMessage(payload.message ?? "Unable to create a room.");
    };

    socket.on("room:created", handleCreated);
    socket.on("error", handleError);

    return () => {
      socket.off("room:created", handleCreated);
      socket.off("error", handleError);
    };
  }, [router]);

  const previewQuiz = (() => {
    try {
      return mode === "sample" ? normalizeQuiz(sampleQuiz) : normalizeQuiz(JSON.parse(customQuizText));
    } catch {
      return null;
    }
  })();

  const handleQuizUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    setCustomQuizText(text);
    setMode("custom");
  };

  const handleCreateRoom = () => {
    try {
      const quiz = mode === "sample" ? normalizeQuiz(sampleQuiz) : normalizeQuiz(JSON.parse(customQuizText));
      setErrorMessage("");
      setCreating(true);
      getSocket().emit("room:create", { quiz });
    } catch (error) {
      setCreating(false);
      setErrorMessage(error instanceof Error ? error.message : "Quiz JSON is invalid.");
    }
  };

  const handleJoinRoom = () => {
    const sanitizedCode = joinCode.trim().toUpperCase();
    if (!sanitizedCode) {
      setErrorMessage("Enter a room code to join.");
      return;
    }

    router.push(`/join/${sanitizedCode}`);
  };

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel rounded-[36px] p-6 sm:p-8">
          <div className="mb-8 max-w-2xl">
            <p className="mb-3 text-sm uppercase tracking-[0.28em] text-cyan-200">Live multiplayer quiz rooms</p>
            <h1 className="font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Run fast, playful quiz sessions with a host laptop and a crowd of phones.
            </h1>
            <p className="mt-4 text-lg text-slate-300">
              PulseQuiz Live gives hosts a simple control room, a projector-friendly main screen, QR-based joining,
              and speed-weighted scoring that rewards quick thinking.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5">
              <p className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-400">Real time</p>
              <p className="font-display text-2xl font-semibold text-white">Socket.IO powered</p>
              <p className="mt-2 text-sm text-slate-300">Authoritative timing, room state sync, and live reveal updates.</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5">
              <p className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-400">Host flow</p>
              <p className="font-display text-2xl font-semibold text-white">Create, project, run</p>
              <p className="mt-2 text-sm text-slate-300">Start with the sample quiz or paste your own JSON format.</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5">
              <p className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-400">Player UX</p>
              <p className="font-display text-2xl font-semibold text-white">Big touch targets</p>
              <p className="mt-2 text-sm text-slate-300">Phones only see the answer buttons while the question stays on the main screen.</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6">
          <section className="glass-panel rounded-[36px] p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">Host a session</p>
                <h2 className="font-display text-3xl font-semibold text-white">Create a room</h2>
              </div>
              <Play className="h-7 w-7 text-cyan-200" />
            </div>

            <div className="mb-5 flex gap-3">
              <button
                type="button"
                onClick={() => setMode("sample")}
                className={mode === "sample" ? "primary-button" : "secondary-button"}
              >
                Sample quiz
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={mode === "custom" ? "primary-button" : "secondary-button"}
              >
                Custom JSON
              </button>
            </div>

            {mode === "custom" ? (
              <div className="space-y-4">
                <label className="secondary-button cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Upload JSON
                  <input type="file" accept="application/json" className="hidden" onChange={handleQuizUpload} />
                </label>
                <textarea
                  value={customQuizText}
                  onChange={(event) => setCustomQuizText(event.target.value)}
                  className="input-field textarea-field"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5 text-slate-200">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Loaded sample</p>
                <p className="mt-2 font-display text-2xl font-semibold text-white">{previewQuiz?.title}</p>
                <p className="mt-3 text-sm text-slate-300">
                  10 questions with a mix of 2-choice and 4-choice rounds, ready for a quick live demo.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Quiz summary</p>
                <p className="mt-1 font-semibold text-white">
                  {previewQuiz ? `${previewQuiz.questions.length} questions ready` : "Invalid quiz JSON"}
                </p>
              </div>
              <button type="button" className="primary-button" disabled={creating} onClick={handleCreateRoom}>
                {creating ? "Creating room..." : "Create live room"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          <section className="glass-panel rounded-[36px] p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-orange-200">Join a session</p>
                <h2 className="font-display text-3xl font-semibold text-white">Player entry</h2>
              </div>
              <Users className="h-7 w-7 text-orange-200" />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="input-field"
              />
              <button type="button" className="primary-button" onClick={handleJoinRoom}>
                Join room
              </button>
            </div>
          </section>

          {errorMessage ? (
            <div className="rounded-[28px] border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}