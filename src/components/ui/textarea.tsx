import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot='textarea'
      className={cn(
        'placeholder:text-muted-foreground flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition-all outline-none selection:bg-slate-200 selection:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
