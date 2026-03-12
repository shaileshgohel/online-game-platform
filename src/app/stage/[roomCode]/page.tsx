"use client";

import { useEffect, useState } from "react";
import { MonitorUp, Play, Square } from "lucide-react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { LiveStage } from "@/components/live-stage";
import { getSocket } from "@/lib/client/socket";
import { readHostToken } from "@/lib/client/storage";
import { getPrimaryHostActionEvent, getPrimaryHostActionLabel } from "@/lib/game/host-controls";
import type { HostRoomState } from "@/lib/game/types";

export default function StageRoomPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode.toUpperCase();
  const [roomState, setRoomState] = useState<HostRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [hostToken, setHostToken] = useState("");

  useEffect(() => {
    setHostToken(readHostToken(roomCode) ?? "");

    const socket = getSocket();
    const watchRoom = () => {
      socket.emit("room:watch", {
        roomCode,
        role: "stage",
      });
    };

    const handleRoomState = (payload: HostRoomState) => {
      if (payload.roomCode === roomCode) {
        setRoomState(payload);
      }
    };

    const handleError = (payload: { message?: string }) => {
      setErrorMessage(payload.message ?? "Unable to load the stage view.");
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
  }, [roomCode]);

  const sendHostEvent = (eventName: "game:start" | "question:next" | "game:end") => {
    if (!hostToken) {
      return;
    }

    if (eventName === "question:next" && roomState?.status === "reveal") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    getSocket().emit(eventName, {
      roomCode,
      hostToken,
    });
  };

  const primaryActionEvent = getPrimaryHostActionEvent(roomState);

  return (
    <AppShell>
      <div className="space-y-6">
        {roomState ? (
          <LiveStage state={roomState} showQr />
        ) : (
          <div className="glass-panel rounded-[36px] p-8 text-slate-300">Loading stage...</div>
        )}

        {roomState && hostToken ? (
          <section className="glass-panel rounded-[32px] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">Stage controls</p>
                <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">Advance from the projector</h2>
              </div>
              <MonitorUp className="h-7 w-7 text-cyan-200" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="primary-button"
                disabled={!primaryActionEvent}
                onClick={() => primaryActionEvent && sendHostEvent(primaryActionEvent)}
              >
                <Play className="h-4 w-4" />
                {getPrimaryHostActionLabel(roomState)}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={roomState.status === "ended"}
                onClick={() => sendHostEvent("game:end")}
              >
                <Square className="h-4 w-4" />
                End game
              </button>
            </div>
          </section>
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
