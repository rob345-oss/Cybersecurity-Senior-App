'use client'

import { useTranslation } from '../../i18n/LanguageProvider'

export default function HowItWorks() {
  const { dictionary: d } = useTranslation()

  const steps = [
    {
      number: '1',
      title: d.howItWorks.step1Title,
      description: d.howItWorks.step1Description,
    },
    {
      number: '2',
      title: d.howItWorks.step2Title,
      description: d.howItWorks.step2Description,
    },
    {
      number: '3',
      title: d.howItWorks.step3Title,
      description: d.howItWorks.step3Description,
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {d.howItWorks.title}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {d.howItWorks.subtitle}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                {step.number}
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
