import type { Metadata } from 'next'
import { Prompt } from 'next/font/google'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from '@/components/ui/sonner'
import { Suspense } from 'react'
import Loading from './loading'
import NextTopLoader from 'nextjs-toploader'

import './globals.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

const prompt = Prompt({
  variable: '--font-prompt',
  subsets: ['latin', 'thai'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'McE E-Learning Platform',
  description: 'Developed by KATOPX',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='th'>
      <body className={`${prompt.variable} antialiased`}>
        <Suspense fallback={<Loading />}>
          <NextTopLoader
            color='#2563eb'
            showSpinner={false}
            shadow='0 0 10px #2563eb,0 0 5px #2563eb'
          />
          <AuthProvider>
            {children}
            <Toaster position='top-center' />
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  )
}
