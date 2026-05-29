'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'How does Titanium Guardian protect my privacy?',
    answer:
      'We use end-to-end encryption and never share your data with third parties. All processing happens securely, and you maintain full control over your information.',
  },
  {
    question: 'What if I get false positive alerts?',
    answer:
      'Our AI learns from your feedback to reduce false positives over time. You can easily mark alerts as safe, and the system adapts to your preferences.',
  },
  {
    question: 'How easy is it to set up?',
    answer:
      'Setup takes less than 10 minutes. We provide step-by-step guidance, and our support team is available to help if you need assistance.',
  },
  {
    question: 'What devices are supported?',
    answer:
      'Titanium Guardian works on iOS, Android, and web browsers. You can access protection across all your devices with a single account.',
  },
  {
    question: 'What happens if a scam is detected?',
    answer:
      'You receive an immediate alert with specific guidance on what to do. For high-risk situations, we can escalate to your CareCircle members or emergency contacts.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes, all plans come with a 30-day free trial. No credit card required to start. Cancel anytime during the trial with no charges.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <p className="text-xl text-slate-600">Everything you need to know about Titanium Guardian</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <button
                className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-accent"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
              >
                <span className="pr-8 font-semibold text-slate-900">{faq.question}</span>
                <svg
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="border-t border-slate-100 px-6 pb-4 pt-2">
                  <p className="leading-relaxed text-slate-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
