'use client'

import { UserButton } from '@/components/layout/common/user-button'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSidebar } from '@/components/ui/sidebar'
import { ChevronLeft, Command, Menu } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ClassroomHeaderProps {
  course: any
}

export function ClassroomHeader({ course }: ClassroomHeaderProps) {
  const { toggleSidebar } = useSidebar()
  const router = useRouter()

  const courseSlug = course?.slug?.current || course?.slug
  const courseTitle = course?.title || 'ไม่พบข้อมูล'

  return (
    <header className='sticky top-0 z-50 flex h-16 w-full items-center border-b border-slate-100/50 bg-white/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.06)] backdrop-blur-md'>
      <div className='flex w-full items-center justify-between px-6'>
        {/* --- Left Group --- */}
        <div className='flex items-center gap-2 overflow-hidden sm:gap-4'>
          {/* Logo Section */}
          <Link
            href='/'
            className='hidden cursor-pointer items-center gap-3 transition-opacity hover:opacity-80 sm:flex'
          >
            <div className='flex aspect-square size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white'>
              <Command className='size-5' />
            </div>
            {/* Logo Text */}
            <div className='flex flex-col'>
              <span className='text-base font-medium text-slate-900'>McE RMUTP</span>
              <span className='text-xs font-normal text-slate-500'>Elearning Platform</span>
            </div>
          </Link>

          <Separator orientation='vertical' className='mx-1 hidden h-8 opacity-50 lg:block' />

          {/* Navigation Group */}
          <div className='flex items-center gap-1'>
            {/* Back Button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push(`/courses/${courseSlug}`)}
              className='h-9 cursor-pointer gap-1.5 px-2 font-normal transition-colors hover:bg-transparent hover:text-blue-600 active:bg-transparent'
            >
              <ChevronLeft className='size-4' />
              <span className='hidden text-sm font-normal sm:inline'>ย้อนกลับ</span>
            </Button>

            <Separator orientation='vertical' className='mx-1 h-6 opacity-50' />

            {/* Menu Button*/}
            <Button
              variant='ghost'
              size='sm'
              className='h-9 cursor-pointer gap-2 px-2 font-normal transition-colors hover:bg-transparent hover:text-blue-600 active:bg-transparent'
              onClick={toggleSidebar}
            >
              <Menu className='size-4' />
              <span className='hidden text-sm font-normal md:inline'>เนื้อหาหลักสูตร</span>
            </Button>
          </div>

          <Separator orientation='vertical' className='mx-1 hidden h-6 opacity-50 md:block' />

          {/* Course title */}
          <span className='max-w-[150px] truncate text-sm font-medium sm:max-w-[250px] md:max-w-[350px] lg:max-w-[500px]'>
            {courseTitle}
          </span>
        </div>

        {/* --- Profile --- */}
        <UserButton align='end' />
      </div>
    </header>
  )
}
