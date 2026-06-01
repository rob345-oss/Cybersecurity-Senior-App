'use client'

interface ActiveCallBarProps {
  label: string
  durationSeconds: number
  muted: boolean
  onToggleMute: () => void
  onHangUp: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ActiveCallBar({
  label,
  durationSeconds,
  muted,
  onToggleMute,
  onHangUp,
}: ActiveCallBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-900 text-white rounded-xl">
      <div>
        <p className="text-sm text-gray-300">On call</p>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-gray-400">{formatDuration(durationSeconds)}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleMute}
          className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm font-medium"
        >
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button
          type="button"
          onClick={onHangUp}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 text-sm font-medium"
        >
          End call
        </button>
      </div>
    </div>
  )
}
