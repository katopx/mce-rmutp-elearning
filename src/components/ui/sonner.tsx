'use client'

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'light' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group font-prompt'
      richColors
      closeButton
      icons={{
        success: <CircleCheckIcon className='size-5 text-green-500' />,
        info: <InfoIcon className='size-5 text-blue-500' />,
        warning: <TriangleAlertIcon className='size-5 text-amber-500' />,
        error: <OctagonXIcon className='text-destructive size-5' />,
        loading: <Loader2Icon className='text-muted-foreground size-5 animate-spin' />,
      }}
      toastOptions={{
        style: {
          fontFamily: "'Prompt', sans-serif",
        },
        classNames: {
          toast:
            'group-[.toaster]:rounded-lg group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:px-4 group-[.toaster]:py-3',
          title: 'group-[.toast]:text-base group-[.toast]:font-normal',
          description: 'group-[.toast]:text-sm group-[.toast]:text-muted-foreground group-[.toast]:font-normal',
          success:
            'group-[.toast]:bg-green-50 group-[.toast]:text-green-800 group-[.toast]:border-green-100 dark:group-[.toast]:bg-green-950/30 dark:group-[.toast]:text-green-400',
          error:
            'group-[.toast]:bg-red-50 group-[.toast]:text-red-800 group-[.toast]:border-red-100 dark:group-[.toast]:bg-red-950/30 dark:group-[.toast]:text-red-400',
          info: 'group-[.toast]:bg-blue-50 group-[.toast]:text-blue-800 group-[.toast]:border-blue-100',
          warning: 'group-[.toast]:bg-amber-50 group-[.toast]:text-amber-800 group-[.toast]:border-amber-100',

          closeButton:
            'group-[.toast]:bg-background group-[.toast]:text-muted-foreground group-[.toast]:border-border hover:group-[.toast]:bg-accent',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
