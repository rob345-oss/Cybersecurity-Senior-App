interface EmptyStateProps {
  title: string
  description: string
  icon?: string
}

export default function EmptyState({ title, description, icon = '📋' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 text-5xl" aria-hidden>
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-700">{title}</h3>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
    </div>
  )
}
