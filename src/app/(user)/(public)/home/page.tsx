'use client'

import { useState, useEffect } from 'react'
import { client } from '@/sanity/lib/client'
import { useAuth } from '@/contexts/auth-context'
import { getMyEnrollments } from '@/lib/firebase'
import { getCoursesByIds } from '@/lib/sanity/course-actions'
import { formatDuration } from '@/utils/format'
import { Clock, ImageIcon, User, PlayCircle, Sparkles, ChevronRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [newCourses, setNewCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true)
      try {
        // 1. ดึงหลักสูตรใหม่ล่าสุด (4 คอร์ส)
        const newQuery = `*[_type == "course" && status == "published"] | order(_createdAt desc)[0...4] {
          _id, title, "slug": slug.current, shortDescription,
          "image": image.asset->url, "category": (category[0]->title),
          "instructor": instructor->name,
          "courseDuration": math::sum(modules[].lessons[].lessonDuration)
        }`
        const newRes = await client.fetch(newQuery)
        setNewCourses(newRes)

        // 2. ถ้า Login แล้ว ให้ดึงคอร์สที่กำลังเรียนอยู่
        if (user) {
          const enrollments = await getMyEnrollments(user.uid)
          const inProgress = enrollments
            .filter((e: any) => e.progressPercentage < 100)
            .sort((a: any, b: any) => b.lastAccessed - a.lastAccessed)
            .slice(0, 4) // ปรับให้โชว์สูงสุด 4 คอร์สเพื่อให้ Grid สวยเหมือนกัน

          if (inProgress.length > 0) {
            const ids = inProgress.map((e: any) => e.courseId)
            const sanityData = await getCoursesByIds(ids)
            const merged = inProgress.map((enrol: any) => ({
              ...enrol,
              sanityData: sanityData.find((c: any) => c._id === enrol.courseId),
            }))
            setEnrolledCourses(merged)
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) loadHomeData()
  }, [user, authLoading])

  if (loading)
    return <div className='animate-pulse p-20 text-center text-slate-400'>กำลังโหลดหน้าแรก...</div>

  return (
    <div className='mx-auto max-w-7xl space-y-20 p-6 md:p-8'>
      {/* Section: เรียนต่อจากเดิม */}
      {user && enrolledCourses.length > 0 && (
        <section>
          <div className='mb-8 flex items-center justify-between'>
            <div>
              <h1 className='text-2xl font-semibold text-slate-900'>เรียนต่อจากเดิม</h1>
              <p className='text-slate-500'>หลักสูตรที่กำลังเรียนอยู่</p>
            </div>
            <Link
              href='/my-profile?tab=courses'
              className='flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline'
            >
              ดูทั้งหมด <ChevronRight size={14} />
            </Link>
          </div>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {enrolledCourses.map((item) => (
              <CourseCard
                key={item.id}
                course={item.sanityData}
                progress={item.progressPercentage}
                isContinue
              />
            ))}
          </div>
        </section>
      )}

      {/* Section: หลักสูตรใหม่ล่าสุด */}
      <section>
        <div className='mb-8'>
          <h1 className='text-2xl font-semibold text-slate-900'>หลักสูตรใหม่ล่าสุด</h1>
          <p className='text-slate-500'>หลักสูตรที่เพิ่มเข้ามาล่าสุด</p>
        </div>
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {newCourses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
        <div className='mt-12 text-center'>
          <Link href='/courses'>
            <Button
              variant='outline'
              className='h-11 rounded-xl border-slate-200 px-10 font-medium text-slate-600'
            >
              สำรวจหลักสูตรทั้งหมด
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

// --- Component: Card หลักสูตร (ใช้ร่วมกันทั้งหน้าเพื่อให้สไตล์เดียวกัน) ---
function CourseCard({
  course,
  progress,
  isContinue,
}: {
  course: any
  progress?: number
  isContinue?: boolean
}) {
  if (!course) return null

  return (
    <Link
      href={`/courses/${course.slug}${isContinue ? '/classroom' : ''}`}
      className='group block h-full'
    >
      <div className='flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-md'>
        {/* Image Area (ตรงตามหน้า Courses เป๊ะ) */}
        <div className='relative aspect-video overflow-hidden bg-slate-100'>
          {course.image ? (
            <img
              src={course.image}
              alt={course.title}
              className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center'>
              <ImageIcon className='text-slate-300' />
            </div>
          )}

          {/* ถ้าเป็นคอร์สที่เรียนค้างอยู่ ให้โชว์ Overlay "เรียนต่อ" ตอน Hover */}
          {isContinue && (
            <div className='absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100'>
              <div className='rounded-full bg-white/90 p-2 text-blue-600'>
                <PlayCircle size={24} />
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className='flex flex-1 flex-col p-5'>
          <span className='mb-2 w-fit rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600'>
            {course.category}
          </span>
          <h3 className='mb-2 line-clamp-2 text-base leading-snug font-medium text-slate-900'>
            {course.title}
          </h3>

          {/* Progress Bar (สำหรับส่วนที่เรียนต่อ) */}
          {isContinue && progress !== undefined && (
            <div className='mt-1 mb-4 space-y-1.5'>
              <div className='flex justify-between text-[10px] font-medium text-blue-600'>
                <span>ความคืบหน้า</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className='h-1 bg-slate-100 [&>div]:bg-blue-600' />
            </div>
          )}

          {!isContinue && (
            <p className='mb-5 line-clamp-2 flex-1 text-sm font-normal text-slate-500'>
              {course.shortDescription}
            </p>
          )}

          <div className='mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-500'>
            <div className='flex items-center gap-1.5 truncate'>
              <User size={13} className='opacity-70' />
              <span className='truncate'>{course.instructor}</span>
            </div>
            {course.courseDuration > 0 && (
              <div className='flex items-center gap-1.5 whitespace-nowrap'>
                <Clock size={13} className='opacity-70' />
                {formatDuration(course.courseDuration)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
