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
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl border-2 p-8 ${
                plan.highlighted
                  ? 'border-gray-900 shadow-xl scale-105'
                  : 'border-gray-200'
              }`}
            >
              {plan.highlighted && (
                <div className="bg-gray-900 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              <div className="mb-8">
                <span className="text-5xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-600">{plan.period}</span>
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

