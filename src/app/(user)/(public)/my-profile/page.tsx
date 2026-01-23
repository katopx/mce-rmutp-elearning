'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { getMyEnrollments, getMyBookmarks } from '@/lib/firebase'
import { getCoursesByIds } from '@/lib/sanity/course-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { User, Clock, ChevronRight, Loader2, BookOpen, LogOut } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

export default function MyProfilePage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const { user, userData, loading: authLoading } = useAuth()
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [favoriteCourses, setFavoriteCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCourseTab, setActiveCourseTab] = useState<'all' | 'in_progress' | 'completed'>('all')
  const defaultTab = tabParam ?? 'info'

  useEffect(() => {
    async function loadData() {
      if (!user) return
      setIsLoading(true)
      try {
        const [enrolledData, bookmarkIds] = await Promise.all([
          getMyEnrollments(user.uid),
          getMyBookmarks(user.uid),
        ])
        const allIds = Array.from(
          new Set([...enrolledData.map((e: any) => e.courseId), ...bookmarkIds]),
        )
        if (allIds.length > 0) {
          const sanityCourses = await getCoursesByIds(allIds)
          const mergedEnrollments = enrolledData.map((enrol: any) => ({
            ...enrol,
            sanityData: sanityCourses.find((c: any) => c._id === enrol.courseId),
          }))
          setEnrollments(mergedEnrollments)
          setFavoriteCourses(sanityCourses.filter((c: any) => bookmarkIds.includes(c._id)))
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    if (!authLoading) loadData()
  }, [user, authLoading])

  // คำนวณจำนวนสำหรับ Fitter
  const counts = useMemo(
    () => ({
      all: enrollments.length,
      in_progress: enrollments.filter((e) => e.progressPercentage > 0 && e.progressPercentage < 100)
        .length,
      completed: enrollments.filter((e) => e.progressPercentage === 100).length,
      not_started: enrollments.filter((e) => e.progressPercentage === 0).length,
    }),
    [enrollments],
  )

  const filteredEnrollments = useMemo(() => {
    if (activeCourseTab === 'all') return enrollments
    if (activeCourseTab === 'completed')
      return enrollments.filter((e) => e.progressPercentage === 100)
    return enrollments.filter((e) => e.progressPercentage > 0 && e.progressPercentage < 100)
  }, [enrollments, activeCourseTab])

  if (authLoading || isLoading)
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='size-8 animate-spin text-blue-600' />
      </div>
    )

  return (
    <main className='min-h-screen bg-slate-50 font-sans'>
      {/* ส่วนหัวหน้าเว็บ */}
      <div className='border-b bg-white'>
        <div className='container mx-auto px-4 py-8'>
          <div className='flex items-center gap-5'>
            <Avatar className='size-20 border'>
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback className='bg-slate-100 text-slate-400'>
                <User size={32} />
              </AvatarFallback>
            </Avatar>
            <div className='space-y-1'>
              <h1 className='text-2xl font-medium text-slate-900'>{user?.displayName}</h1>
              <p className='text-sm font-normal text-slate-500'>{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-10'>
        <Tabs key={defaultTab} defaultValue={defaultTab} className='w-full'>
          <div className='mb-8 flex justify-start'>
            <TabsList className='h-12 rounded-lg border bg-white p-1'>
              <TabsTrigger
                value='info'
                className='rounded-md px-6 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              >
                ข้อมูลบัญชี
              </TabsTrigger>
              <TabsTrigger
                value='courses'
                className='rounded-md px-6 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              >
                หลักสูตรของฉัน
              </TabsTrigger>
              <TabsTrigger
                value='favorites'
                className='rounded-md px-6 text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white'
              >
                รายการโปรด
              </TabsTrigger>
            </TabsList>
          </div>

          {/* --- Tab: หลักสูตรของฉัน --- */}
          <TabsContent value='courses' className='space-y-6 outline-none'>
            {/* Fitter ย้ายเข้ามาในนี้แล้ว */}
            <div className='flex justify-end'>
              <div className='flex rounded-md bg-slate-200/50 p-1'>
                <FitterButton
                  label='ทั้งหมด'
                  count={counts.all}
                  active={activeCourseTab === 'all'}
                  onClick={() => setActiveCourseTab('all')}
                />
                <FitterButton
                  label='กำลังเรียน'
                  count={counts.in_progress}
                  active={activeCourseTab === 'in_progress'}
                  onClick={() => setActiveCourseTab('in_progress')}
                />
                <FitterButton
                  label='เรียนจบแล้ว'
                  count={counts.completed}
                  active={activeCourseTab === 'completed'}
                  onClick={() => setActiveCourseTab('completed')}
                />
              </div>
            </div>

            <div className='space-y-3'>
              {filteredEnrollments.map((enrol) => (
                <CourseListItem key={enrol.id} enrol={enrol} />
              ))}
              {filteredEnrollments.length === 0 && <EmptyState text='ไม่พบหลักสูตรที่ลงทะเบียน' />}
            </div>
          </TabsContent>

          {/* --- Tab: รายการโปรด --- */}
          <TabsContent
            value='favorites'
            className='grid grid-cols-1 gap-4 outline-none md:grid-cols-2'
          >
            {favoriteCourses.map((course) => (
              <FavoriteItem key={course._id} course={course} />
            ))}
            {favoriteCourses.length === 0 && <EmptyState text='ยังไม่มีรายการที่บันทึกไว้' />}
          </TabsContent>

          {/* --- Tab: ข้อมูลบัญชี --- */}
          <TabsContent value='info' className='outline-none'>
            <div className='max-w-3xl rounded-xl border bg-white p-8'>
              <h3 className='mb-6 border-b pb-4 text-lg font-medium'>รายละเอียดบัญชี</h3>
              <div className='space-y-6'>
                <InfoField label='ชื่อ-นามสกุล' value={user?.displayName} />
                <InfoField label='อีเมลบัญชี' value={user?.email} />
                <InfoField
                  label='วันที่เข้าร่วมระบบ'
                  value={
                    userData?.createdAt
                      ? userData.createdAt.toDate
                        ? userData.createdAt.toDate().toLocaleDateString('th-TH')
                        : new Date(userData.createdAt).toLocaleDateString('th-TH')
                      : '-'
                  }
                />
                <InfoField
                  label='เข้าสู่ระบบล่าสุด'
                  value={
                    userData?.lastLogin ? new Date(userData.lastLogin).toLocaleString('th-TH') : '-'
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

// --- Internal Components ---

function FitterButton({ label, count, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[11px] font-medium transition-all',
        active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700',
      )}
    >
      {label} <span className='opacity-60'>({count})</span>
    </button>
  )
}

function CourseListItem({ enrol }: { enrol: any }) {
  const course = enrol.sanityData
  if (!course) return null
  return (
    <div className='flex items-center gap-5 rounded-lg border bg-white p-3 transition-all hover:border-blue-200'>
      {/* 🎯 ปรับรูปให้เป็นภาพเต็ม ไม่ Crop (ใช้ aspect-video และ object-contain) */}
      <div className='aspect-video w-24 shrink-0 overflow-hidden rounded border border-slate-100 bg-slate-50 md:w-32'>
        <img src={course.image} className='size-full object-contain' alt={course.title} />
      </div>
      <div className='min-w-0 flex-1'>
        <h4 className='truncate text-[15px] font-medium text-slate-800'>{course.title}</h4>
        <div className='mt-2 flex items-center gap-3'>
          <div className='w-24 md:w-32'>
            <Progress value={enrol.progressPercentage} className='h-1.5 bg-slate-100' />
          </div>
          <span className='text-[11px] font-medium text-blue-600'>{enrol.progressPercentage}%</span>
          <span className='text-[10px] text-slate-300'>|</span>
          <span className='flex items-center gap-1 text-[10px] font-normal text-slate-400'>
            <Clock size={10} /> ล่าสุด{' '}
            {new Date(enrol.lastAccessed?.seconds * 1000).toLocaleDateString('th-TH')}
          </span>
        </div>
      </div>
      <Link href={`/courses/${course.slug}/classroom`}>
        <Button size='sm' className='h-8 bg-blue-600 px-5 text-xs font-medium hover:bg-blue-700'>
          เรียนต่อ
        </Button>
      </Link>
    </div>
  )
}

function FavoriteItem({ course }: { course: any }) {
  return (
    <div className='flex gap-4 rounded-lg border bg-white p-3 transition-all hover:border-blue-200'>
      <div className='aspect-video w-24 shrink-0 overflow-hidden rounded border border-slate-100 bg-slate-50'>
        <img src={course.image} className='size-full object-contain' alt={course.title} />
      </div>
      <div className='flex min-w-0 flex-1 flex-col justify-between py-0.5'>
        <div>
          <h4 className='line-clamp-1 text-[14px] font-medium text-slate-800'>{course.title}</h4>
          <p className='mt-1 line-clamp-1 text-[11px] font-normal text-slate-400'>
            {course.shortDescription}
          </p>
        </div>
        <Link href={`/courses/${course.slug}`}>
          <span className='flex items-center gap-0.5 text-[11px] font-medium text-blue-600 hover:underline'>
            รายละเอียดคอร์ส <ChevronRight size={12} />
          </span>
        </Link>
      </div>
    </div>
  )
}

function InfoField({ label, value }: any) {
  return (
    <div className='flex flex-col md:flex-row md:items-center'>
      <span className='w-44 shrink-0 text-xs font-normal tracking-tight text-slate-400 uppercase'>
        {label}
      </span>
      <span className='text-sm font-medium text-slate-700'>{value || '-'}</span>
    </div>
  )
}

function EmptyState({ text }: any) {
  return (
    <div className='rounded-lg border border-dashed bg-white py-20 text-center text-[11px] font-normal text-slate-400 italic'>
      {text}
    </div>
  )
}
