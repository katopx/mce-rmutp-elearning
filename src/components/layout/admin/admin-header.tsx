'use client'

import { UserButton } from '@/components/layout/common/user-button'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSidebar } from '@/components/ui/sidebar'
import { Command, Menu } from 'lucide-react'

export function AdminHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className='bg-background font-prompt sticky top-0 z-50 flex h-16 w-full items-center border-b shadow-sm'>
      <div className='flex w-full items-center justify-between px-6'>
        {/* --- Left Group --- */}
        <div className='flex shrink-0 items-center gap-4'>
          {/* Menu Button */}
          <Button
            className='size-9 cursor-pointer hover:bg-slate-100'
            variant='ghost'
            size='icon'
            onClick={toggleSidebar}
          >
            <Menu className='size-5 text-slate-600' />
          </Button>

          <Separator orientation='vertical' className='hidden h-6 sm:block' />
          {/* Logo Section */}
          <div className='hidden items-center gap-3 sm:flex'>
            <div className='flex aspect-square size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm'>
              <Command className='size-5' />
            </div>
            {/* Logo Text */}
            <div className='flex flex-col leading-tight'>
              <span className='text-base font-semibold tracking-tight text-slate-900'>
                McE RMUTP
              </span>
              <span className='text-xs font-medium text-slate-500'>Admin Dashboard</span>
            </div>
          </div>
        </div>

        {/* --- Profile --- */}
        <UserButton align='end' />
      </div>
    </header>
  )
}
