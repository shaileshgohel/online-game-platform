import type { Server as SocketIOServer, Socket } from "socket.io";

import { normalizeQuiz } from "../lib/game/quiz";
import { getAppUrl } from "../lib/url";
import { GameError, GameStore, type PhaseTransition } from "./gameStore";
import { buildHostRoomState, buildPlayerRoomState } from "./snapshots";

const JOIN_LIMIT = 6;
const JOIN_WINDOW_MS = 10000;

function viewerChannel(roomCode: string) {
  return `room:${roomCode}:viewers`;
}

function participantChannel(roomCode: string) {
  return `room:${roomCode}:participants`;
}

function emitError(socket: Socket, error: unknown) {
  if (error instanceof GameError) {
    socket.emit("error", { code: error.code, message: error.message });
    return;
  }

  if (error instanceof Error) {
    socket.emit("error", { code: "BAD_REQUEST", message: error.message });
    return;
  }

  socket.emit("error", {
    code: "INTERNAL_ERROR",
    message: "Something unexpected happened.",
  });
}

function leaveTrackedRooms(socket: Socket) {
  const session = socket.data.session as { roomCode?: string } | undefined;
  const roomCode = session?.roomCode;

  if (!roomCode) {
    return;
  }

  socket.leave(viewerChannel(roomCode));
  socket.leave(participantChannel(roomCode));
}

export function attachQuizGameSocketServer(io: SocketIOServer) {
  const appUrl = getAppUrl();
  const joinAttempts = new Map<string, { count: number; windowStartedAt: number }>();

  let store!: GameStore;

  const broadcastRoomState = (roomCode: string) => {
    const room = store.getRoom(roomCode);
    if (!room) {
      return;
    }

    io.to(viewerChannel(room.code)).emit("room:state", buildHostRoomState(room, appUrl, "stage"));

    for (const player of room.players.values()) {
      if (!player.socketId) {
        continue;
      }

      const snapshot = buildPlayerRoomState(room, player.id);
      if (snapshot) {
        io.to(player.socketId).emit("room:state", snapshot);
      }
    }
  };

  const emitTransitionEvents = (transition: PhaseTransition) => {
    const room = transition.room;
    const currentQuestion = room.quiz.questions[room.currentQuestionIndex];

    if (transition.type === "started" && currentQuestion) {
      const payload = {
        questionIndex: room.currentQuestionIndex,
        durationMs: room.questionDurationMs,
        startedAt: room.questionStartedAt,
        choiceCount: currentQuestion.choices.length,
      };

      if (room.currentQuestionIndex === 0) {
        io.to(viewerChannel(room.code)).emit("game:started", {
          roomCode: room.code,
          questionIndex: room.currentQuestionIndex,
        });
        io.to(participantChannel(room.code)).emit("game:started", {
          roomCode: room.code,
          questionIndex: room.currentQuestionIndex,
        });
      }

      io.to(viewerChannel(room.code)).emit("question:started", payload);
      io.to(participantChannel(room.code)).emit("question:started", payload);
    }

    if (transition.type === "reveal" && room.lastReveal) {
      const payload = {
        correctIndex: room.lastReveal.correctIndex,
        leaderboard: room.lastReveal.leaderboard.slice(0, 10),
        stats: room.lastReveal.stats,
      };

      io.to(viewerChannel(room.code)).emit("question:reveal", payload);
      io.to(participantChannel(room.code)).emit("question:reveal", payload);
      io.to(viewerChannel(room.code)).emit("leaderboard:update", {
        leaderboard: room.lastReveal.leaderboard.slice(0, 10),
      });
      io.to(participantChannel(room.code)).emit("leaderboard:update", {
        leaderboard: room.lastReveal.leaderboard.slice(0, 10),
      });
    }

    if (transition.type === "ended") {
      const finalLeaderboard = buildHostRoomState(room, appUrl, "stage").finalLeaderboard.slice(0, 10);
      io.to(viewerChannel(room.code)).emit("leaderboard:update", { leaderboard: finalLeaderboard });
      io.to(participantChannel(room.code)).emit("leaderboard:update", { leaderboard: finalLeaderboard });
    }

    broadcastRoomState(room.code);
  };

  store = new GameStore((roomCode) => {
    try {
      const transition = store.revealCurrentQuestion(roomCode);
      if (transition) {
        emitTransitionEvents(transition);
      }
    } catch {
      // Ignore stale timers after a manual reveal or end.
    }
  });

  io.on("connection", (socket) => {
    socket.on("room:create", (payload?: { quiz?: unknown }) => {
      try {
        const quiz = normalizeQuiz(payload?.quiz);
        const room = store.createRoom(quiz, socket.id);

        socket.emit("room:created", {
          roomCode: room.code,
          hostToken: room.hostToken,
          joinUrl: `${appUrl}/join/${room.code}`,
        });
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on("room:watch", (payload: { roomCode: string; role: "host" | "stage"; hostToken?: string }) => {
      try {
        const roomCode = payload.roomCode.toUpperCase();
        leaveTrackedRooms(socket);
        socket.join(viewerChannel(roomCode));

        const room =
          payload.role === "host"
            ? store.attachHost(roomCode, payload.hostToken ?? "", socket.id)
            : store.getRoom(roomCode);

        if (!room) {
          throw new GameError("ROOM_NOT_FOUND", "That room could not be found.");
        }

        socket.data.session = {
          type: payload.role,
          roomCode,
        };

        socket.emit("room:state", buildHostRoomState(room, appUrl, payload.role));
        broadcastRoomState(roomCode);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on("room:join", (payload: { roomCode: string; nickname: string; playerId?: string }) => {
      try {
        const roomCode = payload.roomCode.toUpperCase();
        const attempt = joinAttempts.get(socket.id);
        const now = Date.now();

        if (!attempt || now - attempt.windowStartedAt > JOIN_WINDOW_MS) {
          joinAttempts.set(socket.id, { count: 1, windowStartedAt: now });
        } else if (attempt.count >= JOIN_LIMIT) {
          throw new GameError("RATE_LIMITED", "Too many join attempts. Please wait a moment.");
        } else {
          attempt.count += 1;
        }

        leaveTrackedRooms(socket);
        const result = store.joinPlayer({
          roomCode,
          nickname: payload.nickname,
          socketId: socket.id,
          playerId: payload.playerId,
        });

        if (result.previousSocketId) {
          io.to(result.previousSocketId).emit("error", {
            code: "SESSION_MOVED",
            message: "This player session was reopened on another device.",
          });
          io.sockets.sockets.get(result.previousSocketId)?.disconnect();
        }

        socket.join(participantChannel(roomCode));
        socket.data.session = {
          type: "player",
          roomCode,
          playerId: result.player.id,
        };

        socket.emit("room:joined", {
          roomCode,
          playerId: result.player.id,
          nickname: result.acceptedNickname,
          restored: result.restored,
        });

        const playerSnapshot = buildPlayerRoomState(result.room, result.player.id);
        if (playerSnapshot) {
          socket.emit("room:state", playerSnapshot);
        }

        io.to(viewerChannel(roomCode)).emit("player:joined", {
          nickname: result.acceptedNickname,
          playersCount: result.room.players.size,
        });

        broadcastRoomState(roomCode);
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on("game:start", (payload: { roomCode: string; hostToken: string }) => {
      try {
        emitTransitionEvents(store.startGame(payload.roomCode, payload.hostToken));
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on("question:next", (payload: { roomCode: string; hostToken: string }) => {
      try {
        emitTransitionEvents(store.advanceQuestion(payload.roomCode, payload.hostToken));
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on("game:end", (payload: { roomCode: string; hostToken: string }) => {
      try {
        emitTransitionEvents(store.endGame(payload.roomCode, payload.hostToken));
      } catch (error) {
        emitError(socket, error);
      }
    });

    socket.on("answer:submit", (payload: { roomCode: string; questionIndex: number; choiceIndex: number }) => {
      try {
        const session = socket.data.session as
          | { type: "player"; roomCode: string; playerId: string }
          | undefined;

        if (!session || session.type !== "player") {
          throw new GameError("UNAUTHORIZED", "Join as a player before answering.");
        }

        const result = store.submitAnswer({
          roomCode: session.roomCode,
          playerId: session.playerId,
          questionIndex: payload.questionIndex,
          choiceIndex: payload.choiceIndex,
        });

        socket.emit("answer:received", {
          accepted: true,
          questionIndex: payload.questionIndex,
        });

        broadcastRoomState(result.room.code);
      } catch (error) {
        emitError(socket, error);
        socket.emit("answer:received", {
          accepted: false,
        });
      }
    });

    socket.on("disconnect", () => {
      joinAttempts.delete(socket.id);
      const affectedRooms = store.markDisconnected(socket.id);
      affectedRooms.forEach((roomCode) => broadcastRoomState(roomCode));
    });
  });
}
