import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111f",
        paper: "#eff6ff",
        mist: "#9fb3c8",
      },
      boxShadow: {
        panel: "0 24px 64px rgba(7, 17, 31, 0.38)",
      },
      backgroundImage: {
        "stage-gradient":
          "radial-gradient(circle at top left, rgba(34, 211, 238, 0.24), transparent 32%), radial-gradient(circle at top right, rgba(251, 146, 60, 0.2), transparent 36%), linear-gradient(135deg, #07111f 0%, #10253c 55%, #08101e 100%)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -8px, 0)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(56, 189, 248, 0.25)" },
          "50%": { boxShadow: "0 0 36px rgba(56, 189, 248, 0.38)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        rise: "rise 320ms ease-out both",
        pulseGlow: "pulseGlow 2.6s ease-in-out infinite",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};

export default config;
