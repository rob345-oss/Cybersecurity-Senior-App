import { cn } from '@/app/utils/cn'

interface ButtonBadgeProps {
  value: string | number
  className?: string
}

export function ButtonBadge({ value, className }: ButtonBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'bg-white/20 px-1.5 py-0.5 text-xs font-bold leading-none',
        'min-w-[1.25rem]',
        className
      )}
      aria-hidden="true"
    >
      {value}
    </span>
  )
}

interface ButtonNotificationDotProps {
  className?: string
}

export function ButtonNotificationDot({ className }: ButtonNotificationDotProps) {
  return (
    <span
      className={cn(
        'absolute -right-0.5 -top-0.5 size-2.5 rounded-full',
        'bg-destructive ring-2 ring-white',
        className
      )}
      aria-hidden="true"
    />
  )
}

interface ButtonShortcutProps {
  shortcut: string
  className?: string
}

export function ButtonShortcut({ shortcut, className }: ButtonShortcutProps) {
  return (
    <kbd
      className={cn(
        'ml-1 inline-flex items-center rounded border border-white/30',
        'bg-white/10 px-1.5 py-0.5 text-xs font-medium',
        'font-mono leading-none',
        className
      )}
      aria-hidden="true"
    >
      {shortcut}
    </kbd>
  )
}
