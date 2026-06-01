interface DashboardHeaderProps {
  title: string
  description?: string
}

export default function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {description && <p className="mt-1 text-lg text-gray-600">{description}</p>}
    </header>
  )
}
