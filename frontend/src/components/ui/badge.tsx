import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full ring-1 ring-inset whitespace-nowrap font-medium transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-utility-brand-50 text-utility-brand-700 ring-utility-brand-200',
        secondary: 'bg-utility-neutral-50 text-utility-neutral-700 ring-utility-neutral-200',
        success:   'bg-utility-green-50 text-utility-green-700 ring-utility-green-200',
        warning:   'bg-utility-yellow-50 text-utility-yellow-700 ring-utility-yellow-200',
        error:     'bg-utility-red-50 text-utility-red-700 ring-utility-red-200',
        outline:   'bg-transparent text-[var(--color-text-secondary)] ring-[var(--color-border-secondary)]',
      },
      size: {
        sm: 'py-0.5 px-2 text-xs',
        md: 'py-0.5 px-2.5 text-sm',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'sm' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
