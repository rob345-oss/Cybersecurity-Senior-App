import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LessonShareButton from '../LessonShareButton'

describe('LessonShareButton', () => {
  const originalShare = navigator.share
  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { origin: 'https://example.com' },
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: originalShare,
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    })
    vi.restoreAllMocks()
  })

  it('uses the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    })

    render(<LessonShareButton slug="how-to-spot-tech-support-scams" title="Tech Support Scams" />)

    fireEvent.click(screen.getByRole('button', { name: /Share lesson: Tech Support Scams/i }))

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({
        title: 'Tech Support Scams',
        text: 'Check out this free scam-awareness lesson: Tech Support Scams',
        url: 'https://example.com/lessons/how-to-spot-tech-support-scams',
      })
    })
    expect(screen.getByText('Shared!')).toBeInTheDocument()
  })

  it('copies the library URL when Web Share is unavailable', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(<LessonShareButton label="Share library" />)

    fireEvent.click(screen.getByRole('button', { name: /Share lesson library/i }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://example.com/lessons')
    })
    expect(screen.getByText('Link copied!')).toBeInTheDocument()
  })
})
