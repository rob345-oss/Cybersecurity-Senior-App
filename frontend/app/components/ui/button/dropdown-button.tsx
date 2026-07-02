'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/app/utils/cn'
import { Button, type ButtonProps } from './button'

export interface DropdownButtonItem {
  id: string
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
}

interface DropdownButtonProps extends Omit<ButtonProps, 'onClick' | 'children' | 'rightIcon'> {
  label: string
  items: DropdownButtonItem[]
  menuAriaLabel?: string
}

export function DropdownButton({
  label,
  items,
  menuAriaLabel = 'Open menu',
  variant = 'secondary',
  size = 'md',
  leftIcon: LeftIcon,
  className,
  ...buttonProps
}: DropdownButtonProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const menuId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setActiveIndex(0)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, close])

  const handleMenuKeyDown = (event: React.KeyboardEvent) => {
    const enabledIndices = items
      .map((item, index) => (item.disabled ? -1 : index))
      .filter((index) => index >= 0)

    if (enabledIndices.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const currentPos = enabledIndices.indexOf(activeIndex)
      const nextPos = (currentPos + 1) % enabledIndices.length
      setActiveIndex(enabledIndices[nextPos])
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      const currentPos = enabledIndices.indexOf(activeIndex)
      const nextPos = (currentPos - 1 + enabledIndices.length) % enabledIndices.length
      setActiveIndex(enabledIndices[nextPos])
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const item = items[activeIndex]
      if (item && !item.disabled) {
        item.onClick()
        close()
      }
    } else if (event.key === 'Tab') {
      close()
    }
  }

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <Button
        ref={triggerRef}
        variant={variant}
        size={size}
        leftIcon={LeftIcon}
        rightIcon={ChevronDown}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={menuAriaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(open && 'ring-2 ring-primary-ring ring-offset-2')}
        {...buttonProps}
      >
        {label}
      </Button>

      {open && (
        <ul
          id={menuId}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'absolute left-0 top-full z-50 mt-1 min-w-full',
            'rounded-button border border-slate-200 bg-white py-1 shadow-button-hover'
          )}
        >
          {items.map((item, index) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                tabIndex={index === activeIndex ? 0 : -1}
                className={cn(
                  'w-full px-4 py-2 text-left text-base',
                  'hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  item.destructive ? 'text-destructive' : 'text-foreground',
                  index === activeIndex && 'bg-slate-50'
                )}
                onClick={() => {
                  item.onClick()
                  close()
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
