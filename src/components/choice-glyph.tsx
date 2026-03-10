import { ANSWER_STYLES } from "@/lib/game/display";

export function ChoiceGlyph({
  index,
  className,
}: {
  index: number;
  className?: string;
}) {
  const variant = ANSWER_STYLES[index % ANSWER_STYLES.length];

  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      style={{ color: variant.solid }}
      fill="currentColor"
    >
      {variant.icon === "triangle" ? <polygon points="24,8 41,40 7,40" /> : null}
      {variant.icon === "diamond" ? <polygon points="24,6 42,24 24,42 6,24" /> : null}
      {variant.icon === "circle" ? <circle cx="24" cy="24" r="16" /> : null}
      {variant.icon === "square" ? <rect x="10" y="10" width="28" height="28" rx="4" /> : null}
    </svg>
  );
}
