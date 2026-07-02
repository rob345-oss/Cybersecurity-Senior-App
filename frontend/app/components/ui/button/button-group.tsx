'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { cn } from '@/app/utils/cn'
import { type ButtonSize, type ButtonVariant } from './button-variants'

interface ButtonGroupContextValue {
  size?: ButtonSize
  variant?: ButtonVariant
}

const ButtonGroupContext = createContext<ButtonGroupContextValue>({})

export function useButtonGroupContext() {
  return useContext(ButtonGroupContext)
}

interface ButtonGroupProps {
  children: ReactNode
  size?: ButtonSize
  variant?: ButtonVariant
  className?: string
  orientation?: 'horizontal' | 'vertical'
  'aria-label'?: string
}

export function ButtonGroup({
  children,
  size,
  variant,
  className,
  orientation = 'horizontal',
  'aria-label': ariaLabel,
}: ButtonGroupProps) {
  return (
    <ButtonGroupContext.Provider value={{ size, variant }}>
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn(
          'inline-flex',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          '[&>button]:rounded-none',
          '[&>a]:rounded-none',
          orientation === 'horizontal'
            ? '[&>*:first-child]:rounded-l-button [&>*:last-child]:rounded-r-button'
            : '[&>*:first-child]:rounded-t-button [&>*:last-child]:rounded-b-button',
          '[&>*:not(:first-child)]:border-l-0',
          orientation === 'vertical' && '[&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-t-0',
          className
        )}
      >
        {children}
      </div>
    </ButtonGroupContext.Provider>
  )
}
