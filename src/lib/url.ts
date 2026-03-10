export function getAppUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  }

  return process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function buildJoinUrl(appUrl: string, roomCode: string) {
  return new URL(`/join/${roomCode}`, appUrl).toString();
}

export function buildStageUrl(appUrl: string, roomCode: string) {
  return new URL(`/stage/${roomCode}`, appUrl).toString();
}
