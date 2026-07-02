'use client'

import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { Check, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/app/utils/cn'
import { ButtonSpinner } from './button-spinner'
import { ButtonBadge, ButtonNotificationDot, ButtonShortcut } from './button-slots'
import {
  buttonVariants,
  ICON_SIZES,
  type ButtonSize,
  type ButtonStatus,
  type ButtonVariant,
} from './button-variants'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  status?: ButtonStatus
  leftIcon?: LucideIcon
  rightIcon?: LucideIcon
  iconOnly?: boolean
  badge?: string | number
  showNotificationDot?: boolean
  shortcut?: string
  as?: 'button' | 'a'
  href?: string
  children?: ReactNode
}

function getStatusIcon(status: ButtonStatus, size: ButtonSize) {
  const iconClass = ICON_SIZES[size]
  if (status === 'success') return <Check className={iconClass} aria-hidden="true" />
  if (status === 'error') return <X className={iconClass} aria-hidden="true" />
  return null
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      status = null,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      iconOnly = false,
      badge,
      showNotificationDot = false,
      shortcut,
      className,
      children,
      disabled,
      as = 'button',
      href,
      type,
      ...rest
    } = props

    const isDisabled = disabled || loading
    const statusVariant = status ? status : 'default'
    const statusIcon = status ? getStatusIcon(status, size) : null

    const Left = loading || status ? undefined : LeftIcon
    const Right = loading || status ? undefined : RightIcon

    const content = (
      <>
        {loading && <ButtonSpinner size={size} />}
        {!loading && statusIcon}
        {Left && <Left className={ICON_SIZES[size]} aria-hidden="true" />}
        {!iconOnly && children && <span className="truncate">{children}</span>}
        {!iconOnly && badge !== undefined && <ButtonBadge value={badge} />}
        {!iconOnly && shortcut && <ButtonShortcut shortcut={shortcut} />}
        {Right && <Right className={ICON_SIZES[size]} aria-hidden="true" />}
        {showNotificationDot && <ButtonNotificationDot />}
      </>
    )

    const classes = cn(
      buttonVariants({
        variant,
        size,
        fullWidth,
        iconOnly,
        status: statusVariant,
      }),
      className
    )

    if (as === 'a' && href) {
      const { tabIndex, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement>
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={isDisabled ? undefined : href}
          className={classes}
          aria-disabled={isDisabled || undefined}
          aria-busy={loading || undefined}
          tabIndex={isDisabled ? -1 : tabIndex}
          {...anchorRest}
        >
          {content}
        </a>
      )
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type ?? 'button'}
        disabled={isDisabled}
        className={classes}
        aria-busy={loading || undefined}
        {...(status && !loading
          ? { role: 'status' as const, 'aria-live': 'polite' as const }
          : {})}
        {...rest}
      >
        {content}
      </button>
    )
  }
)

Button.displayName = 'Button'
