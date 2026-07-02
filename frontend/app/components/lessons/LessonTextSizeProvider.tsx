'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type LessonTextSize = 'comfortable' | 'large' | 'extra-large'

const STORAGE_KEY = 'lesson-text-size'

interface LessonTextSizeContextValue {
  textSize: LessonTextSize
  setTextSize: (size: LessonTextSize) => void
}

const LessonTextSizeContext = createContext<LessonTextSizeContextValue | null>(null)

function isValidSize(value: string | null): value is LessonTextSize {
  return value === 'comfortable' || value === 'large' || value === 'extra-large'
}

export function LessonTextSizeProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSizeState] = useState<LessonTextSize>('comfortable')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isValidSize(stored)) {
      setTextSizeState(stored)
    }
  }, [])

  const setTextSize = useCallback((size: LessonTextSize) => {
    setTextSizeState(size)
    localStorage.setItem(STORAGE_KEY, size)
  }, [])

  return (
    <LessonTextSizeContext.Provider value={{ textSize, setTextSize }}>
      <div className={`lesson-reader lesson-text-${textSize}`}>{children}</div>
    </LessonTextSizeContext.Provider>
  )
}

export function useLessonTextSize() {
  const context = useContext(LessonTextSizeContext)
  if (!context) {
    throw new Error('useLessonTextSize must be used within LessonTextSizeProvider')
  }
  return context
}
