"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { LiveStage } from "@/components/live-stage";
import { getSocket } from "@/lib/client/socket";
import type { HostRoomState } from "@/lib/game/types";

export default function StageRoomPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode.toUpperCase();
  const [roomState, setRoomState] = useState<HostRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
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

  return (
    <AppShell>
      {roomState ? <LiveStage state={roomState} showQr /> : <div className="glass-panel rounded-[36px] p-8">Loading stage...</div>}
      {errorMessage ? (
        <div className="mt-6 rounded-[28px] border border-rose-300/25 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
          {errorMessage}
        </div>
      ) : null}
    </AppShell>
  );
}