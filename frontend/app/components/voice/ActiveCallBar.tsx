'use client'

import { useTranslation } from '../../i18n/LanguageProvider'
import { formatDuration } from '../../i18n/format'

interface ActiveCallBarProps {
  label: string
  durationSeconds: number
  muted: boolean
  onToggleMute: () => void
  onHangUp: () => void
}

export default function ActiveCallBar({
  label,
  durationSeconds,
  muted,
  onToggleMute,
  onHangUp,
}: ActiveCallBarProps) {
  const { dictionary: d } = useTranslation()

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-900 text-white rounded-xl">
      <div>
        <p className="text-sm text-gray-300">{d.voice.onCall}</p>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-gray-400">{formatDuration(durationSeconds)}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleMute}
          className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm font-medium whitespace-nowrap"
        >
          {muted ? d.voice.unmute : d.voice.mute}
        </button>
        <button
          type="button"
          onClick={onHangUp}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 text-sm font-medium whitespace-nowrap"
        >
          {d.voice.endCall}
        </button>
      </div>
    </div>
  )
}
