'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Users, Shield, Phone, UserCheck, PhoneCall } from 'lucide-react'

const numberOptions = [
  {
    icon: Users,
    title: 'Trusted Circle Number',
    description:
      'Share this number with family, close friends, doctors, caregivers, and people you know. Calls from trusted contacts can come through normally, while unknown callers can be screened first.',
    examples: [
      'Family',
      'Close friends',
      'Caregivers',
      'Doctors',
      'Church or community contacts',
      'Important local services',
    ],
    buttonText: 'Set Up My Trusted Number',
    href: '/onboarding/trusted-number',
  },
  {
    icon: Shield,
    title: 'Shield Number',
    description:
      'Use this number for online forms, deliveries, repairs, signups, and unfamiliar situations. It helps protect your personal number from being shared too widely.',
    examples: [
      'Online forms',
      'Delivery apps',
      'Store rewards programs',
      'Repair services',
      'Marketplace listings',
      'Public signups',
    ],
    buttonText: 'Set Up My Shield Number',
    href: '/onboarding/shield-number',
  },
]

const setupSteps = [
  {
    number: '1',
    title: 'Choose a protected number',
    description: 'Pick a phone number you can use for safer calls.',
    icon: Phone,
  },
  {
    number: '2',
    title: 'Add trusted contacts',
    description:
      'Add family, friends, doctors, caregivers, or anyone else you trust.',
    icon: UserCheck,
  },
  {
    number: '3',
    title: 'Let Titanium Guardian help screen calls',
    description:
      'Known contacts can reach you more easily. Unknown callers can be checked before they interrupt you.',
    icon: PhoneCall,
  },
]

const protectedNumberFaqs = [
  {
    question: 'Do I have to replace my current phone number?',
    answer:
      'No. You can keep your current number. The protected number gives you another safer option to use when you want more privacy.',
  },
  {
    question: 'Who should get my Trusted Circle Number?',
    answer:
      'Give it to people you already know and trust, such as family, close friends, caregivers, doctors, and important local contacts.',
  },
  {
    question: 'When should I use my Shield Number?',
    answer:
      'Use it for online forms, delivery apps, repair services, public signups, marketplace listings, or any place where you do not want to give out your personal number.',
  },
  {
    question: 'What happens when an unknown caller calls?',
    answer:
      'Titanium Guardian can help screen the call before it reaches you, depending on the protection level you choose.',
  },
  {
    question: 'Can my family help me set it up?',
    answer:
      'Yes. A trusted family member or caregiver can help you choose your number, add trusted contacts, and decide how unknown calls should be handled.',
  },
]

export default function ProtectedPhoneNumbers() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  return (
    <section
      id="protected-numbers"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
      aria-labelledby="protected-numbers-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2
            id="protected-numbers-heading"
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight"
          >
            Safer Phone Numbers for Everyday Life
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Keep trusted people close while giving unknown callers an extra layer
            of screening.
          </p>
        </div>

        <div className="max-w-4xl mx-auto text-center mb-12 space-y-6">
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-snug">
            One number for people you trust. One number for everyone else.
          </p>
          <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
            Your personal phone number is important. Titanium Guardian helps you
            keep it more private by giving you protected numbers you can use in
            different situations. You do not need to understand complicated
            technology. We help guide you step by step.
          </p>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
            Titanium Guardian helps you set up protected phone numbers for
            different parts of your life. You can have one number for the people
            you trust most, and another number for online forms, appointments,
            deliveries, and unfamiliar situations. This helps keep your personal
            number more private and gives suspicious callers one more step to
            pass before they reach you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {numberOptions.map((option) => {
            const Icon = option.icon
            return (
              <div
                key={option.title}
                className="bg-gray-50 p-8 sm:p-10 rounded-2xl border border-gray-200 flex flex-col h-full"
              >
                <div className="w-14 h-14 bg-white rounded-xl border border-gray-200 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-gray-900" aria-hidden />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {option.title}
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  {option.description}
                </p>
                <ul className="space-y-2 mb-8 flex-grow">
                  {option.examples.map((example) => (
                    <li
                      key={example}
                      className="text-base text-gray-600 flex items-start gap-2"
                    >
                      <span className="text-gray-400 mt-1" aria-hidden>
                        •
                      </span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={option.href}
                  className="inline-block w-full px-6 py-4 bg-gray-900 text-white text-lg font-semibold rounded-lg hover:bg-gray-800 transition-colors text-center"
                >
                  {option.buttonText}
                </Link>
              </div>
            )
          })}
        </div>

        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
            You do not have to change your main phone number right away. Start by
            using your protected number in the places where you want more privacy.
          </p>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
            A family member or trusted helper can help set this up in just a few
            steps.
          </p>
        </div>

        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h3>
            <p className="text-xl text-gray-600">
              Three simple steps to get started
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {setupSteps.map((step) => {
              const StepIcon = step.icon
              return (
                <div key={step.number} className="text-center">
                  <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.number}
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <StepIcon className="w-6 h-6 text-gray-900" aria-hidden />
                  </div>
                  <h4 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h4>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Common Questions
            </h3>
            <p className="text-xl text-gray-600">
              Answers about protected phone numbers
            </p>
          </div>
          <div className="space-y-4">
            {protectedNumberFaqs.map((faq, index) => (
              <div
                key={faq.question}
                className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                  onClick={() =>
                    setOpenFaqIndex(openFaqIndex === index ? null : index)
                  }
                  aria-expanded={openFaqIndex === index}
                >
                  <span className="text-lg font-semibold text-gray-900 pr-8">
                    {faq.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                      openFaqIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 pb-5">
                    <p className="text-lg text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
