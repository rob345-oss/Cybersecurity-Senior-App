interface RiskBadgeProps {
  level: string
  score: number
}

const levelToClass = (level: string) => {
  const normalized = level.toLowerCase()
  if (normalized.includes('low')) return 'low'
  if (normalized.includes('medium')) return 'medium'
  return 'high'
}

export default function RiskBadge({ level, score }: RiskBadgeProps) {
  const badgeClass = levelToClass(level)
  
  const colorClasses = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }
  
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${colorClasses[badgeClass]}`}>
      {level} risk · {score}
    </span>
  )
}

