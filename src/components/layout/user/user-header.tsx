'use client'

import { SearchForm } from '@/components/layout/common/search-form'
import { UserButton } from '@/components/layout/common/user-button'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSidebar } from '@/components/ui/sidebar'
import { Command, Menu } from 'lucide-react'

export function UserHeader() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className='sticky top-0 z-50 flex h-16 w-full items-center border-b border-slate-100/50 bg-white/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.06)] backdrop-blur-md'>
      <div className='flex w-full items-center justify-between px-6'>
        {/* --- Left Group --- */}
        <div className='flex shrink-0 items-center gap-4'>
          <Button
            className='group hover:bg-primary/10 size-10 rounded-full transition-all duration-200 ease-linear active:bg-transparent'
            variant='ghost'
            size='icon'
            onClick={toggleSidebar}
          >
            <Menu className='size-5' />
          </Button>

          <Separator orientation='vertical' className='hidden h-6 opacity-50 sm:block' />

          {/* Logo Section */}
          <div className='hidden items-center gap-3 sm:flex'>
            <div className='flex aspect-square size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white'>
              <Command className='size-5' />
            </div>
            {/* Logo Text */}
            <div className='flex flex-col'>
              <span className='text-base font-medium text-slate-900'>McE RMUTP</span>
              <span className='text-xs font-normal text-slate-500'>Elearning Platform</span>
            </div>
          </div>
        </div>

        {/* --- Search Form --- */}
        <div className='flex flex-1 items-center justify-center px-4 sm:px-8'>
          <SearchForm className='w-full max-w-md' />
        </div>

        {/* --- Profile --- */}
        <UserButton align='end' />
      </div>
    </header>
  )
}
