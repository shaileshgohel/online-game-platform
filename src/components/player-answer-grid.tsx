"use client";

import clsx from "clsx";

import { ANSWER_STYLES } from "@/lib/game/display";
import type { QuizChoice } from "@/lib/game/types";

import { ChoiceGlyph } from "./choice-glyph";

export function PlayerAnswerGrid({
  choices,
  disabled,
  selectedChoiceIndex,
  pendingChoiceIndex,
  onSelect,
}: {
  choices: QuizChoice[];
  disabled: boolean;
  selectedChoiceIndex: number | null;
  pendingChoiceIndex: number | null;
  onSelect: (choiceIndex: number) => void;
}) {
  return (
    <div className={clsx("grid gap-4", choices.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2")}>
      {choices.map((choice, index) => {
        const variant = ANSWER_STYLES[index];
        const isSelected = selectedChoiceIndex === index || pendingChoiceIndex === index;

        return (
          <button
            key={`${variant.name}-${choice.label}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(index)}
            aria-label={`Answer option ${index + 1}: ${choice.label}`}
            className={clsx(
              "group flex min-h-[190px] flex-col items-center justify-center rounded-[30px] border border-white/10 p-5 text-center text-white transition duration-200 hover:-translate-y-1 disabled:cursor-not-allowed disabled:hover:translate-y-0",
              isSelected ? "ring-4 ring-white/90" : "ring-1 ring-white/10",
              disabled && !isSelected ? "opacity-60" : "opacity-100",
            )}
            style={{
              background: variant.gradient,
              boxShadow: variant.shadow,
            }}
          >
            <ChoiceGlyph index={index} className="mb-5 h-24 w-24 text-white drop-shadow-[0_8px_24px_rgba(7,17,31,0.24)]" />
            <span className="text-sm uppercase tracking-[0.28em] text-white/80">{variant.name}</span>
            <span className="mt-3 max-w-[15rem] text-balance text-lg font-semibold leading-snug text-white">
              {choice.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
