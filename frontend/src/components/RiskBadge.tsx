interface RiskBadgeProps {
  level: string;
  score: number;
}

const levelToClass = (level: string) => {
  const normalized = level.toLowerCase();
  if (normalized.includes("low")) return "low";
  if (normalized.includes("medium")) return "medium";
  return "high";
};

export default function RiskBadge({ level, score }: RiskBadgeProps) {
  const badgeClass = levelToClass(level);
  return (
    <span className={`risk-badge ${badgeClass}`}>
      {level} risk · {score}
    </span>
  );
}
