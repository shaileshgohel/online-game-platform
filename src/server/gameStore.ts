import { randomUUID } from "node:crypto";

import { buildLeaderboard, calculateQuestionScore } from "../lib/game/scoring";
import {
  DEFAULT_QUESTION_DURATION_MS,
  STREAK_BONUS,
  createRoomCode,
  sanitizeNickname,
} from "../lib/game/quiz";
import type {
  ChoiceStat,
  PlayerAnswer,
  PlayerRecord,
  QuestionReveal,
  QuizDefinition,
  RoomRecord,
} from "../lib/game/types";

export class GameError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

export interface JoinPlayerResult {
  room: RoomRecord;
  player: PlayerRecord;
  restored: boolean;
  acceptedNickname: string;
  previousSocketId: string | null;
}

export interface PhaseTransition {
  room: RoomRecord;
  type: "started" | "reveal" | "ended";
}

export class GameStore {
  private readonly rooms = new Map<string, RoomRecord>();

  constructor(private readonly onQuestionTimerElapsed: (roomCode: string) => void) {}

  getRoom(roomCode: string) {
    return this.rooms.get(roomCode.toUpperCase());
  }

  createRoom(quiz: QuizDefinition, hostSocketId: string) {
    const code = createRoomCode(new Set(this.rooms.keys()));
    const room: RoomRecord = {
      code,
      hostToken: randomUUID(),
      hostSocketId,
      status: "lobby",
      quiz,
      currentQuestionIndex: -1,
      questionStartedAt: null,
      questionDurationMs: DEFAULT_QUESTION_DURATION_MS,
      players: new Map(),
      lastReveal: null,
      timerHandle: null,
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    return room;
  }

  attachHost(roomCode: string, hostToken: string, socketId: string) {
    const room = this.requireHostRoom(roomCode, hostToken);
    room.hostSocketId = socketId;
    return room;
  }

  joinPlayer({
    roomCode,
    nickname,
    socketId,
    playerId,
  }: {
    roomCode: string;
    nickname: string;
    socketId: string;
    playerId?: string;
  }): JoinPlayerResult {
    const room = this.requireRoom(roomCode);
    const sanitizedNickname = sanitizeNickname(nickname);

    if (!sanitizedNickname) {
      throw new GameError("INVALID_NICKNAME", "Choose a nickname with letters or numbers.");
    }

    if (playerId) {
      const existingById = room.players.get(playerId);
      if (existingById) {
        const previousSocketId =
          existingById.socketId && existingById.socketId !== socketId ? existingById.socketId : null;
        existingById.socketId = socketId;
        existingById.connected = true;

        return {
          room,
          player: existingById,
          restored: true,
          acceptedNickname: existingById.nickname,
          previousSocketId,
        };
      }
    }

    const disconnectedMatch = [...room.players.values()].find(
      (player) => !player.connected && player.nickname.toLowerCase() === sanitizedNickname.toLowerCase(),
    );

    if (disconnectedMatch) {
      const previousSocketId =
        disconnectedMatch.socketId && disconnectedMatch.socketId !== socketId ? disconnectedMatch.socketId : null;
      disconnectedMatch.socketId = socketId;
      disconnectedMatch.connected = true;

      return {
        room,
        player: disconnectedMatch,
        restored: true,
        acceptedNickname: disconnectedMatch.nickname,
        previousSocketId,
      };
    }

    const acceptedNickname = this.makeUniqueNickname(room, sanitizedNickname);
    const player: PlayerRecord = {
      id: randomUUID(),
      nickname: acceptedNickname,
      socketId,
      connected: true,
      scoreTotal: 0,
      streakCount: 0,
      answersByQuestion: {},
    };

    room.players.set(player.id, player);

    return {
      room,
      player,
      restored: false,
      acceptedNickname,
      previousSocketId: null,
    };
  }

  startGame(roomCode: string, hostToken: string): PhaseTransition {
    const room = this.requireHostRoom(roomCode, hostToken);

    if (room.status !== "lobby") {
      throw new GameError("INVALID_STATE", "Game has already started.");
    }

    return this.startQuestion(room, 0);
  }

  advanceQuestion(roomCode: string, hostToken: string): PhaseTransition {
    const room = this.requireHostRoom(roomCode, hostToken);

    if (room.status === "lobby") {
      throw new GameError("INVALID_STATE", "Start the game before moving to the next question.");
    }

    if (room.status === "inQuestion") {
      return this.revealCurrentQuestion(roomCode) ?? { room, type: "reveal" };
    }

    if (room.status === "reveal") {
      if (room.currentQuestionIndex >= room.quiz.questions.length - 1) {
        return this.endGame(roomCode, hostToken);
      }

      return this.startQuestion(room, room.currentQuestionIndex + 1);
    }

    throw new GameError("INVALID_STATE", "Game has already ended.");
  }

  revealCurrentQuestion(roomCode: string): PhaseTransition | null {
    const room = this.requireRoom(roomCode);

    if (room.status !== "inQuestion") {
      return null;
    }

    this.clearTimer(room);
    room.status = "reveal";
    room.lastReveal = this.buildReveal(room, room.currentQuestionIndex);
    room.questionStartedAt = null;

    return {
      room,
      type: "reveal",
    };
  }

  endGame(roomCode: string, hostToken: string): PhaseTransition {
    const room = this.requireHostRoom(roomCode, hostToken);
    this.clearTimer(room);
    room.status = "ended";
    room.questionStartedAt = null;

    return {
      room,
      type: "ended",
    };
  }

  submitAnswer({
    roomCode,
    playerId,
    questionIndex,
    choiceIndex,
  }: {
    roomCode: string;
    playerId: string;
    questionIndex: number;
    choiceIndex: number;
  }) {
    const room = this.requireRoom(roomCode);
    const player = room.players.get(playerId);

    if (!player) {
      throw new GameError("PLAYER_NOT_FOUND", "Join the room before answering.");
    }

    if (room.status !== "inQuestion" || room.questionStartedAt === null) {
      throw new GameError("QUESTION_CLOSED", "The question is not accepting answers right now.");
    }

    if (questionIndex !== room.currentQuestionIndex) {
      throw new GameError("STALE_QUESTION", "That question is no longer active.");
    }

    const question = room.quiz.questions[room.currentQuestionIndex];
    if (!question) {
      throw new GameError("QUESTION_NOT_FOUND", "Question not found.");
    }

    if (choiceIndex < 0 || choiceIndex >= question.choices.length) {
      throw new GameError("INVALID_CHOICE", "That answer choice is invalid.");
    }

    if (player.answersByQuestion[questionIndex]) {
      throw new GameError("ALREADY_ANSWERED", "Only the first answer counts.");
    }

    const elapsed = Date.now() - room.questionStartedAt;
    if (elapsed > room.questionDurationMs) {
      throw new GameError("QUESTION_CLOSED", "Time is up for this question.");
    }

    const isCorrect = choiceIndex === question.correctIndex;
    const answeredAtMsFromStart = Math.max(0, elapsed);
    const speedScore = isCorrect
      ? calculateQuestionScore(answeredAtMsFromStart, room.questionDurationMs)
      : 0;
    const newStreak = isCorrect ? player.streakCount + 1 : 0;
    const streakApplied = isCorrect && newStreak > 1;
    const pointsAwarded = speedScore + (streakApplied ? STREAK_BONUS : 0);

    const answer: PlayerAnswer = {
      questionIndex,
      choiceIndex,
      isCorrect,
      answeredAtMsFromStart,
      pointsAwarded,
      streakApplied,
    };

    player.answersByQuestion[questionIndex] = answer;
    player.streakCount = newStreak;
    player.scoreTotal += pointsAwarded;

    return {
      room,
      player,
      answer,
    };
  }

  markDisconnected(socketId: string) {
    const affectedRooms = new Set<string>();

    for (const room of this.rooms.values()) {
      if (room.hostSocketId === socketId) {
        room.hostSocketId = null;
        affectedRooms.add(room.code);
      }

      for (const player of room.players.values()) {
        if (player.socketId === socketId) {
          player.socketId = null;
          player.connected = false;
          affectedRooms.add(room.code);
        }
      }
    }

    return [...affectedRooms];
  }

  private makeUniqueNickname(room: RoomRecord, nickname: string) {
    let candidate = nickname;
    let suffix = 2;

    while ([...room.players.values()].some((player) => player.nickname.toLowerCase() === candidate.toLowerCase())) {
      candidate = `${nickname.slice(0, Math.max(1, 16 - String(suffix).length))} ${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private startQuestion(room: RoomRecord, questionIndex: number): PhaseTransition {
    const question = room.quiz.questions[questionIndex];
    if (!question) {
      throw new GameError("QUESTION_NOT_FOUND", "Question not found.");
    }

    this.clearTimer(room);
    room.status = "inQuestion";
    room.currentQuestionIndex = questionIndex;
    room.questionDurationMs = question.durationMs ?? DEFAULT_QUESTION_DURATION_MS;
    room.questionStartedAt = Date.now();
    room.lastReveal = null;
    room.timerHandle = setTimeout(() => {
      this.onQuestionTimerElapsed(room.code);
    }, room.questionDurationMs + 20);

    return {
      room,
      type: "started",
    };
  }

  private buildReveal(room: RoomRecord, questionIndex: number): QuestionReveal {
    const question = room.quiz.questions[questionIndex];
    const stats = this.buildChoiceStats(room, questionIndex);
    const leaderboard = buildLeaderboard(room.players.values(), questionIndex);
    const answeredCount = stats.reduce((sum, stat) => sum + stat.count, 0);

    return {
      questionIndex,
      correctIndex: question.correctIndex,
      leaderboard,
      stats,
      answeredCount,
    };
  }

  private buildChoiceStats(room: RoomRecord, questionIndex: number): ChoiceStat[] {
    const question = room.quiz.questions[questionIndex];
    const counts = question.choices.map((_, index) => ({
      choiceIndex: index,
      count: 0,
      percentage: 0,
    }));

    let totalAnswers = 0;

    for (const player of room.players.values()) {
      const answer = player.answersByQuestion[questionIndex];
      if (answer) {
        counts[answer.choiceIndex].count += 1;
        totalAnswers += 1;
      }
    }

    return counts.map((entry) => ({
      ...entry,
      percentage: totalAnswers === 0 ? 0 : entry.count / totalAnswers,
    }));
  }

  private requireRoom(roomCode: string) {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      throw new GameError("ROOM_NOT_FOUND", "That room could not be found.");
    }

    return room;
  }

  private requireHostRoom(roomCode: string, hostToken: string) {
    const room = this.requireRoom(roomCode);

    if (room.hostToken !== hostToken) {
      throw new GameError("UNAUTHORIZED", "Host session could not be verified.");
    }

    return room;
  }

  private clearTimer(room: RoomRecord) {
    if (room.timerHandle) {
      clearTimeout(room.timerHandle);
      room.timerHandle = null;
    }
  }
}
