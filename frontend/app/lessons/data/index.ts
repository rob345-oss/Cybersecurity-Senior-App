import type { Lesson } from '../types'
import { techSupportScamsLesson } from './tech-support-scams'

export const lessons: Lesson[] = [techSupportScamsLesson]

export function getAllLessons(): Lesson[] {
  return lessons
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.slug === slug)
}
