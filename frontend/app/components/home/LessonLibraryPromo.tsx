import Link from 'next/link'
import { BookOpen, Clock, Share2 } from 'lucide-react'
import { getAllLessons } from '../../lessons/data'
import { getLessonPath, LESSON_LIBRARY_PATH } from '../../lib/lessonPaths'
import LessonShareButton from '../lessons/LessonShareButton'

export default function LessonLibraryPromo() {
  const lessons = getAllLessons()

  return (
    <section id="lessons" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-900 mb-4">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              Free Lesson Library
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Learn to spot scams before they happen
            </h2>
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              Short, practical lessons anyone can read — no account required. Share them with family
              so everyone knows the warning signs.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={LESSON_LIBRARY_PATH}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-center"
              >
                Browse Lesson Library
              </Link>
              <LessonShareButton
                label="Share with family"
                className="justify-center px-6 py-3 bg-white"
              />
            </div>
            <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
              <Share2 className="w-4 h-4" aria-hidden="true" />
              Every lesson has a link you can text or email — recipients can read it without signing up.
            </p>
          </div>

          <div className="space-y-4">
            {lessons.map((lesson) => (
              <article
                key={lesson.id}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      {lesson.estimatedMinutes} min · {lesson.difficulty}
                    </p>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{lesson.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{lesson.summary}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={getLessonPath(lesson.slug)}
                    className="text-sm font-medium text-gray-900 hover:underline"
                  >
                    Start lesson →
                  </Link>
                  <LessonShareButton slug={lesson.slug} title={lesson.title} label="Share lesson" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
