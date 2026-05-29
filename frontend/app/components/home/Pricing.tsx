import Link from 'next/link'

const plans = [
  {
    name: 'Starter',
    price: '$9',
    period: '/month',
    description: 'Essential protection for individuals',
    features: [
      'CallGuard protection',
      'InboxGuard email scanning',
      'Basic identity monitoring',
      'Email support',
    ],
    highlighted: false,
  },
  {
    name: 'Family',
    price: '$19',
    period: '/month',
    description: 'Best for families with multiple members',
    features: [
      'Everything in Starter',
      'Up to 5 family members',
      'CareCircle family connections',
      'Priority support',
      'Advanced risk alerts',
    ],
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '$39',
    period: '/month',
    description: 'Advanced protection for high-risk situations',
    features: [
      'Everything in Family',
      'Unlimited family members',
      '24/7 priority support',
      'Custom protection rules',
      'IdentityWatch premium',
      'Dedicated account manager',
    ],
    highlighted: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-slate-900">Simple, Transparent Pricing</h2>
          <p className="mx-auto max-w-2xl text-xl text-slate-600">Choose the plan that fits your needs</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border-2 bg-white p-8 ${
                plan.highlighted
                  ? 'relative scale-105 border-brand-accent shadow-card-hover'
                  : 'border-slate-200 shadow-card'
              }`}
            >
              {plan.highlighted && (
                <div className="mb-4 inline-block rounded-full bg-brand-accent px-3 py-1 text-sm font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="mb-2 text-2xl font-bold text-slate-900">{plan.name}</h3>
              <p className="mb-6 text-slate-600">{plan.description}</p>
              <div className="mb-8">
                <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-slate-600">{plan.period}</span>
              </div>
              <ul className="mb-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg
                      className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-brand-accent"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block w-full py-3 text-center font-semibold transition-colors ${
                  plan.highlighted
                    ? 'btn-primary'
                    : 'btn-secondary w-full'
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
