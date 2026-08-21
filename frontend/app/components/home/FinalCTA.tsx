'use client'

import { useState, FormEvent } from 'react'
import { useTranslation } from '../../i18n/LanguageProvider'

export default function FinalCTA() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { dictionary: d } = useTranslation()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    setSubmitted(true)
    setEmail('')
    setIsSubmitting(false)

    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <section id="join-waitlist" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            {d.finalCta.title}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {d.finalCta.subtitle}
          </p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={d.finalCta.emailPlaceholder}
                required
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSubmitting ? d.finalCta.joining : d.finalCta.joinWaitlist}
              </button>
            </div>
            {submitted && (
              <div className="mt-4 p-4 bg-green-500 text-white rounded-lg">
                <p className="font-semibold">{d.finalCta.successTitle}</p>
                <p className="text-sm mt-1">{d.finalCta.successSubtitle}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
