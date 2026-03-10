export type RoomStatus = "lobby" | "inQuestion" | "reveal" | "ended";

export interface QuizChoice {
  label: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: QuizChoice[];
  correctIndex: number;
  durationMs?: number;
  imageUrl?: string | null;
}

export interface QuizDefinition {
  title: string;
  questions: QuizQuestion[];
}

export interface PlayerAnswer {
  questionIndex: number;
  choiceIndex: number;
  isCorrect: boolean;
  answeredAtMsFromStart: number;
  pointsAwarded: number;
  streakApplied: boolean;
}

export interface PlayerRecord {
  id: string;
  nickname: string;
  socketId: string | null;
  connected: boolean;
  scoreTotal: number;
  streakCount: number;
  answersByQuestion: Record<number, PlayerAnswer>;
}

export interface ChoiceStat {
  choiceIndex: number;
  count: number;
  percentage: number;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  scoreTotal: number;
  rank: number;
  connected: boolean;
  streakCount: number;
  lastPointsEarned: number;
}

export interface QuestionReveal {
  questionIndex: number;
  correctIndex: number;
  leaderboard: LeaderboardEntry[];
  stats: ChoiceStat[];
  answeredCount: number;
}

export interface RoomRecord {
  code: string;
  hostToken: string;
  hostSocketId: string | null;
  status: RoomStatus;
  quiz: QuizDefinition;
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  questionDurationMs: number;
  players: Map<string, PlayerRecord>;
  lastReveal: QuestionReveal | null;
  timerHandle: ReturnType<typeof setTimeout> | null;
  createdAt: number;
}

export interface PlayerSummary {
  id: string;
  nickname: string;
  connected: boolean;
  scoreTotal: number;
  hasAnsweredCurrentQuestion: boolean;
}

export interface ActiveQuestionState {
  questionIndex: number;
  prompt: string;
  choices: QuizChoice[];
  choiceCount: number;
  imageUrl?: string | null;
  durationMs: number;
  startedAt: number | null;
}

export interface HostRoomState {
  role: "host" | "stage";
  roomCode: string;
  status: RoomStatus;
  quizTitle: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  joinUrl: string;
  stageUrl: string;
  players: PlayerSummary[];
  playerCount: number;
  connectedCount: number;
  question: ActiveQuestionState | null;
  liveStats: ChoiceStat[];
  reveal: QuestionReveal | null;
  finalLeaderboard: LeaderboardEntry[];
}

export interface PlayerRevealState {
  correctIndex: number;
  yourChoiceIndex: number | null;
  isCorrect: boolean;
  pointsAwarded: number;
  scoreTotal: number;
  streakCount: number;
  leaderboard: LeaderboardEntry[];
  rank: number | null;
}

export interface PlayerRoomState {
  role: "player";
  roomCode: string;
  status: RoomStatus;
  quizTitle: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  nickname: string;
  playerId: string;
  scoreTotal: number;
  rank: number | null;
  playersCount: number;
  connectedCount: number;
  choiceCount: number;
  durationMs: number;
  startedAt: number | null;
  hasAnswered: boolean;
  selectedChoiceIndex: number | null;
  reveal: PlayerRevealState | null;
  finalLeaderboard: LeaderboardEntry[];
}
