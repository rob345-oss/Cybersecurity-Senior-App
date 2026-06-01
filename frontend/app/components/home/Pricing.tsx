import Link from 'next/link'
import {
  Check,
  Shield,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'

/** Matches STRIPE_PRICE_*_MONTHLY in repo-root .env (loaded via next.config.js). */
const STRIPE_PLAN_ENV: Record<
  'base' | 'core' | 'premium' | 'family',
  { envKey: string; fallback: number }
> = {
  base: { envKey: 'STRIPE_PRICE_BASE_MONTHLY', fallback: 2.99 },
  core: { envKey: 'STRIPE_PRICE_CORE_MONTHLY', fallback: 5.99 },
  premium: { envKey: 'STRIPE_PRICE_PREMIUM_MONTHLY', fallback: 15.99 },
  family: { envKey: 'STRIPE_PRICE_FAMILY_MONTHLY', fallback: 19.99 },
}

function getMonthlyPrice(planId: keyof typeof STRIPE_PLAN_ENV): string {
  const { envKey, fallback } = STRIPE_PLAN_ENV[planId]
  const raw = process.env[envKey]
  const amount = raw ? parseFloat(raw.trim()) : fallback
  const value = Number.isFinite(amount) ? amount : fallback
  return `$${value.toFixed(2)}`
}

type Plan = {
  id: keyof typeof STRIPE_PLAN_ENV
  name: string
  price: string
  period: string
  description: string
  features: string[]
  highlighted: boolean
  icon: LucideIcon
  mobileOrder: string
  desktopOrder: string
}

function buildPlans(): Plan[] {
  return [
    {
      id: 'base',
      name: 'Base',
      price: getMonthlyPrice('base'),
      period: '/month',
      description: 'Essential email protection to get started',
      features: [
        'InboxGuard email scanning',
        'Basic scam alerts',
        'Email support',
      ],
      highlighted: false,
      icon: User,
      mobileOrder: 'order-2',
      desktopOrder: 'md:order-1',
    },
    {
      id: 'core',
      name: 'Core',
      price: getMonthlyPrice('core'),
      period: '/month',
      description: 'Phone and email protection for individuals',
      features: [
        'Everything in Base',
        'CallGuard protection',
        'Basic identity monitoring',
      ],
      highlighted: false,
      icon: Shield,
      mobileOrder: 'order-3',
      desktopOrder: 'md:order-2',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: getMonthlyPrice('premium'),
      period: '/month',
      description: 'Full individual protection across all guards',
      features: [
        'Everything in Core',
        'MoneyGuard payment risk checks',
        'IdentityWatch monitoring',
        'Priority support',
        'Advanced risk alerts',
      ],
      highlighted: false,
      icon: Sparkles,
      mobileOrder: 'order-4',
      desktopOrder: 'md:order-3',
    },
    {
      id: 'family',
      name: 'Family',
      price: getMonthlyPrice('family'),
      period: '/month',
      description: 'Best for families with multiple members',
      features: [
        'Everything in Premium',
        'Up to 5 family members',
        'CareCircle family connections',
        'Shared family alerts',
      ],
      highlighted: true,
      icon: Users,
      mobileOrder: 'order-1',
      desktopOrder: 'md:order-4',
    },
  ]
}

function PricingCard({ plan }: { plan: Plan }) {
  const Icon = plan.icon

  return (
    <article
      className={`relative flex flex-col bg-white rounded-2xl p-8 h-full ${plan.mobileOrder} ${plan.desktopOrder} ${
        plan.highlighted
          ? 'z-10 ring-2 ring-gray-900 shadow-xl md:-mt-2 md:mb-2'
          : 'border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-shadow transition-colors'
      }`}
    >
      {plan.highlighted && (
        <div
          className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gray-900"
          aria-hidden
        />
      )}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-gray-900" aria-hidden />
        </div>
        {plan.highlighted && (
          <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
      <p className="text-gray-600 mb-6">{plan.description}</p>
      <div className="mb-8 flex items-baseline gap-1">
        <span className="text-5xl font-bold text-gray-900 tracking-tight">
          {plan.price}
        </span>
        <span className="text-lg text-gray-600">{plan.period}</span>
      </div>
      <ul className="space-y-4 mb-8 flex-grow">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full bg-green-50 flex items-center justify-center mt-0.5"
              aria-hidden
            >
              <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
            </span>
            <span className="text-gray-600 leading-snug">{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={`/signup?plan=${plan.id}`}
        className={`block w-full py-3 rounded-lg font-semibold text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 ${
          plan.highlighted
            ? 'bg-gray-900 text-white hover:bg-gray-800'
            : 'bg-white text-gray-900 border-2 border-gray-900 hover:bg-gray-50'
        }`}
      >
        Get Started
      </Link>
    </article>
  )
}

export default function Pricing() {
  const plans = buildPlans()

  return (
    <section
      id="pricing"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-gray-50/50 to-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
            Pricing
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 mt-3">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto text-balance">
            Choose the plan that fits your needs
          </p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>
        <p className="mt-12 text-center text-sm text-gray-500">
          30-day free trial · No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  )
}
