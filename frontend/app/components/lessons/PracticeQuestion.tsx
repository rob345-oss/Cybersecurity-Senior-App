'use client'

import { useState } from 'react'

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

  const handleSelect = (answer: 'safe' | 'suspicious') => {
    setSelected(answer)
  }

  return (
    <div className="space-y-4">
      <p className="text-lg text-gray-800 leading-relaxed">{question}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleSelect('safe')}
          className={`px-5 py-2.5 rounded-lg text-base font-medium border transition-colors ${
            selected === 'safe'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
          }`}
        >
          Safe
        </button>
        <button
          type="button"
          onClick={() => handleSelect('suspicious')}
          className={`px-5 py-2.5 rounded-lg text-base font-medium border transition-colors ${
            selected === 'suspicious'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'
          }`}
        >
          Suspicious
        </button>
      </div>
      {selected && (
        <div
          className={`rounded-lg border p-4 ${
            selected === correctAnswer
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <p className="text-base font-semibold text-gray-900 mb-1">
            {selected === correctAnswer ? 'Correct!' : 'Not quite.'}
          </p>
          <p className="text-base text-gray-700 leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  )
}
