'use client'

const STEPS = [
  { id: 1, label: 'Your number', href: '/dashboard/share-number' },
  { id: 2, label: 'Contacts', href: '/dashboard/share-number/contacts' },
  { id: 3, label: 'Messages', href: '/dashboard/share-number/messages' },
  { id: 4, label: 'Review', href: '/dashboard/share-number/review' },
  { id: 5, label: 'Done', href: '/dashboard/share-number/complete' },
]

interface SharingProgressProps {
  currentStep: number
}

export default function SharingProgress({ currentStep }: SharingProgressProps) {
  return (
    <nav aria-label="Share onboarding progress" className="mb-8">
      <ol className="flex flex-wrap gap-2 sm:gap-3">
        {STEPS.map((step) => {
          const isActive = step.id === currentStep
          const isComplete = step.id < currentStep
          return (
            <li key={step.id}>
              <span
                className={`inline-flex items-center min-h-[44px] px-3 sm:px-4 rounded-full text-sm sm:text-base font-medium border ${
                  isActive
                    ? 'bg-gray-900 text-white border-gray-900'
                    : isComplete
                      ? 'bg-green-50 text-green-900 border-green-200'
                      : 'bg-white text-gray-600 border-gray-200'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="sr-only">Step {step.id}:</span>
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
