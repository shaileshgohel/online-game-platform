"use client";

export interface StoredPlayerSession {
  playerId: string;
  nickname: string;
}

const HOST_PREFIX = "pulsequiz:host:";
const PLAYER_PREFIX = "pulsequiz:player:";

function getItem(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

function setItem(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, value);
}

export function readHostToken(roomCode: string) {
  return getItem(`${HOST_PREFIX}${roomCode.toUpperCase()}`);
}

export function writeHostToken(roomCode: string, token: string) {
  setItem(`${HOST_PREFIX}${roomCode.toUpperCase()}`, token);
}

export function readPlayerSession(roomCode: string): StoredPlayerSession | null {
  const raw = getItem(`${PLAYER_PREFIX}${roomCode.toUpperCase()}`);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredPlayerSession;
    if (!parsed.playerId || !parsed.nickname) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writePlayerSession(roomCode: string, session: StoredPlayerSession) {
  setItem(`${PLAYER_PREFIX}${roomCode.toUpperCase()}`, JSON.stringify(session));
}
