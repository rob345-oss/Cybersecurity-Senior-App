'use client'

import { useEffect, useRef } from 'react'
import { useTranslation } from '../../i18n/LanguageProvider'
import type { Dictionary } from '../../i18n/dictionaries/en'

interface LiveTranscriptProps {
  transcript: string
  signals?: string[]
}

function signalLabel(dictionary: Dictionary, key: string): string {
  const signals = dictionary.callguard.signals as Record<string, string>
  return signals[key] ?? key.replace(/_/g, ' ')
}

export default function LiveTranscript({ transcript, signals = [] }: LiveTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const { dictionary: d } = useTranslation()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{d.voice.liveTranscript}</h3>
      <div className="h-32 overflow-y-auto text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
        {transcript ? (
          <p className="whitespace-pre-wrap">{transcript}</p>
        ) : (
          <p className="text-gray-400 italic">{d.voice.waitingSpeech}</p>
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
              {signalLabel(d, s)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
