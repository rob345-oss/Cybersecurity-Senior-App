'use client'

import { useState } from 'react'
import { cn } from '@/app/utils/cn'
import { Button, type ButtonProps } from './button'

interface ConfirmButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  label: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
}

export function ConfirmButton({
  label,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'destructive',
  className,
  ...buttonProps
}: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false)

  const handleCancel = () => {
    setConfirming(false)
    onCancel?.()
  }

  const handleConfirm = () => {
    onConfirm()
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div
        role="group"
        aria-label="Confirm action"
        className={cn('inline-flex flex-wrap items-center gap-2', className)}
      >
        <span className="text-base font-medium text-foreground" id="confirm-prompt">
          Are you sure?
        </span>
        <Button
          variant="ghost"
          size={buttonProps.size ?? 'md'}
          onClick={handleCancel}
          aria-describedby="confirm-prompt"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          size={buttonProps.size ?? 'md'}
          onClick={handleConfirm}
          aria-describedby="confirm-prompt"
        >
          {confirmLabel}
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant={variant}
      onClick={() => setConfirming(true)}
      className={className}
      {...buttonProps}
    >
      {label}
    </Button>
  )
}
