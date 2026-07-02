'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { getLessonShareUrl } from '../../lib/lessonPaths'

interface LessonShareButtonProps {
  slug?: string
  title?: string
  label?: string
  className?: string
}

export default function LessonShareButton({
  slug,
  title,
  label = 'Share',
  className = '',
}: LessonShareButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared'>('idle')

  const handleShare = async () => {
    const url = getLessonShareUrl(slug, window.location.origin)
    const shareTitle = title ?? 'Titanium Guardian Lesson Library'
    const shareText = title
      ? `Check out this free scam-awareness lesson: ${title}`
      : 'Free scam-awareness lessons from Titanium Guardian — no account required.'

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url,
        })
        setStatus('shared')
      } else {
        await navigator.clipboard.writeText(url)
        setStatus('copied')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      try {
        await navigator.clipboard.writeText(url)
        setStatus('copied')
      } catch {
        setStatus('idle')
      }
    }

    window.setTimeout(() => setStatus('idle'), 2500)
  }

  const statusLabel =
    status === 'copied' ? 'Link copied!' : status === 'shared' ? 'Shared!' : label

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors ${className}`}
      aria-label={title ? `Share lesson: ${title}` : 'Share lesson library'}
    >
      <Share2 className="w-4 h-4" aria-hidden="true" />
      {statusLabel}
    </button>
  )
}
