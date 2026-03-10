"use client";

import clsx from "clsx";

import { ANSWER_STYLES } from "@/lib/game/display";

import { ChoiceGlyph } from "./choice-glyph";

export function PlayerAnswerGrid({
  choiceCount,
  disabled,
  selectedChoiceIndex,
  pendingChoiceIndex,
  onSelect,
}: {
  choiceCount: number;
  disabled: boolean;
  selectedChoiceIndex: number | null;
  pendingChoiceIndex: number | null;
  onSelect: (choiceIndex: number) => void;
}) {
  return (
    <div className={clsx("grid gap-4", choiceCount === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2")}>
      {Array.from({ length: choiceCount }, (_, index) => {
        const variant = ANSWER_STYLES[index];
        const isSelected = selectedChoiceIndex === index || pendingChoiceIndex === index;

        return (
          <button
            key={variant.name}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(index)}
            aria-label={`Answer option ${index + 1}`}
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
          </button>
        );
      })}
    </div>
  );
}
