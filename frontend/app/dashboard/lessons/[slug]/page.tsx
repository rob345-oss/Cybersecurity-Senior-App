import Link from 'next/link'
import LessonReader from '../../components/lessons/LessonReader'
import { getLessonBySlug } from '../../lessons/data'

interface LessonDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const { slug } = await params
  const lesson = getLessonBySlug(slug)

  if (!lesson) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Lesson not found</h1>
          <p className="text-xl text-gray-900 mb-6 leading-relaxed">
            We could not find a lesson with that name.
          </p>
          <Link
            href="/dashboard/lessons"
            className="inline-flex items-center justify-center min-h-14 px-8 py-4 text-xl font-semibold text-gray-900 border-2 border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
          >
            Back to Lesson Library
          </Link>
        </div>
      </div>
    )
  }

  return <LessonReader lesson={lesson} />
}
