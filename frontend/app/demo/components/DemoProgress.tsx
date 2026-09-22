'use client'

interface DemoProgressProps {
  steps: string[]
  currentIndex: number
}

export default function DemoProgress({ steps, currentIndex }: DemoProgressProps) {
  return (
    <nav aria-label="Demo progress" className="mb-6">
      <ol className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        {steps.map((label, index) => {
          const done = index < currentIndex
          const active = index === currentIndex
          return (
            <li
              key={label}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm border ${
                active
                  ? 'border-blue-300 bg-blue-50 text-blue-900 font-semibold'
                  : done
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? 'bg-blue-600 text-white'
                    : done
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                }`}
                aria-hidden="true"
              >
                {done ? '✓' : index + 1}
              </span>
              {label}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
