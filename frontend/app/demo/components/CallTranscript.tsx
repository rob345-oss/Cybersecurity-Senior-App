'use client'

import { SPEAKER_LABELS, type TranscriptLine } from '../demoData'

interface CallTranscriptProps {
  lines: TranscriptLine[]
  visibleCount: number
  enabled: boolean
}

export default function CallTranscript({ lines, visibleCount, enabled }: CallTranscriptProps) {
  if (!enabled) {
    return (
      <p className="text-sm text-gray-600 rounded-lg border border-dashed border-gray-300 p-4">
        Transcript is turned off. Turn it on to follow the simulated conversation without audio.
      </p>
    )
  }

  const visible = lines.slice(0, Math.max(0, visibleCount))

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 space-y-3 max-h-80 overflow-y-auto"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Simulated call transcript"
    >
      <h3 className="text-base font-semibold text-gray-900">Live transcript</h3>
      {visible.length === 0 ? (
        <p className="text-sm text-gray-500">Waiting for conversation…</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((line) => {
            const isGuard = line.speaker === 'callguard'
            return (
              <li
                key={line.id}
                className={`rounded-lg px-3 py-2 text-left ${
                  isGuard
                    ? 'bg-amber-50 border border-amber-200'
                    : line.speaker === 'caller'
                      ? 'bg-gray-50 border border-gray-200'
                      : 'bg-blue-50 border border-blue-100'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  {SPEAKER_LABELS[line.speaker]}
                </p>
                <p className={`text-sm sm:text-base leading-relaxed ${isGuard ? 'text-amber-950 font-medium' : 'text-gray-900'}`}>
                  {line.text}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
