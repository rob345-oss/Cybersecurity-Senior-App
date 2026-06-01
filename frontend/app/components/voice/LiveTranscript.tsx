'use client'

import { useEffect, useRef } from 'react'

interface LiveTranscriptProps {
  transcript: string
  signals?: string[]
}

export default function LiveTranscript({ transcript, signals = [] }: LiveTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Live transcript</h3>
      <div className="h-32 overflow-y-auto text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
        {transcript ? (
          <p className="whitespace-pre-wrap">{transcript}</p>
        ) : (
          <p className="text-gray-400 italic">Waiting for speech…</p>
        )}
        <div ref={bottomRef} />
      </div>
      {signals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {signals.map((s) => (
            <span
              key={s}
              className="text-xs px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full"
            >
              {s.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
