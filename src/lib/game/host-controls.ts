import type { HostRoomState } from "./types";

export type HostActionEvent = "game:start" | "question:next";

export function getPrimaryHostActionLabel(state: HostRoomState | null) {
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

export function getPrimaryHostActionEvent(state: HostRoomState | null): HostActionEvent | null {
  if (!state || state.status === "ended") {
    return null;
  }

  return state.status === "lobby" ? "game:start" : "question:next";
}
