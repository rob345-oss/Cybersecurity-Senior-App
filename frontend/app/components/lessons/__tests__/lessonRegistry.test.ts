import { describe, it, expect } from 'vitest'
import { getAllLessons, getLessonBySlug } from '../../../lessons/data'

describe('lesson registry', () => {
  it('returns all lessons', () => {
    const lessons = getAllLessons()
    expect(lessons.length).toBeGreaterThan(0)
    expect(lessons[0].title).toBe('How to Spot Tech Support Scams')
  })

  it('finds lesson by slug', () => {
    const lesson = getLessonBySlug('how-to-spot-tech-support-scams')
    expect(lesson).toBeDefined()
    expect(lesson?.id).toBe('tech-support-scams')
    expect(lesson?.relatedModules).toContain('callguard')
    expect(lesson?.relatedSignals).toContain('tech_support')
  })

  it('returns undefined for unknown slug', () => {
    expect(getLessonBySlug('unknown-lesson')).toBeUndefined()
  })
})
