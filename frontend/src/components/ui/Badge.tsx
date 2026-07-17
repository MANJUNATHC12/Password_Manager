import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Badge({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700',
        className,
      )}
    >
      {children}
    </span>
  )
}
