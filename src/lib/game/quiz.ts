import type { QuizChoice, QuizDefinition, QuizQuestion } from "./types";

export const DEFAULT_QUESTION_DURATION_MS = 15000;
export const SCORE_BASE = 1000;
export const SCORE_ALPHA = 1.7;
export const STREAK_BONUS = 50;
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MAX_NICKNAME_LENGTH = 18;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeChoice(value: unknown, index: number): QuizChoice {
  if (!isRecord(value)) {
    throw new Error(`Choice ${index + 1} must be an object.`);
  }

  const label = typeof value.label === "string" ? value.label.trim() : "";
  if (!label) {
    throw new Error(`Choice ${index + 1} must have a label.`);
  }

  return { label };
}

function normalizeQuestion(value: unknown, index: number): QuizQuestion {
  if (!isRecord(value)) {
    throw new Error(`Question ${index + 1} must be an object.`);
  }

  const prompt = typeof value.prompt === "string" ? value.prompt.trim() : "";
  if (!prompt) {
    throw new Error(`Question ${index + 1} is missing a prompt.`);
  }

  const rawChoices = Array.isArray(value.choices) ? value.choices : [];
  if (rawChoices.length !== 2 && rawChoices.length !== 4) {
    throw new Error(`Question ${index + 1} must contain exactly 2 or 4 choices.`);
  }

  const choices = rawChoices.map((choice, choiceIndex) => normalizeChoice(choice, choiceIndex));
  const correctIndex =
    typeof value.correctIndex === "number" && Number.isInteger(value.correctIndex)
      ? value.correctIndex
      : -1;

  if (correctIndex < 0 || correctIndex >= choices.length) {
    throw new Error(`Question ${index + 1} has an invalid correctIndex.`);
  }

  const durationMs =
    typeof value.durationMs === "number" && value.durationMs >= 5000 && value.durationMs <= 60000
      ? Math.round(value.durationMs)
      : DEFAULT_QUESTION_DURATION_MS;

  const imageUrl =
    typeof value.imageUrl === "string" && value.imageUrl.trim().length > 0 ? value.imageUrl.trim() : null;

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id.trim() : `q-${index + 1}`,
    prompt,
    choices,
    correctIndex,
    durationMs,
    imageUrl,
  };
}

export function normalizeQuiz(input: unknown): QuizDefinition {
  if (!isRecord(input)) {
    throw new Error("Quiz JSON must be an object.");
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) {
    throw new Error("Quiz title is required.");
  }

  const rawQuestions = Array.isArray(input.questions) ? input.questions : [];
  if (rawQuestions.length === 0) {
    throw new Error("Quiz must include at least one question.");
  }

  return {
    title,
    questions: rawQuestions.map((question, index) => normalizeQuestion(question, index)),
  };
}

export function sanitizeNickname(input: string) {
  const trimmed = input.trim().replace(/\s+/g, " ");
  const cleaned = trimmed.replace(/[^A-Za-z0-9 _-]/g, "");
  return cleaned.slice(0, MAX_NICKNAME_LENGTH);
}

export function createRoomCode(existingCodes: Set<string>) {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    let code = "";

    for (let index = 0; index < 6; index += 1) {
      code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
    }

    if (!existingCodes.has(code)) {
      return code;
    }
  }

  throw new Error("Failed to generate a unique room code.");
}
