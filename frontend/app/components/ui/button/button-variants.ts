import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2',
    'font-semibold whitespace-nowrap',
    'transition-all duration-button ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'motion-safe:active:scale-[0.98]',
    'select-none',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary text-primary-foreground shadow-button',
          'hover:bg-primary-hover hover:shadow-button-hover',
          'focus-visible:ring-primary-ring',
        ],
        secondary: [
          'bg-secondary text-secondary-foreground shadow-button',
          'hover:bg-secondary-hover hover:shadow-button-hover',
          'focus-visible:ring-secondary-ring',
        ],
        outline: [
          'border-2 border-[var(--outline)] bg-white text-foreground shadow-button',
          'hover:bg-[var(--outline-hover)] hover:border-slate-400',
          'focus-visible:ring-[var(--outline-ring)]',
        ],
        ghost: [
          'bg-transparent text-foreground',
          'hover:bg-[var(--ghost-hover)]',
          'focus-visible:ring-[var(--ghost-ring)]',
        ],
        destructive: [
          'bg-destructive text-destructive-foreground shadow-button',
          'hover:bg-destructive-hover hover:shadow-button-hover',
          'focus-visible:ring-destructive-ring',
        ],
        success: [
          'bg-success text-success-foreground shadow-button',
          'hover:bg-success-hover hover:shadow-button-hover',
          'focus-visible:ring-success-ring',
        ],
        warning: [
          'bg-warning text-warning-foreground shadow-button',
          'hover:bg-warning-hover hover:shadow-button-hover',
          'focus-visible:ring-warning-ring',
        ],
        gradient: [
          'bg-gradient-to-r from-[var(--gradient-from)] to-[var(--gradient-to)] text-white shadow-button',
          'hover:opacity-95 hover:shadow-button-hover',
          'focus-visible:ring-primary-ring',
          'forced-colors:bg-primary forced-colors:bg-none',
        ],
        icon: [
          'bg-secondary text-secondary-foreground shadow-button',
          'hover:bg-secondary-hover hover:shadow-button-hover',
          'focus-visible:ring-secondary-ring',
        ],
        iconCircle: [
          'rounded-full bg-secondary text-secondary-foreground shadow-button',
          'hover:bg-secondary-hover hover:shadow-button-hover',
          'focus-visible:ring-secondary-ring',
        ],
        fab: [
          'rounded-full bg-primary text-primary-foreground shadow-fab',
          'hover:bg-primary-hover hover:shadow-button-hover',
          'focus-visible:ring-primary-ring',
        ],
        link: [
          'bg-transparent text-[var(--link)] underline-offset-4 shadow-none',
          'hover:text-[var(--link-hover)] hover:underline',
          'focus-visible:ring-[var(--link-ring)]',
          'px-0 h-auto min-h-0',
        ],
      },
      size: {
        xs: 'h-9 min-h-9 px-3 text-sm rounded-button gap-1.5 [&_svg]:size-4',
        sm: 'h-10 min-h-10 px-4 text-sm rounded-button gap-1.5 [&_svg]:size-4',
        md: 'h-11 min-h-11 px-5 text-base rounded-button gap-2 [&_svg]:size-5',
        lg: 'h-12 min-h-12 px-6 text-base rounded-button-lg gap-2 [&_svg]:size-5',
        xl: 'h-14 min-h-14 px-8 text-lg rounded-button-lg gap-2.5 [&_svg]:size-6',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      iconOnly: {
        true: '',
        false: '',
      },
      status: {
        default: '',
        success: 'bg-success text-success-foreground hover:bg-success-hover focus-visible:ring-success-ring',
        error: 'bg-destructive text-destructive-foreground hover:bg-destructive-hover focus-visible:ring-destructive-ring',
      },
    },
    compoundVariants: [
      {
        variant: 'icon',
        iconOnly: true,
        size: 'xs',
        className: 'w-9 min-w-9 px-0',
      },
      {
        variant: 'icon',
        iconOnly: true,
        size: 'sm',
        className: 'w-10 min-w-10 px-0',
      },
      {
        variant: 'icon',
        iconOnly: true,
        size: 'md',
        className: 'w-11 min-w-11 px-0',
      },
      {
        variant: 'icon',
        iconOnly: true,
        size: 'lg',
        className: 'w-12 min-w-12 px-0',
      },
      {
        variant: 'icon',
        iconOnly: true,
        size: 'xl',
        className: 'w-14 min-w-14 px-0',
      },
      {
        variant: 'iconCircle',
        iconOnly: true,
        size: 'xs',
        className: 'w-9 min-w-9 px-0',
      },
      {
        variant: 'iconCircle',
        iconOnly: true,
        size: 'sm',
        className: 'w-10 min-w-10 px-0',
      },
      {
        variant: 'iconCircle',
        iconOnly: true,
        size: 'md',
        className: 'w-11 min-w-11 px-0',
      },
      {
        variant: 'iconCircle',
        iconOnly: true,
        size: 'lg',
        className: 'w-12 min-w-12 px-0',
      },
      {
        variant: 'iconCircle',
        iconOnly: true,
        size: 'xl',
        className: 'w-14 min-w-14 px-0',
      },
      {
        variant: 'fab',
        iconOnly: true,
        size: 'md',
        className: 'w-14 min-w-14 h-14 min-h-14 px-0',
      },
      {
        variant: 'fab',
        iconOnly: true,
        size: 'lg',
        className: 'w-16 min-w-16 h-16 min-h-16 px-0',
      },
      {
        variant: 'link',
        size: 'xs',
        className: 'h-auto min-h-0 px-0 text-sm',
      },
      {
        variant: 'link',
        size: 'sm',
        className: 'h-auto min-h-0 px-0 text-sm',
      },
      {
        variant: 'link',
        size: 'md',
        className: 'h-auto min-h-0 px-0 text-base',
      },
      {
        variant: 'link',
        size: 'lg',
        className: 'h-auto min-h-0 px-0 text-base',
      },
      {
        variant: 'link',
        size: 'xl',
        className: 'h-auto min-h-0 px-0 text-lg',
      },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      iconOnly: false,
      status: 'default',
    },
  }
)

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>
export type ButtonStatus = 'success' | 'error' | null

export const ICON_SIZES: Record<NonNullable<ButtonSize>, string> = {
  xs: 'size-4',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-5',
  xl: 'size-6',
}
