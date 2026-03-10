"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { LeaderboardCard } from "@/components/leaderboard-card";
import { PlayerAnswerGrid } from "@/components/player-answer-grid";
import { TimerBadge } from "@/components/timer-badge";
import { getSocket } from "@/lib/client/socket";
import { readPlayerSession, writePlayerSession } from "@/lib/client/storage";
import type { PlayerRoomState } from "@/lib/game/types";

export default function JoinRoomPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode.toUpperCase();
  const [nickname, setNickname] = useState("");
  const [roomState, setRoomState] = useState<PlayerRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [joining, setJoining] = useState(false);
  const [pendingChoiceIndex, setPendingChoiceIndex] = useState<number | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const attemptRestore = () => {
      const session = readPlayerSession(roomCode);
      if (session) {
        setNickname((current) => current || session.nickname);
        setInfoMessage("Trying to restore your player session...");
        setJoining(true);
        socket.emit("room:join", {
          roomCode,
          nickname: session.nickname,
          playerId: session.playerId,
        });
      }
    };

    const handleJoined = (payload: { playerId: string; nickname: string; restored: boolean }) => {
      writePlayerSession(roomCode, {
        playerId: payload.playerId,
        nickname: payload.nickname,
      });
      setNickname(payload.nickname);
      setJoining(false);
      setInfoMessage(payload.restored ? `Welcome back, ${payload.nickname}.` : `Joined as ${payload.nickname}.`);
    };

    const handleRoomState = (payload: PlayerRoomState) => {
      if (payload.roomCode === roomCode) {
        setRoomState(payload);
        if (payload.hasAnswered) {
          setPendingChoiceIndex(null);
        }
      }
    };

    const handleAnswerReceived = (payload: { accepted: boolean }) => {
      if (!payload.accepted) {
        setPendingChoiceIndex(null);
      }
    };

    const handleError = (payload: { code?: string; message?: string }) => {
      if (payload.code === "SESSION_MOVED") {
        setInfoMessage(payload.message ?? "Your session moved to another device.");
        return;
      }

      setJoining(false);
      setPendingChoiceIndex(null);
      setErrorMessage(payload.message ?? "Something went wrong.");
    };

    socket.on("connect", attemptRestore);
    socket.on("room:joined", handleJoined);
    socket.on("room:state", handleRoomState);
    socket.on("answer:received", handleAnswerReceived);
    socket.on("error", handleError);

    attemptRestore();

    return () => {
      socket.off("connect", attemptRestore);
      socket.off("room:joined", handleJoined);
      socket.off("room:state", handleRoomState);
      socket.off("answer:received", handleAnswerReceived);
      socket.off("error", handleError);
    };
  }, [roomCode]);

  const handleJoin = () => {
    if (!nickname.trim()) {
      setErrorMessage("Enter a nickname to join the room.");
      return;
    }

    setErrorMessage("");
    setJoining(true);
    const session = readPlayerSession(roomCode);
    getSocket().emit("room:join", {
      roomCode,
      nickname,
      playerId: session?.playerId,
    });
  };

  const handleSelectChoice = (choiceIndex: number) => {
    if (!roomState || roomState.status !== "inQuestion" || roomState.hasAnswered) {
      return;
    }

    setPendingChoiceIndex(choiceIndex);
    getSocket().emit("answer:submit", {
      roomCode,
      questionIndex: roomState.currentQuestionIndex,
      choiceIndex,
    });
  };

  return (
    <AppShell className="max-w-5xl">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {!roomState ? (
          <section className="glass-panel rounded-[36px] p-6 sm:p-8">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Room {roomCode}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-white">Join the live quiz</h1>
            <p className="mt-3 text-slate-300">
              Enter a nickname, then keep this device focused on the answer buttons while the host shows questions on the main screen.
            </p>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row">
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Nickname"
                className="input-field"
              />
              <button type="button" className="primary-button" disabled={joining} onClick={handleJoin}>
                {joining ? "Joining..." : "Join room"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        ) : null}

        {roomState ? (
          <section className="glass-panel rounded-[36px] p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">{roomState.quizTitle}</p>
                <h1 className="mt-2 font-display text-4xl font-semibold text-white">{roomState.nickname}</h1>
                <p className="mt-2 text-slate-300">
                  Score {roomState.scoreTotal}
                  {roomState.rank ? ` - rank #${roomState.rank}` : ""}
                </p>
              </div>
              {roomState.status === "inQuestion" ? (
                <TimerBadge startedAt={roomState.startedAt} durationMs={roomState.durationMs} />
              ) : null}
            </div>

            {roomState.status === "lobby" ? (
              <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6 text-center text-slate-200">
                <p className="font-display text-3xl font-semibold text-white">You are in the room.</p>
                <p className="mt-3 text-slate-300">Stay ready. The answer buttons will appear here as soon as the host starts the game.</p>
              </div>
            ) : null}

            {roomState.status === "inQuestion" ? (
              <div className="space-y-5">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm uppercase tracking-[0.26em] text-slate-300">
                  Question {roomState.currentQuestionIndex + 1} of {roomState.totalQuestions}
                </div>
                <PlayerAnswerGrid
                  choiceCount={roomState.choiceCount}
                  disabled={roomState.hasAnswered || pendingChoiceIndex !== null}
                  selectedChoiceIndex={roomState.selectedChoiceIndex}
                  pendingChoiceIndex={pendingChoiceIndex}
                  onSelect={handleSelectChoice}
                />
                {roomState.hasAnswered || pendingChoiceIndex !== null ? (
                  <div className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-4 text-center text-cyan-50">
                    Answer received. Waiting for the reveal.
                  </div>
                ) : null}
              </div>
            ) : null}

            {roomState.status === "reveal" && roomState.reveal ? (
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
                  <div className="mb-4 flex items-center gap-3 text-cyan-100">
                    <Trophy className="h-5 w-5" />
                    Round result
                  </div>
                  <h2 className="font-display text-4xl font-semibold text-white">
                    {roomState.reveal.isCorrect ? "Correct!" : "Not this time"}
                  </h2>
                  <p className="mt-4 text-lg text-slate-300">
                    +{roomState.reveal.pointsAwarded} points this round. Total score: {roomState.reveal.scoreTotal}.
                  </p>
                  <p className="mt-3 text-sm uppercase tracking-[0.24em] text-slate-400">
                    Rank #{roomState.reveal.rank ?? roomState.rank ?? "-"}
                  </p>
                </div>
                <LeaderboardCard
                  entries={roomState.reveal.leaderboard}
                  currentPlayerId={roomState.playerId}
                  title="Live leaderboard"
                />
              </div>
            ) : null}

            {roomState.status === "ended" ? (
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">Game complete</p>
                  <h2 className="mt-2 font-display text-4xl font-semibold text-white">Final score: {roomState.scoreTotal}</h2>
                  <p className="mt-3 text-slate-300">You finished at rank #{roomState.rank ?? "-"} in room {roomState.roomCode}.</p>
                </div>
                <LeaderboardCard
                  entries={roomState.finalLeaderboard}
                  currentPlayerId={roomState.playerId}
                  title="Final leaderboard"
                />
              </div>
            ) : null}
          </section>
        ) : null}

        {infoMessage ? (
          <div className="rounded-[28px] border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
            {infoMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[28px] border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}