export const LESSON_LIBRARY_PATH = '/lessons'

export function getLessonPath(slug: string): string {
  return `${LESSON_LIBRARY_PATH}/${slug}`
}

export function getLessonShareUrl(slug?: string, origin = ''): string {
  const path = slug ? getLessonPath(slug) : LESSON_LIBRARY_PATH
  if (!origin) {
    return path
  }
  return `${origin.replace(/\/$/, '')}${path}`
}
