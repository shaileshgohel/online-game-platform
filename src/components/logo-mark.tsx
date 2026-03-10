import clsx from "clsx";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-panel",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.65),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.65),_transparent_46%)]" />
      <svg viewBox="0 0 40 40" className="relative z-10 h-7 w-7 text-white" fill="none">
        <path d="M7 30L15 10L23 24L31 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="7" cy="30" r="2.2" fill="currentColor" />
        <circle cx="15" cy="10" r="2.2" fill="currentColor" />
        <circle cx="23" cy="24" r="2.2" fill="currentColor" />
        <circle cx="31" cy="14" r="2.2" fill="currentColor" />
      </svg>
    </div>
  );
}
