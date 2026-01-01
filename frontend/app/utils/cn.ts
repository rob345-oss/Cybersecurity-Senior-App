/**
 * Utility function to merge class names
 * Simple implementation - can be extended with clsx/tailwind-merge if needed
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

