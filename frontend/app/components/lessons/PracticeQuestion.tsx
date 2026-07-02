'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

interface PracticeQuestionProps {
  question: string
  correctAnswer: 'safe' | 'suspicious'
  explanation: string
}

export default function PracticeQuestion({
  question,
  correctAnswer,
  explanation,
}: PracticeQuestionProps) {
  const [selected, setSelected] = useState<'safe' | 'suspicious' | null>(null)
  const isCorrect = selected === correctAnswer

  const handleSelect = (answer: 'safe' | 'suspicious') => {
    setSelected(answer)
  }

  return (
    <div className="space-y-6">
      <p className="lesson-body text-gray-900 font-medium">{question}</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="button"
          onClick={() => handleSelect('safe')}
          aria-pressed={selected === 'safe'}
          className={`flex-1 min-h-[3.5rem] px-8 py-4 rounded-xl text-xl font-semibold border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 ${
            selected === 'safe'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-900 border-gray-300 hover:border-gray-500'
          }`}
        >
          Safe
        </button>
        <button
          type="button"
          onClick={() => handleSelect('suspicious')}
          aria-pressed={selected === 'suspicious'}
          className={`flex-1 min-h-[3.5rem] px-8 py-4 rounded-xl text-xl font-semibold border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 ${
            selected === 'suspicious'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-gray-900 border-gray-300 hover:border-gray-500'
          }`}
        >
          Suspicious
        </button>
      </div>
      {selected && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl border-2 p-6 flex gap-4 ${
            isCorrect ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'
          }`}
        >
          {isCorrect ? (
            <CheckCircle2 className="w-8 h-8 text-green-700 shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="w-8 h-8 text-amber-700 shrink-0" aria-hidden="true" />
          )}
          <div>
            <p className="lesson-label font-bold text-gray-900 mb-2">
              {isCorrect ? "That's right!" : "Let's try again."}
            </p>
            <p className="lesson-body text-gray-900">{explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
