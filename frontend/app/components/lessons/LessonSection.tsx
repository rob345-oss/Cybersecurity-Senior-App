import type { LessonSection } from '../../lessons/types'
import PracticeQuestion from './PracticeQuestion'

interface LessonSectionProps {
  section: LessonSection
}

export default function LessonSectionBlock({ section }: LessonSectionProps) {
  switch (section.type) {
    case 'intro':
      return (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
          <p className="text-lg text-gray-700 leading-relaxed">{section.body}</p>
        </section>
      )

    case 'quotes':
      return (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
          {section.intro && (
            <p className="text-lg text-gray-700 leading-relaxed">{section.intro}</p>
          )}
          <ul className="space-y-2">
            {section.quotes.map((quote) => (
              <li
                key={quote}
                className="text-lg text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 italic"
              >
                &ldquo;{quote}&rdquo;
              </li>
            ))}
          </ul>
          <p className="text-base text-gray-600">
            These messages are designed to make you feel worried, rushed, or confused.
          </p>
        </section>
      )

    case 'warning_sign':
      return (
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
          <h3 className="text-xl font-semibold text-gray-900">
            {section.number}. {section.title}
          </h3>
          <p className="text-lg text-gray-700 leading-relaxed">{section.body}</p>
          {section.examples && section.examples.length > 0 && (
            <div className="space-y-2">
              <p className="text-base font-medium text-gray-800">They may say:</p>
              <ul className="list-disc list-inside space-y-1 text-base text-gray-700">
                {section.examples.map((example) => (
                  <li key={example}>&ldquo;{example}&rdquo;</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )

    case 'rule':
      return (
        <section className="bg-gray-900 text-white rounded-xl p-6 space-y-3">
          <h2 className="text-2xl font-semibold">{section.title}</h2>
          <p className="text-lg leading-relaxed">{section.body}</p>
        </section>
      )

    case 'steps':
      return (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
          <ol className="list-decimal list-inside space-y-3 text-lg text-gray-700 leading-relaxed">
            {section.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      )

    case 'scenario':
      return (
        <section className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
          <p className="text-lg text-gray-800 leading-relaxed">{section.prompt}</p>
          <p className="text-lg font-medium text-gray-900">{section.question}</p>
          <div className="bg-white border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-600 mb-1">The safe answer is:</p>
            <p className="text-lg text-gray-800 leading-relaxed">{section.answer}</p>
          </div>
        </section>
      )

    case 'practice':
      return (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
          <PracticeQuestion
            question={section.question}
            correctAnswer={section.correctAnswer}
            explanation={section.explanation}
          />
        </section>
      )

    case 'takeaway':
      return (
        <section className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
          <p className="text-lg text-gray-800 leading-relaxed">{section.body}</p>
        </section>
      )

    default:
      return null
  }
}
