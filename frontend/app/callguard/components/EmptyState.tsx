interface EmptyStateProps {
  title: string
  description: string
  icon?: string
}

export default function EmptyState({ title, description, icon = '📋' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 max-w-md">{description}</p>
    </div>
  )
}

