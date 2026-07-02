'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Lesson } from '../../lessons/types'
import { LessonTextSizeProvider } from './LessonTextSizeProvider'
import LessonSectionBlock from './LessonSection'
import TextSizeToggle from './TextSizeToggle'

interface LessonReaderProps {
  lesson: Lesson
}

const moduleLabels: Record<string, string> = {
  callguard: 'CallGuard',
  moneyguard: 'MoneyGuard',
  inboxguard: 'InboxGuard',
  identitywatch: 'IdentityWatch',
}

function LessonReaderContent({ lesson }: LessonReaderProps) {
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

  const totalSections =
    introAndQuotes.length +
    (warningSignSections.length > 0 ? 1 : 0) +
    middleSections.length +
    (takeawaySection ? 1 : 0)

  return (
    <article className="max-w-2xl mx-auto">
      <nav
        className="sticky top-0 z-20 -mx-4 px-4 py-4 mb-6 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 flex flex-wrap items-center justify-between gap-4"
        aria-label="Lesson navigation"
      >
        <Link
          href="/dashboard/lessons"
          className="inline-flex items-center gap-2 min-h-12 px-4 lesson-label font-semibold text-gray-800 hover:text-gray-900 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          Back to library
        </Link>
        <div className="flex items-center gap-4">
          <span className="lesson-label text-gray-700 font-medium" aria-live="polite">
            {totalSections} sections
          </span>
          <TextSizeToggle />
        </div>
      </nav>

      <header className="mb-10">
        <p className="lesson-label font-semibold text-gray-600 mb-3">
          {lesson.estimatedMinutes} min read · {lesson.difficulty}
        </p>
        <h1 className="lesson-h1 font-bold text-gray-900 mb-4">{lesson.title}</h1>
        <p className="lesson-body text-gray-900">{lesson.summary}</p>
        {lesson.relatedModules.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {lesson.relatedModules.map((mod) => (
              <span
                key={mod}
                className="lesson-label font-semibold text-gray-800 bg-gray-100 px-4 py-2 rounded-full"
              >
                {moduleLabels[mod] ?? mod}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="space-y-12">
        {introAndQuotes.map((section, index) => (
          <LessonSectionBlock key={`${section.type}-${index}`} section={section} />
        ))}

        {warningSignSections.length > 0 && (
          <section className="space-y-6" aria-labelledby="warning-signs-heading">
            <h2 id="warning-signs-heading" className="lesson-h2 font-bold text-gray-900">
              Things to Notice
            </h2>
            <div className="space-y-6">
              {warningSignSections.map((section) => (
                <LessonSectionBlock key={`warning-${section.number}`} section={section} />
              ))}
            </div>
          </section>
        )}

        {middleSections.map((section, index) => (
          <LessonSectionBlock key={`${section.type}-${index}`} section={section} />
        ))}

        {takeawaySection && <LessonSectionBlock section={takeawaySection} />}
      </div>

      <footer className="mt-14 pt-8 border-t-2 border-gray-200">
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm">
          <h3 className="lesson-h3 font-bold text-gray-900 mb-3">Ready to practice?</h3>
          <p className="lesson-body text-gray-900 mb-6">
            Use CallGuard during a suspicious call to get live coaching on the warning signs you
            just learned.
          </p>
          <Link
            href="/dashboard/callguard"
            className="inline-flex items-center justify-center min-h-14 px-8 py-4 bg-gray-900 text-white lesson-label font-bold rounded-xl hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            Practice with CallGuard
          </Link>
        </div>
      </footer>
    </article>
  )
}

export default function LessonReader({ lesson }: LessonReaderProps) {
  return (
    <LessonTextSizeProvider>
      <LessonReaderContent lesson={lesson} />
    </LessonTextSizeProvider>
  )
}
