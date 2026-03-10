"use client";

import { io, type Socket } from "socket.io-client";

let socketSingleton: Socket | null = null;

export function getSocket() {
  if (!socketSingleton) {
    socketSingleton = io({
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }

  return socketSingleton;
}
