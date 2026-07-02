import { AlertTriangle, CheckCircle2, Lightbulb, ListChecks, MessageSquareQuote } from 'lucide-react'
import type { LessonSection } from '../../lessons/types'
import PracticeQuestion from './PracticeQuestion'

interface LessonSectionProps {
  section: LessonSection
}

export default function LessonSectionBlock({ section }: LessonSectionProps) {
  switch (section.type) {
    case 'intro':
      return (
        <section className="bg-white border border-gray-200 rounded-2xl p-8 space-y-4 shadow-sm">
          <h2 className="lesson-h2 font-bold text-gray-900">{section.title}</h2>
          <p className="lesson-body text-gray-900">{section.body}</p>
        </section>
      )

    case 'quotes':
      return (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <MessageSquareQuote className="w-8 h-8 text-gray-700 shrink-0" aria-hidden="true" />
            <h2 className="lesson-h2 font-bold text-gray-900">{section.title}</h2>
          </div>
          {section.intro && (
            <p className="lesson-body text-gray-900">{section.intro}</p>
          )}
          <ul className="space-y-4" role="list">
            {section.quotes.map((quote) => (
              <li
                key={quote}
                className="lesson-body text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-2xl px-6 py-5 italic"
              >
                &ldquo;{quote}&rdquo;
              </li>
            ))}
          </ul>
          <p className="lesson-body text-gray-900 font-medium">
            These messages are designed to make you feel worried, rushed, or confused.
          </p>
        </section>
      )

    case 'warning_sign':
      return (
        <section className="bg-white border-2 border-amber-200 border-l-[6px] border-l-amber-500 rounded-2xl p-8 space-y-4 shadow-sm">
          <div className="flex items-start gap-4">
            <span
              className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-900 font-bold text-xl shrink-0"
              aria-hidden="true"
            >
              {section.number}
            </span>
            <h3 className="lesson-h3 font-bold text-gray-900 pt-2">
              {section.title}
            </h3>
          </div>
          <p className="lesson-body text-gray-900 pl-16">{section.body}</p>
          {section.examples && section.examples.length > 0 && (
            <div className="pl-16 space-y-3">
              <p className="lesson-label font-bold text-gray-900">They may say:</p>
              <ul className="space-y-2" role="list">
                {section.examples.map((example) => (
                  <li
                    key={example}
                    className="lesson-body text-gray-900 font-semibold"
                  >
                    &ldquo;{example}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )

    case 'rule':
      return (
        <section className="bg-gray-900 text-white rounded-2xl p-8 space-y-4 shadow-md">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 shrink-0" aria-hidden="true" />
            <h2 className="lesson-h2 font-bold">{section.title}</h2>
          </div>
          <p className="lesson-body font-semibold leading-relaxed">{section.body}</p>
        </section>
      )

    case 'steps':
      return (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <ListChecks className="w-8 h-8 text-gray-700 shrink-0" aria-hidden="true" />
            <h2 className="lesson-h2 font-bold text-gray-900">{section.title}</h2>
          </div>
          <ol className="space-y-4" role="list">
            {section.steps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-4 bg-white border border-gray-200 rounded-2xl p-6"
              >
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white font-bold text-lg shrink-0"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="lesson-body text-gray-900 pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )

    case 'scenario':
      return (
        <section className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 space-y-5">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-blue-800 shrink-0" aria-hidden="true" />
            <h2 className="lesson-h2 font-bold text-gray-900">{section.title}</h2>
          </div>
          <p className="lesson-body text-gray-900">{section.prompt}</p>
          <p className="lesson-label font-bold text-gray-900">{section.question}</p>
          <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
            <p className="lesson-label font-bold text-gray-700 mb-2">The safe answer is:</p>
            <p className="lesson-body text-gray-900">{section.answer}</p>
          </div>
        </section>
      )

    case 'practice':
      return (
        <section className="bg-white border-2 border-gray-200 rounded-2xl p-8 space-y-6 shadow-sm">
          <h2 className="lesson-h2 font-bold text-gray-900">{section.title}</h2>
          <PracticeQuestion
            question={section.question}
            correctAnswer={section.correctAnswer}
            explanation={section.explanation}
          />
        </section>
      )

    case 'takeaway':
      return (
        <section className="bg-green-50 border-2 border-green-300 rounded-2xl p-8 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-800 shrink-0" aria-hidden="true" />
            <h2 className="lesson-h2 font-bold text-gray-900">{section.title}</h2>
          </div>
          <p className="lesson-body text-gray-900">{section.body}</p>
        </section>
      )

    default:
      return null
  }
}
