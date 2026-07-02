'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, type ButtonProps } from './button'
import type { ButtonStatus } from './button-variants'

interface AsyncButtonProps extends Omit<ButtonProps, 'onClick' | 'loading' | 'status'> {
  onClick: () => Promise<void>
  statusDuration?: number
  onError?: (error: unknown) => void
}

export function AsyncButton({
  onClick,
  statusDuration = 2000,
  onError,
  children,
  disabled,
  ...buttonProps
}: AsyncButtonProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<ButtonStatus>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearStatusTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => clearStatusTimeout, [clearStatusTimeout])

  const handleClick = async () => {
    if (loading || disabled) return

    setLoading(true)
    setStatus(null)
    clearStatusTimeout()

    try {
      await onClick()
      setStatus('success')
      timeoutRef.current = setTimeout(() => setStatus(null), statusDuration)
    } catch (error) {
      setStatus('error')
      onError?.(error)
      timeoutRef.current = setTimeout(() => setStatus(null), statusDuration)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      loading={loading}
      status={status}
      disabled={disabled}
      onClick={handleClick}
      {...buttonProps}
    >
      {children}
    </Button>
  )
}
