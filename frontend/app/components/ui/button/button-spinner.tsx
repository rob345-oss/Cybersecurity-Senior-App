import { Loader2 } from 'lucide-react'
import { cn } from '@/app/utils/cn'
import { ICON_SIZES, type ButtonSize } from './button-variants'

interface ButtonSpinnerProps {
  size?: ButtonSize
  className?: string
}

export function ButtonSpinner({ size = 'md', className }: ButtonSpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin', ICON_SIZES[size], className)}
      aria-hidden="true"
    />
  )
}
