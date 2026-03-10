import type { LeaderboardEntry, PlayerRecord } from "./types";
import { SCORE_ALPHA, SCORE_BASE } from "./quiz";

export function calculateQuestionScore(
  answeredAtMsFromStart: number,
  questionDurationMs: number,
  base = SCORE_BASE,
  alpha = SCORE_ALPHA,
) {
  if (questionDurationMs <= 0) {
    return 0;
  }

  const clampedTime = Math.min(Math.max(answeredAtMsFromStart, 0), questionDurationMs);
  const ratioRemaining = 1 - clampedTime / questionDurationMs;

  return Math.max(0, Math.round(base * Math.pow(ratioRemaining, alpha)));
}

export function buildLeaderboard(players: Iterable<PlayerRecord>, currentQuestionIndex?: number): LeaderboardEntry[] {
  const ranked = [...players].map((player) => {
    const answers = Object.values(player.answersByQuestion);
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    const lastPoints =
      currentQuestionIndex === undefined ? 0 : player.answersByQuestion[currentQuestionIndex]?.pointsAwarded ?? 0;

    return {
      playerId: player.id,
      nickname: player.nickname,
      scoreTotal: player.scoreTotal,
      connected: player.connected,
      streakCount: player.streakCount,
      lastPointsEarned: lastPoints,
      correctCount,
    };
  });

  ranked.sort((left, right) => {
    if (right.scoreTotal !== left.scoreTotal) {
      return right.scoreTotal - left.scoreTotal;
    }

    if (right.correctCount !== left.correctCount) {
      return right.correctCount - left.correctCount;
    }

    return left.nickname.localeCompare(right.nickname);
  });

  return ranked.map((entry, index) => ({
    playerId: entry.playerId,
    nickname: entry.nickname,
    scoreTotal: entry.scoreTotal,
    rank: index + 1,
    connected: entry.connected,
    streakCount: entry.streakCount,
    lastPointsEarned: entry.lastPointsEarned,
  }));
}

export function getRankForPlayer(entries: LeaderboardEntry[], playerId: string) {
  return entries.find((entry) => entry.playerId === playerId)?.rank ?? null;
}
