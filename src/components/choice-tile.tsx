import clsx from "clsx";

import { ANSWER_STYLES } from "@/lib/game/display";

import { ChoiceGlyph } from "./choice-glyph";

export function ChoiceTile({
  index,
  label,
  count,
  percentage,
  isCorrect = false,
  isDimmed = false,
}: {
  index: number;
  label: string;
  count?: number;
  percentage?: number;
  isCorrect?: boolean;
  isDimmed?: boolean;
}) {
  const variant = ANSWER_STYLES[index % ANSWER_STYLES.length];

  return (
    <div
      className={clsx(
        "group rounded-[28px] border border-white/10 p-5 transition duration-300",
        isDimmed ? "opacity-45 grayscale-[0.15]" : "opacity-100",
        isCorrect ? "ring-2 ring-emerald-300/80" : "ring-1 ring-white/5",
      )}
      style={{
        background: variant.gradient,
        boxShadow: variant.shadow,
      }}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-black/15 p-3 backdrop-blur-sm">
          <ChoiceGlyph index={index} className="h-10 w-10 text-white" />
        </div>
        {count !== undefined ? (
          <div className="rounded-full bg-black/20 px-3 py-1 text-sm font-semibold text-white/95 backdrop-blur-sm">
            {count} response{count === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>

      <p className="font-display text-xl font-semibold text-white sm:text-2xl">{label}</p>
      {percentage !== undefined ? (
        <div className="mt-4 flex items-center justify-between text-sm text-white/90">
          <span>{Math.round(percentage * 100)}%</span>
          {isCorrect ? <span className="font-semibold uppercase tracking-[0.24em]">Correct</span> : null}
        </div>
      ) : null}
    </div>
  );
}
