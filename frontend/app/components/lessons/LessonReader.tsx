import Link from 'next/link'
import type { Lesson } from '../../lessons/types'
import LessonSectionBlock from './LessonSection'

interface LessonReaderProps {
  lesson: Lesson
}

const moduleLabels: Record<string, string> = {
  callguard: 'CallGuard',
  moneyguard: 'MoneyGuard',
  inboxguard: 'InboxGuard',
  identitywatch: 'IdentityWatch',
}

export default function LessonReader({ lesson }: LessonReaderProps) {
  const warningSignSections = lesson.sections.filter((s) => s.type === 'warning_sign')
  const otherSections = lesson.sections.filter((s) => s.type !== 'warning_sign')

  const introAndQuotes = otherSections.filter(
    (s) => s.type === 'intro' || s.type === 'quotes'
  )
  const middleSections = otherSections.filter(
    (s) =>
      s.type !== 'intro' &&
      s.type !== 'quotes' &&
      s.type !== 'takeaway'
  )
  const takeawaySection = otherSections.find((s) => s.type === 'takeaway')

  return (
    <article className="max-w-3xl">
      <Link
        href="/dashboard/lessons"
        className="inline-flex items-center text-base font-medium text-gray-600 hover:text-gray-900 mb-6"
      >
        ← Back to library
      </Link>

      <header className="mb-8">
        <p className="text-sm font-medium text-gray-500 mb-2">
          {lesson.estimatedMinutes} min · {lesson.difficulty}
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{lesson.title}</h1>
        <p className="text-lg text-gray-600 leading-relaxed">{lesson.summary}</p>
        {lesson.relatedModules.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {lesson.relatedModules.map((mod) => (
              <span
                key={mod}
                className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full"
              >
                {moduleLabels[mod] ?? mod}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-10">
        {introAndQuotes.map((section, index) => (
          <LessonSectionBlock key={`${section.type}-${index}`} section={section} />
        ))}

        {warningSignSections.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">Things to Notice</h2>
            <div className="space-y-4">
              {warningSignSections.map((section) => (
                <LessonSectionBlock key={`warning-${section.number}`} section={section} />
              ))}
            </div>
          </section>
        )}

        {middleSections.map((section, index) => (
          <LessonSectionBlock key={`${section.type}-${index}`} section={section} />
        ))}

        {takeawaySection && (
          <LessonSectionBlock section={takeawaySection} />
        )}
      </div>

      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to practice?</h3>
          <p className="text-base text-gray-600 mb-4">
            Use CallGuard during a suspicious call to get live coaching on the warning signs you
            just learned.
          </p>
          <Link
            href="/dashboard/callguard"
            className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Practice with CallGuard →
          </Link>
        </div>
      </footer>
    </article>
  )
}
