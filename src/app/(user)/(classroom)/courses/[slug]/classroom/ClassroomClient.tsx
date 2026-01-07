'use client'

import { ClassroomSidebar } from '@/components/layout/classroom/classroom-sidebar'
import { ClassroomHeader } from '@/components/layout/classroom/classroom-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import LessonContent from './LessonContent'
import { useEffect, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

interface ClassroomClientProps {
  course: any
}

export default function ClassroomClient({ course }: ClassroomClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const activeLessonId = searchParams.get('v')

  const allLessons = useMemo(
    () => course.modules?.flatMap((m: any) => m.lessons) || [],
    [course.modules],
  )

  useEffect(() => {
    if (!activeLessonId && allLessons.length > 0) {
      const firstLessonId = allLessons[0]._key
      router.replace(`${pathname}?v=${firstLessonId}`)
    }
  }, [activeLessonId, allLessons, router, pathname])

  const currentLesson = allLessons.find((l: any) => l._key === activeLessonId) || allLessons[0]
  return (
    <div className='h-screen overflow-hidden [--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex h-full flex-col'>
        <ClassroomHeader course={course} />

        <div className='flex h-[calc(100vh-var(--header-height))] overflow-hidden'>
          <ClassroomSidebar course={course} activeLessonId={activeLessonId} />

          <SidebarInset className='bg-muted/50 overflow-y-auto'>
            <main className='p-4 md:p-6'>
              {currentLesson && <LessonContent lesson={currentLesson} courseSlug={course.slug} />}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
