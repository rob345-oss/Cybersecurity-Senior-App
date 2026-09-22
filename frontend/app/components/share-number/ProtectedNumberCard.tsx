'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface ProtectedNumberCardProps {
  formattedNumber: string
  rawNumber?: string
}

export default function ProtectedNumberCard({
  formattedNumber,
  rawNumber,
}: ProtectedNumberCardProps) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const handleCopy = async () => {
    setCopyError(null)
    const textToCopy = rawNumber || formattedNumber
    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopyError('Could not copy the number. Please select and copy it manually.')
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 sm:p-8 text-center shadow-sm">
      <p className="text-sm font-medium text-gray-600 mb-2">Your protected number</p>
      <p
        className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-wide break-all"
        aria-label={`Protected phone number ${formattedNumber}`}
      >
        {formattedNumber}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-6 inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        aria-label="Copy protected phone number"
      >
        {copied ? <Check className="w-5 h-5" aria-hidden /> : <Copy className="w-5 h-5" aria-hidden />}
        {copied ? 'Copied' : 'Copy number'}
      </button>
      <div aria-live="polite" className="mt-3 min-h-[1.25rem]">
        {copied && (
          <p className="text-sm text-green-700">Number copied to clipboard.</p>
        )}
        {copyError && <p className="text-sm text-red-700">{copyError}</p>}
      </div>
    </div>
  )
}
