'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getFileIcon, getLessonType } from '@/constants/course'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/format'
import { CheckCircle, Clock, Download } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import React from 'react'
import CircularProgress from '@/components/ui/circular-progress'
import CopyrightText from '../common/copyright'

interface ClassroomSidebarProps extends React.ComponentProps<typeof Sidebar> {
  course: any
  activeLessonId: string | null
  enrollment?: any
}

export function ClassroomSidebar({
  course,
  activeLessonId,
  enrollment,
  ...props
}: ClassroomSidebarProps) {
  const router = useRouter()
  const params = useParams()
  const { setOpenMobile } = useSidebar()

  // ข้อมูลบทเรียนที่เรียนจบแล้วจาก Firebase
  const completedLessons = enrollment?.completedLessons || []
  const totalProgress = enrollment?.progressPercentage || 0

  // LOGIC: คำนวณเพื่อเปิด Accordion อัตโนมัติไปยัง Module ที่มีบทเรียน Active อยู่
  const defaultOpenModule = React.useMemo(() => {
    if (!activeLessonId) return []
    const foundModule = course.modules?.find((m: any) =>
      m.lessons?.some((l: any) => l._key === activeLessonId),
    )
    return foundModule ? [foundModule._key] : []
  }, [activeLessonId, course.modules])

  /* --- ฟังก์ชันสลับบทเรียน --- */
  const handleLessonChange = (lessonId: string) => {
    setOpenMobile(false)
    router.push(`/courses/${params.slug}/classroom?v=${lessonId}`)
  }

  return (
    <Sidebar
      className='top-(--header-height) h-[calc(100vh-var(--header-height))] border-r'
      style={{ '--sidebar-width': '22rem' } as React.CSSProperties}
      {...props}
    >
      {/* --- ส่วนหัวแสดงความคืบหน้า --- */}
      <SidebarHeader className='shrink-0 border-b bg-white p-6 group-data-[collapsible=icon]:hidden'>
        <div className='mb-2 flex items-center justify-between'>
          <span className='text-sm font-medium'>ความคืบหน้าการเรียน</span>
          <span className='text-primary text-sm font-medium'>{totalProgress}%</span>
        </div>
        <Progress value={totalProgress} className='h-2 bg-slate-100' />
      </SidebarHeader>

      <SidebarContent className='flex flex-col overflow-hidden bg-white'>
        <Tabs defaultValue='timeline' className='flex h-full flex-col'>
          {/* --- แถบเมนูแท็บ --- */}
          <TabsList className='grid h-12 w-full grid-cols-2 rounded-none border-b bg-slate-50/50 p-0 group-data-[collapsible=icon]:hidden'>
            <TabsTrigger
              value='timeline'
              className='hover:text-primary hover:border-b-primary data-[state=active]:text-primary data-[state=active]:border-b-primary cursor-pointer rounded-none transition-all duration-300 ease-in-out'
            >
              เนื้อหาบทเรียน
            </TabsTrigger>

            <TabsTrigger
              value='resources'
              className='hover:text-primary hover:border-b-primary data-[state=active]:text-primary data-[state=active]:border-b-primary cursor-pointer rounded-none transition-all duration-300 ease-in-out'
            >
              เอกสารประกอบ
            </TabsTrigger>
          </TabsList>

          <div className='flex-1 overflow-hidden'>
            <ScrollArea className='h-full'>
              {/* --- รายการบทเรียน --- */}
              <TabsContent value='timeline' className='m-0 border-none p-0'>
                <Accordion type='multiple' className='w-full' defaultValue={defaultOpenModule}>
                  {course.modules.map((module: any, index: number) => {
                    const moduleLessons = module.lessons || []
                    const completedInModule = moduleLessons.filter((l: any) =>
                      completedLessons.includes(l._key),
                    ).length
                    const modulePercent =
                      moduleLessons.length > 0
                        ? Math.round((completedInModule / moduleLessons.length) * 100)
                        : 0

                    return (
                      <AccordionItem
                        key={module._key}
                        value={module._key}
                        className='border-b border-slate-200 last:border-0'
                      >
                        <AccordionTrigger className='cursor-pointer px-5 py-4 transition-colors group-data-[collapsible=icon]:hidden hover:rounded-none hover:bg-slate-200/80 hover:no-underline'>
                          <div className='flex w-full items-center justify-between pr-4'>
                            {/* ฝั่งซ้าย: ชื่อบทเรียน */}
                            <span className='text-left text-sm font-semibold text-slate-700'>
                              บทที่ {index + 1} : {module.title}
                            </span>

                            {/* ✅ ฝั่งขวา: Badge ดีไซน์เดียวกับ CourseDetail */}
                            <div className='flex items-center gap-2'>
                              <div className='flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50/80 px-2 py-1'>
                                <CircularProgress
                                  value={modulePercent}
                                  size={16}
                                  strokeWidth={2.5}
                                />
                                <span className='text-[11px] font-medium text-slate-500'>
                                  {completedInModule}/{moduleLessons.length} หัวข้อ
                                </span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className='pb-0'>
                          <div className='flex flex-col'>
                            {module.lessons?.map((lesson: any) => {
                              const isActive = activeLessonId === lesson._key
                              const isDone = completedLessons.includes(lesson._key)
                              const { icon: LessonIcon } = getLessonType(lesson.lessonType)

                              return (
                                <button
                                  key={lesson._key}
                                  onClick={() => handleLessonChange(lesson._key)}
                                  className={`flex cursor-pointer items-start gap-4 px-5 py-5 text-left transition-all ${
                                    isActive
                                      ? 'border-l-primary bg-primary/10 border-l-4'
                                      : 'border-l-4 border-l-transparent hover:border-l-slate-400 hover:bg-slate-200/50'
                                  } ${'border-b border-slate-50 last:border-b-0'}`}
                                >
                                  {/* ไอคอนบทเรียน พร้อมสถานะ Check */}
                                  <div className='relative mt-0.5 shrink-0'>
                                    <div
                                      className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                                        isActive
                                          ? 'bg-primary text-white'
                                          : isDone
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-slate-100 text-slate-400',
                                      )}
                                    >
                                      {/* ✅ ถ้าเรียนจบแล้วให้โชว์ติ๊กถูก ถ้ายังให้โชว์ไอคอนปกติ */}
                                      {isDone && !isActive ? (
                                        <CheckCircle size={18} />
                                      ) : (
                                        <LessonIcon size={18} />
                                      )}
                                    </div>
                                  </div>

                                  <div className='min-w-0 flex-1'>
                                    <p
                                      className={cn(
                                        'text-sm leading-snug font-medium transition-colors',
                                        isActive
                                          ? 'text-primary'
                                          : isDone
                                            ? 'text-slate-400'
                                            : 'text-slate-700',
                                      )}
                                    >
                                      {lesson.title}
                                    </p>
                                    <div className='mt-2 flex items-center gap-3 text-xs font-normal text-slate-400'>
                                      <span
                                        className={cn(
                                          'rounded px-1.5 py-0.5 text-[10px] font-medium',
                                          isDone
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-slate-100 text-slate-500',
                                        )}
                                      >
                                        {isDone
                                          ? 'เรียนแล้ว'
                                          : getLessonType(lesson.lessonType).label}
                                      </span>
                                      {lesson.lessonDuration > 0 && (
                                        <span className='flex items-center gap-1'>
                                          <Clock className='size-3' />
                                          {formatDuration(lesson.lessonDuration)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </TabsContent>

              {/* --- เอกสารประกอบการเรียน --- */}
              <TabsContent
                value='resources'
                className='m-0 p-3 group-data-[collapsible=icon]:hidden'
              >
                <div className='space-y-1'>
                  {course?.resources?.map((resource: any) => {
                    const fileInfo = getFileIcon(resource.fileType)
                    return (
                      <a
                        key={resource._key}
                        href={resource.fileUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='group flex items-center justify-between rounded-xl border border-transparent p-3 transition-colors hover:border-slate-200 hover:bg-slate-200'
                      >
                        <div className='flex items-center gap-4 overflow-hidden'>
                          {/* ไอคอนไฟล์ */}
                          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-sm'>
                            <img
                              src={fileInfo.icon}
                              alt={fileInfo.label}
                              className='h-full w-full object-contain'
                            />
                          </div>
                          {/* ชื่อไฟล์ */}
                          <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-medium text-slate-700'>
                              {resource.title}
                            </p>
                            <p className='mt-0.5 text-xs font-normal text-slate-400'>
                              {fileInfo.label}
                            </p>
                          </div>
                        </div>
                        <Download className='text-primary size-4' />
                      </a>
                    )
                  })}
                  {!course?.resources?.length && (
                    <div className='p-8 text-center text-sm text-slate-400'>ไม่มีเอกสารประกอบ</div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </SidebarContent>

      {/* --- ส่วนท้าย --- */}
      <SidebarFooter>
        <CopyrightText />
      </SidebarFooter>
    </Sidebar>
  )
}
