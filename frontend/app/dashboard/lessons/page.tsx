import Link from 'next/link'
import { BookOpen, Clock } from 'lucide-react'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import { getAllLessons } from '../../lessons/data'

const moduleLabels: Record<string, string> = {
  callguard: 'CallGuard',
  moneyguard: 'MoneyGuard',
  inboxguard: 'InboxGuard',
  identitywatch: 'IdentityWatch',
}

export default function LessonsPage() {
  const lessons = getAllLessons()

  return (
    <>
      <DashboardHeader
        title="Lesson Library"
        description="Short, practical lessons to help you spot scams before they happen."
      />

      <section className="mb-10 bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <BookOpen className="w-10 h-10 text-gray-900 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Learn at your own pace</h2>
            <p className="text-xl text-gray-900 leading-relaxed">
              Each lesson uses plain language and large text. Take your time, and use the text
              size buttons when reading a lesson if you want it even bigger.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8">
        {lessons.map((lesson) => (
          <article
            key={lesson.id}
            className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-2 text-lg font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-full">
                <Clock className="w-5 h-5" aria-hidden="true" />
                {lesson.estimatedMinutes} min
              </span>
              <span className="text-lg font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-full capitalize">
                {lesson.difficulty}
              </span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">{lesson.title}</h2>
            <p className="text-xl text-gray-900 leading-relaxed mb-6">{lesson.summary}</p>

            {lesson.relatedModules.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {lesson.relatedModules.map((mod) => (
                  <span
                    key={mod}
                    className="text-lg font-semibold text-gray-800 bg-gray-100 px-4 py-2 rounded-full"
                  >
                    {moduleLabels[mod] ?? mod}
                  </span>
                ))}
              </div>
            )}

            <Link
              href={`/dashboard/lessons/${lesson.slug}`}
              className="inline-flex items-center justify-center min-h-14 px-10 py-4 bg-gray-900 text-white text-xl font-bold rounded-xl hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              Start lesson
            </Link>
          </article>
        ))}
      </div>
    </>
  )
}
