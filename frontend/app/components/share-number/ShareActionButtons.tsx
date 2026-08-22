'use client'

import { useState } from 'react'
import { copyText, openSmsLink, shareAnotherWay } from '@/app/utils/shareActions'
import { updateShareEvent } from '@/app/share-number/api'
import type { SharingStatus } from '@/app/share-number/api'

interface ShareActionButtonsProps {
  contactId: string
  phone: string
  message: string
  onStatusChange: (status: SharingStatus) => Promise<void>
}

export default function ShareActionButtons({
  contactId,
  phone,
  message,
  onStatusChange,
}: ShareActionButtonsProps) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const recordStatus = async (status: SharingStatus, userMessage: string) => {
    setBusy(true)
    try {
      await updateShareEvent(contactId, { sharing_status: status })
      await onStatusChange(status)
      setFeedback(userMessage)
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const handleSendAsText = async () => {
    const result = openSmsLink(phone, message)
    await recordStatus('share_opened', result.userMessage)
  }

  const handleCopy = async () => {
    const result = await copyText(message)
    if (result.success) {
      await recordStatus('prepared', result.userMessage)
    } else {
      setFeedback(result.userMessage)
    }
  }

  const handleShareAnotherWay = async () => {
    const result = await shareAnotherWay(message)
    if (result.method === 'web_share' && result.success) {
      await recordStatus('share_opened', result.userMessage)
    } else {
      setFeedback(result.userMessage)
      if (result.method === 'copy' && result.success) {
        await updateShareEvent(contactId, { sharing_status: 'prepared' })
        await onStatusChange('prepared')
      }
    }
  }

  const handleMarkShared = async () => {
    await recordStatus(
      'user_confirmed_shared',
      'Marked as shared. Thank you for letting this contact know.'
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSendAsText}
          disabled={busy}
          className="min-h-[44px] px-5 py-3 text-base font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Send as text
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={busy}
          className="min-h-[44px] px-5 py-3 text-base font-semibold rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-50"
        >
          Copy message
        </button>
        <button
          type="button"
          onClick={handleShareAnotherWay}
          disabled={busy}
          className="min-h-[44px] px-5 py-3 text-base font-semibold rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-50"
        >
          Share another way
        </button>
      </div>

      <button
        type="button"
        onClick={handleMarkShared}
        disabled={busy}
        className="min-h-[44px] text-base font-medium text-gray-900 underline hover:no-underline disabled:opacity-50"
      >
        I sent this — mark as shared
      </button>

      {feedback && (
        <p className="text-sm text-gray-700 bg-blue-50 border border-blue-100 rounded-lg p-3" aria-live="polite">
          {feedback}
        </p>
      )}
    </div>
  )
}
