import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LessonTextSizeProvider } from '../LessonTextSizeProvider'
import TextSizeToggle from '../TextSizeToggle'

describe('TextSizeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('persists selected text size to localStorage', async () => {
    const user = userEvent.setup()

    render(
      <LessonTextSizeProvider>
        <TextSizeToggle />
      </LessonTextSizeProvider>
    )

    await user.click(screen.getByRole('button', { name: 'Large text size' }))

    expect(localStorage.getItem('lesson-text-size')).toBe('large')
    expect(screen.getByRole('button', { name: 'Large text size' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })
})
