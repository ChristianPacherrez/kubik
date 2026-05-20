import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'group relative inline-flex h-max cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-lg font-semibold transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-border-brand)] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-bg-brand-solid)] text-white shadow-xs-skeuomorphic ring-1 ring-inset ring-transparent hover:bg-[var(--color-bg-brand-solid_hover)]',
        secondary:
          'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] shadow-xs-skeuomorphic ring-1 ring-inset ring-[var(--color-border-secondary)] hover:bg-[var(--color-bg-primary_hover)] hover:text-[var(--color-text-secondary_hover)]',
        tertiary:
          'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-primary_hover)] hover:text-[var(--color-text-tertiary_hover)]',
        ghost:
          'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-primary_hover)] hover:text-[var(--color-text-secondary)]',
        outline:
          'border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] shadow-xs hover:bg-[var(--color-bg-primary_hover)]',
        destructive:
          'bg-error-500 text-white shadow-xs-skeuomorphic ring-1 ring-inset ring-transparent hover:bg-error-700',
        link:
          'text-[var(--color-text-brand-secondary)] hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-3.5 py-2.5 text-sm',
        sm:      'h-9 px-3 py-2 text-sm',
        xs:      'h-8 px-2.5 py-1.5 text-sm',
        lg:      'h-11 px-4 py-2.5 text-[1rem]',
        icon:    'h-9 w-9 p-2.5 [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'sm' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
