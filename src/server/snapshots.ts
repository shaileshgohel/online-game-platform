import { buildLeaderboard, getRankForPlayer } from "../lib/game/scoring";
import type { HostRoomState, PlayerRoomState, QuestionReveal, RoomRecord } from "../lib/game/types";
import { buildJoinUrl, buildStageUrl } from "../lib/url";

function getQuestion(room: RoomRecord) {
  if (room.currentQuestionIndex < 0) {
    return null;
  }

  return room.quiz.questions[room.currentQuestionIndex] ?? null;
}

function buildQuestionState(room: RoomRecord) {
  const question = getQuestion(room);
  if (!question) {
    return null;
  }

  return {
    questionIndex: room.currentQuestionIndex,
    prompt: question.prompt,
    choices: question.choices,
    choiceCount: question.choices.length,
    imageUrl: question.imageUrl ?? null,
    durationMs: room.questionDurationMs,
    startedAt: room.questionStartedAt,
  };
}

function buildRevealState(room: RoomRecord): QuestionReveal | null {
  return room.lastReveal;
}

export function buildHostRoomState(room: RoomRecord, appUrl: string, role: "host" | "stage"): HostRoomState {
  const question = buildQuestionState(room);
  const liveStats =
    room.status === "inQuestion" && room.currentQuestionIndex >= 0
      ? room.quiz.questions[room.currentQuestionIndex].choices.map((_, choiceIndex) => {
          let count = 0;
          let total = 0;

          for (const player of room.players.values()) {
            const answer = player.answersByQuestion[room.currentQuestionIndex];
            if (answer) {
              total += 1;
            }
            if (answer?.choiceIndex === choiceIndex) {
              count += 1;
            }
          }

          return {
            choiceIndex,
            count,
            percentage: total === 0 ? 0 : count / total,
          };
        })
      : buildRevealState(room)?.stats ?? [];

  const players = [...room.players.values()]
    .map((player) => ({
      id: player.id,
      nickname: player.nickname,
      connected: player.connected,
      scoreTotal: player.scoreTotal,
      hasAnsweredCurrentQuestion:
        room.currentQuestionIndex >= 0 && Boolean(player.answersByQuestion[room.currentQuestionIndex]),
    }))
    .sort((left, right) => right.scoreTotal - left.scoreTotal || left.nickname.localeCompare(right.nickname));

  return {
    role,
    roomCode: room.code,
    status: room.status,
    quizTitle: room.quiz.title,
    totalQuestions: room.quiz.questions.length,
    currentQuestionIndex: room.currentQuestionIndex,
    joinUrl: buildJoinUrl(appUrl, room.code),
    stageUrl: buildStageUrl(appUrl, room.code),
    players,
    playerCount: room.players.size,
    connectedCount: players.filter((player) => player.connected).length,
    question,
    liveStats,
    reveal: buildRevealState(room),
    finalLeaderboard: buildLeaderboard(room.players.values()),
  };
}

export function buildPlayerRoomState(room: RoomRecord, playerId: string): PlayerRoomState | null {
  const player = room.players.get(playerId);
  if (!player) {
    return null;
  }

  const leaderboard = buildLeaderboard(
    room.players.values(),
    room.currentQuestionIndex >= 0 ? room.currentQuestionIndex : undefined,
  );
  const currentAnswer =
    room.currentQuestionIndex >= 0 ? player.answersByQuestion[room.currentQuestionIndex] ?? null : null;
  const question = getQuestion(room);
  const reveal =
    room.lastReveal && room.lastReveal.questionIndex === room.currentQuestionIndex
      ? {
          correctIndex: room.lastReveal.correctIndex,
          yourChoiceIndex: currentAnswer?.choiceIndex ?? null,
          isCorrect: currentAnswer?.isCorrect ?? false,
          pointsAwarded: currentAnswer?.pointsAwarded ?? 0,
          scoreTotal: player.scoreTotal,
          streakCount: player.streakCount,
          leaderboard: leaderboard.slice(0, 10),
          rank: getRankForPlayer(leaderboard, player.id),
        }
      : null;

  return {
    role: "player",
    roomCode: room.code,
    status: room.status,
    quizTitle: room.quiz.title,
    totalQuestions: room.quiz.questions.length,
    currentQuestionIndex: room.currentQuestionIndex,
    nickname: player.nickname,
    playerId: player.id,
    scoreTotal: player.scoreTotal,
    rank: getRankForPlayer(leaderboard, player.id),
    playersCount: room.players.size,
    connectedCount: [...room.players.values()].filter((entry) => entry.connected).length,
    choiceCount: question?.choices.length ?? 0,
    durationMs: room.status === "inQuestion" ? room.questionDurationMs : 0,
    startedAt: room.status === "inQuestion" ? room.questionStartedAt : null,
    hasAnswered: Boolean(currentAnswer),
    selectedChoiceIndex: currentAnswer?.choiceIndex ?? null,
    reveal,
    finalLeaderboard: leaderboard.slice(0, 10),
  };
}
