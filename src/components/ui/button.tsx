import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-normal transition-colors duration-200 ease-in-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none ",
  {
    variants: {
      variant: {
        default:
          'cursor-pointer bg-primary text-white hover:bg-primary-hover transition-colors duration-200 ease-in-out',
        destructive:
          'cursor-pointer bg-destructive text-white hover:bg-destructive-hover transition-colors duration-200 ease-in-out shadow-sm',
        outline:
          'cursor-pointer border-2 border-primary bg-white text-primary hover:bg-primary hover:text-white transition-colors duration-200 ease-in-out',
        'outline-muted':
          'cursor-pointer border-2 border-secondary bg-white text-secondary hover:bg-secondary hover:text-white transition-colors duration-200 ease-in-out',
        secondary:
          'cursor-pointer bg-secondary text-white hover:bg-secondary-hover transition-colors duration-200 ease-in-out',
        ghost: 'cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors duration-200 ease-in-out',
        link: 'cursor-pointer text-primary underline-offset-4 hover:underline transition-colors duration-200 ease-in-out',
      },
      size: {
        default: 'h-10 px-5 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-12 rounded-md px-8 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot='button'
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
