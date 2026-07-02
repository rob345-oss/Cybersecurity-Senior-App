import Link from 'next/link'
import type { Lesson } from '../../lessons/types'
import { getLessonPath } from '../../lib/lessonPaths'

const moduleLabels: Record<string, string> = {
  callguard: 'CallGuard',
  moneyguard: 'MoneyGuard',
  inboxguard: 'InboxGuard',
  identitywatch: 'IdentityWatch',
}

interface LessonLibraryGridProps {
  lessons: Lesson[]
}

export default function LessonLibraryGrid({ lessons }: LessonLibraryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {lessons.map((lesson) => (
        <Link
          key={lesson.id}
          href={getLessonPath(lesson.slug)}
          className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all"
        >
          <p className="text-sm font-medium text-gray-500 mb-2">
            {lesson.estimatedMinutes} min · {lesson.difficulty}
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{lesson.title}</h2>
          <p className="text-base text-gray-600 leading-relaxed mb-4">{lesson.summary}</p>
          {lesson.relatedModules.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lesson.relatedModules.map((mod) => (
                <span
                  key={mod}
                  className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
                >
                  {moduleLabels[mod] ?? mod}
                </span>
              ))}
            </div>
          )}
          <span className="inline-block mt-4 text-sm font-medium text-gray-900">
            Start lesson →
          </span>
        </Link>
      ))}
    </div>
  )
}
