'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button, type ButtonProps } from './button'
import type { ButtonStatus } from './button-variants'

interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'loading' | 'status' | 'leftIcon'> {
  value: string
  copiedLabel?: string
  statusDuration?: number
}

export function CopyButton({
  value,
  copiedLabel = 'Copied',
  statusDuration = 2000,
  children = 'Copy',
  ...buttonProps
}: CopyButtonProps) {
  const [status, setStatus] = useState<ButtonStatus>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearStatusTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => clearStatusTimeout, [clearStatusTimeout])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setStatus('success')
      clearStatusTimeout()
      timeoutRef.current = setTimeout(() => setStatus(null), statusDuration)
    } catch {
      setStatus('error')
      clearStatusTimeout()
      timeoutRef.current = setTimeout(() => setStatus(null), statusDuration)
    }
  }

  const label = status === 'success' ? copiedLabel : children

  return (
    <Button
      leftIcon={status === 'success' ? Check : Copy}
      status={status === 'error' ? 'error' : null}
      onClick={handleCopy}
      aria-label={typeof children === 'string' ? `Copy ${children}` : 'Copy to clipboard'}
      {...buttonProps}
    >
      {label}
    </Button>
  )
}
