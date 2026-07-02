import type { Metadata } from 'next'
import Link from 'next/link'
import LessonReader from '../components/lessons/LessonReader'
import { getLessonBySlug } from './data'
import { getSiteOrigin } from '../lib/siteUrl'
import { getLessonShareUrl, LESSON_LIBRARY_PATH } from '../lib/lessonPaths'

interface LessonDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: LessonDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const lesson = getLessonBySlug(slug)

  if (!lesson) {
    return {
      title: 'Lesson not found',
    }
  }

  const origin = await getSiteOrigin()
  const url = getLessonShareUrl(slug, origin)

  return {
    title: lesson.title,
    description: lesson.summary,
    openGraph: {
      title: lesson.title,
      description: lesson.summary,
      url,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: lesson.title,
      description: lesson.summary,
    },
  }
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const { slug } = await params
  const lesson = getLessonBySlug(slug)

  if (!lesson) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Lesson not found</h1>
        <p className="text-lg text-gray-600 mb-4">We could not find a lesson with that name.</p>
        <Link
          href={LESSON_LIBRARY_PATH}
          className="inline-block text-base font-medium text-gray-900 hover:underline"
        >
          ← Back to Lesson Library
        </Link>
      </div>
    )
  }

  return <LessonReader lesson={lesson} />
}
