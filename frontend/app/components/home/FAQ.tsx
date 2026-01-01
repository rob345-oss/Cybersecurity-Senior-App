'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'How does Titanium Systems protect my privacy?',
    answer: 'We use end-to-end encryption and never share your data with third parties. All processing happens securely, and you maintain full control over your information.',
  },
  {
    question: 'What if I get false positive alerts?',
    answer: 'Our AI learns from your feedback to reduce false positives over time. You can easily mark alerts as safe, and the system adapts to your preferences.',
  },
  {
    question: 'How easy is it to set up?',
    answer: 'Setup takes less than 10 minutes. We provide step-by-step guidance, and our support team is available to help if you need assistance.',
  },
  {
    question: 'What devices are supported?',
    answer: 'Titanium Systems works on iOS, Android, and web browsers. You can access protection across all your devices with a single account.',
  },
  {
    question: 'What happens if a scam is detected?',
    answer: 'You receive an immediate alert with specific guidance on what to do. For high-risk situations, we can escalate to your CareCircle members or emergency contacts.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, all plans come with a 30-day free trial. No credit card required to start. Cancel anytime during the trial with no charges.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Titanium Systems
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

