import Link from 'next/link'
import DashboardHeader from '../../../components/dashboard/DashboardHeader'
import LessonReader from '../../../components/lessons/LessonReader'
import { getLessonBySlug } from '../../../lessons/data'

interface LessonDetailPageProps {
  params: Promise<{ slug: string }>
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
  const { slug } = await params
  const lesson = getLessonBySlug(slug)

  if (!lesson) {
    return (
      <>
        <DashboardHeader title="Lesson not found" description="This lesson does not exist." />
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-lg text-gray-600 mb-4">
            We could not find a lesson with that name.
          </p>
          <Link
            href="/dashboard/lessons"
            className="inline-block text-base font-medium text-gray-900 hover:underline"
          >
            ← Back to Lesson Library
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <DashboardHeader title={lesson.title} description={lesson.summary} />
      <LessonReader lesson={lesson} />
    </>
  )
}
