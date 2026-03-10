"use client";

import { useEffect, useState } from "react";
import { Link2, MonitorUp, Play, Square, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { LiveStage } from "@/components/live-stage";
import { QrPanel } from "@/components/qr-panel";
import { getSocket } from "@/lib/client/socket";
import { readHostToken, writeHostToken } from "@/lib/client/storage";
import type { HostRoomState } from "@/lib/game/types";

function nextActionLabel(state: HostRoomState | null) {
  if (!state) {
    return "Loading...";
  }

  if (state.status === "lobby") {
    return "Start game";
  }

  if (state.status === "inQuestion") {
    return "Reveal answer";
  }

  if (state.status === "reveal") {
    return state.currentQuestionIndex >= state.totalQuestions - 1 ? "Show final results" : "Next question";
  }

  return "Game finished";
}

export default function HostRoomPage() {
  const params = useParams<{ roomCode: string }>();
  const searchParams = useSearchParams();
  const tokenFromQuery = searchParams.get("token");
  const roomCode = params.roomCode.toUpperCase();
  const [roomState, setRoomState] = useState<HostRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [hostToken, setHostToken] = useState("");

  useEffect(() => {
    const resolvedToken = tokenFromQuery ?? readHostToken(roomCode) ?? "";

    if (tokenFromQuery) {
      writeHostToken(roomCode, tokenFromQuery);
    }

    setHostToken(resolvedToken);

    if (!resolvedToken) {
      setErrorMessage("Missing host session token. Create a new room from the home page.");
      return;
    }

    const socket = getSocket();
    const watchRoom = () => {
      socket.emit("room:watch", {
        roomCode,
        role: "host",
        hostToken: resolvedToken,
      });
    };

    const handleRoomState = (payload: HostRoomState) => {
      if (payload.roomCode === roomCode) {
        setRoomState(payload);
      }
    };

    const handleError = (payload: { message?: string }) => {
      setErrorMessage(payload.message ?? "Unable to load the host room.");
    };

    socket.on("connect", watchRoom);
    socket.on("room:state", handleRoomState);
    socket.on("error", handleError);

    watchRoom();

    return () => {
      socket.off("connect", watchRoom);
      socket.off("room:state", handleRoomState);
      socket.off("error", handleError);
    };
  }, [roomCode, tokenFromQuery]);

  const sendHostEvent = (eventName: "game:start" | "question:next" | "game:end") => {
    if (!hostToken) {
      return;
    }

    getSocket().emit(eventName, {
      roomCode,
      hostToken,
    });
  };

  return (
    <AppShell>
      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="space-y-6">
          {roomState ? (
            <LiveStage state={roomState} />
          ) : (
            <div className="glass-panel rounded-[36px] p-8 text-slate-300">Loading host room...</div>
          )}
        </div>

        <div className="space-y-6">
          {roomState ? (
            <QrPanel
              value={roomState.joinUrl}
              title="Invite players"
              subtitle="Share this join link or put the QR code on the projector before you start."
            />
          ) : null}

          <section className="glass-panel rounded-[36px] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">Host controls</p>
                <h2 className="font-display text-3xl font-semibold text-white">Run the room</h2>
              </div>
              <MonitorUp className="h-7 w-7 text-cyan-200" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="primary-button"
                disabled={!roomState || roomState.status === "ended"}
                onClick={() => sendHostEvent(roomState?.status === "lobby" ? "game:start" : "question:next")}
              >
                <Play className="h-4 w-4" />
                {nextActionLabel(roomState)}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={!roomState || roomState.status === "ended"}
                onClick={() => sendHostEvent("game:end")}
              >
                <Square className="h-4 w-4" />
                End game
              </button>
              {roomState ? (
                <Link href={roomState.stageUrl} target="_blank" className="secondary-button sm:col-span-2">
                  <Link2 className="h-4 w-4" />
                  Open projector screen
                </Link>
              ) : null}
            </div>
          </section>

          <section className="glass-panel rounded-[36px] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-orange-200">Players</p>
                <h2 className="font-display text-3xl font-semibold text-white">Room roster</h2>
              </div>
              <Users className="h-7 w-7 text-orange-200" />
            </div>

            <div className="space-y-3">
              {roomState?.players.length ? (
                roomState.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-white">{player.nickname}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {player.connected ? "Connected" : "Disconnected"}
                        {player.hasAnsweredCurrentQuestion ? " - answered" : ""}
                      </p>
                    </div>
                    <div className="font-display text-xl font-semibold text-white">{player.scoreTotal}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 px-4 py-6 text-slate-400">
                  Waiting for players to join this room.
                </div>
              )}
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