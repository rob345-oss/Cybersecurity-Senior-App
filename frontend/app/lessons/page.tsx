import type { Metadata } from 'next'
import Link from 'next/link'
import LessonLibraryGrid from '../components/lessons/LessonLibraryGrid'
import LessonShareButton from '../components/lessons/LessonShareButton'
import { getAllLessons } from './data'
import { getSiteOrigin } from '../lib/siteUrl'
import { getLessonShareUrl } from '../lib/lessonPaths'

const description =
  'Short, practical lessons to help you spot scams before they happen. Free to read and easy to share with family.'

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getSiteOrigin()
  const url = getLessonShareUrl(undefined, origin)

  return {
    title: 'Lesson Library',
    description,
    openGraph: {
      title: 'Titanium Guardian Lesson Library',
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'Titanium Guardian Lesson Library',
      description,
    },
  }
}

export default function LessonsPage() {
  const lessons = getAllLessons()

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Free · No account required</p>
          <h1 className="text-3xl font-bold text-gray-900">Lesson Library</h1>
          <p className="mt-2 text-lg text-gray-600 leading-relaxed max-w-2xl">{description}</p>
        </div>
        <LessonShareButton label="Share library" className="shrink-0" />
      </header>

      <LessonLibraryGrid lessons={lessons} />

      <section className="mt-10 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Know someone who could use this?</h2>
        <p className="text-base text-gray-600 mb-4">
          Share a lesson with a parent, grandparent, or friend. Each link opens the full lesson — no
          sign-up needed.
        </p>
        <div className="flex flex-wrap gap-3">
          <LessonShareButton label="Share library" />
          {lessons.map((lesson) => (
            <LessonShareButton
              key={lesson.id}
              slug={lesson.slug}
              title={lesson.title}
              label={`Share: ${lesson.title}`}
            />
          ))}
        </div>
      </section>

      <p className="mt-8 text-center text-sm text-gray-600">
        Want live coaching during a suspicious call?{' '}
        <Link href="/login" className="font-medium text-gray-900 hover:underline">
          Sign in for CallGuard
        </Link>
      </p>
    </>
  )
}
