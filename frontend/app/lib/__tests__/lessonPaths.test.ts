import { describe, it, expect } from 'vitest'
import { getLessonPath, getLessonShareUrl, LESSON_LIBRARY_PATH } from '../../lib/lessonPaths'

describe('lessonPaths', () => {
  it('builds lesson library path', () => {
    expect(LESSON_LIBRARY_PATH).toBe('/lessons')
  })

  it('builds lesson detail paths', () => {
    expect(getLessonPath('how-to-spot-tech-support-scams')).toBe(
      '/lessons/how-to-spot-tech-support-scams'
    )
  })

  it('builds share URLs with origin', () => {
    expect(getLessonShareUrl(undefined, 'https://example.com')).toBe('https://example.com/lessons')
    expect(getLessonShareUrl('how-to-spot-tech-support-scams', 'https://example.com')).toBe(
      'https://example.com/lessons/how-to-spot-tech-support-scams'
    )
  })
})
