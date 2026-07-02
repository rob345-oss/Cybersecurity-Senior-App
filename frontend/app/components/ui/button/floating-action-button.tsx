'use client'

import { type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/app/utils/cn'
import { Button, type ButtonProps } from './button'

interface FloatingActionButtonProps extends Omit<ButtonProps, 'variant' | 'iconOnly'> {
  icon: LucideIcon
  label: string
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  children?: ReactNode
}

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
}

export function FloatingActionButton({
  icon,
  label,
  position = 'bottom-right',
  size = 'md',
  className,
  children,
  ...buttonProps
}: FloatingActionButtonProps) {
  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      <Button
        variant="fab"
        size={size}
        iconOnly
        leftIcon={icon}
        aria-label={label}
        className={className}
        {...buttonProps}
      >
        {children}
      </Button>
    </div>
  )
}
