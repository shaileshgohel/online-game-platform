export type AnswerIcon = "triangle" | "diamond" | "circle" | "square";

export interface AnswerStyle {
  icon: AnswerIcon;
  name: string;
  solid: string;
  gradient: string;
  shadow: string;
}

export const ANSWER_STYLES: AnswerStyle[] = [
  {
    icon: "triangle",
    name: "Triangle",
    solid: "#f97316",
    gradient: "linear-gradient(145deg, #fb923c 0%, #f97316 100%)",
    shadow: "0 20px 48px rgba(249, 115, 22, 0.32)",
  },
  {
    icon: "diamond",
    name: "Diamond",
    solid: "#06b6d4",
    gradient: "linear-gradient(145deg, #22d3ee 0%, #0891b2 100%)",
    shadow: "0 20px 48px rgba(34, 211, 238, 0.28)",
  },
  {
    icon: "circle",
    name: "Circle",
    solid: "#84cc16",
    gradient: "linear-gradient(145deg, #a3e635 0%, #65a30d 100%)",
    shadow: "0 20px 48px rgba(163, 230, 53, 0.3)",
  },
  {
    icon: "square",
    name: "Square",
    solid: "#ec4899",
    gradient: "linear-gradient(145deg, #f472b6 0%, #db2777 100%)",
    shadow: "0 20px 48px rgba(244, 114, 182, 0.28)",
  },
];
