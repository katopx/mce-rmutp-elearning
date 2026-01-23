'use client'

import { ClassroomHeader } from '@/components/layout/classroom/classroom-header'
import { ClassroomSidebar } from '@/components/layout/classroom/classroom-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import LessonContent from './LessonContent'
// Auth & Firebase
import { RatingModal } from '@/components/layout/classroom/rating-modal'
import { useAuth } from '@/contexts/auth-context'
import { checkEnrollment } from '@/lib/firebase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ClassroomClientProps {
  course: any
}

export default function ClassroomClient({ course }: ClassroomClientProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // State สำหรับเก็บข้อมูล Enrollment จาก Firebase
  const [enrollment, setEnrollment] = useState<any>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [showRatingModal, setShowRatingModal] = useState(false)

  const activeLessonId = searchParams.get('v')

  const allLessons = useMemo(
    () => course.modules?.flatMap((m: any) => m.lessons) || [],
    [course.modules],
  )
  const totalLessons = allLessons.length

  // --------------------------------------------------------
  // 🔒 LOGIC 1: GATEKEEPER (ตรวจสอบสิทธิ์ & Pre-test)
  // --------------------------------------------------------
  useEffect(() => {
    async function verifyAccess() {
      // รอจนกว่า Auth จะโหลดเสร็จ
      if (authLoading) return

      // ถ้าไม่มี User ให้ดีดไปหน้า Login หรือหน้าแรก
      if (!user) {
        // router.replace('/login') // หรือจัดการตาม Flow ของคุณ
        return
      }

      try {
        // 1. ตรวจสอบการลงทะเบียน
        const enrollData = await checkEnrollment(user.uid, course._id)

        if (!enrollData) {
          toast.error('คุณยังไม่ได้ลงทะเบียนเรียนคอร์สนี้')
          router.replace(`/courses/${course.slug}`)
          return
        }

        setEnrollment(enrollData)

        // 2. ตรวจสอบ Pre-test (Gate 1)
        const hasAssessment = course.enableAssessment
        const preTestDone = enrollData.assessmentProgress?.preTest?.isCompleted
        const examId = course.examRef?._ref

        if (hasAssessment && !preTestDone && examId) {
          toast.info('ต้องทำแบบทดสอบก่อนเรียน (Pre-test) ก่อนเข้าสู่บทเรียน', {
            duration: 4000,
          })
          router.replace(`/courses/${course.slug}/assessment/${examId}?mode=pre`)
          return
        }

        // ผ่านทุกด่าน -> อนุญาตให้เข้าเรียน
        setIsCheckingAccess(false)
      } catch (error) {
        console.error('Access verification failed:', error)
        toast.error('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล')
      }
    }

    verifyAccess()
  }, [user, authLoading, course, router])

  // --------------------------------------------------------
  // LOGIC 2: Redirect to first lesson (ถ้าไม่มี parameter v)
  // --------------------------------------------------------

  useEffect(() => {
    if (!isCheckingAccess && !activeLessonId && allLessons.length > 0) {
      const firstLessonId = allLessons[0]._key
      router.replace(`${pathname}?v=${firstLessonId}`)
    }
  }, [activeLessonId, allLessons, router, pathname, isCheckingAccess])

  // หาบทเรียนปัจจุบัน
  const currentLesson = allLessons.find((l: any) => l._key === activeLessonId) || allLessons[0]

  // ✅ Trigger: ตรวจสอบเมื่อเรียนจบ 100% และยังไม่เคยรีวิว
  useEffect(() => {
    if (
      enrollment?.progressPercentage === 100 &&
      enrollment?.assessmentProgress?.postTest?.isPassed && // สอบผ่านแล้วด้วย
      !enrollment?.isRated // และยังไม่เคยรีวิว
    ) {
      // หน่วงเวลา 1.5 วินาทีหลังจากหน้าโหลดเสร็จ ให้ความรู้สึกเป็นธรรมชาติ
      const timer = setTimeout(() => {
        setShowRatingModal(true)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [enrollment])

  if (authLoading || isCheckingAccess) {
    return (
      <div className='flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50'>
        <Loader2 className='h-10 w-10 animate-spin text-blue-600' />
        <p className='animate-pulse font-light text-slate-500'>กำลังเข้าสู่ห้องเรียน...</p>
      </div>
    )
  }

  return (
    <div className='h-screen overflow-hidden [--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex h-full flex-col'>
        <ClassroomHeader course={course} />

        <div className='flex h-[calc(100vh-var(--header-height))] overflow-hidden'>
          <ClassroomSidebar
            course={course}
            activeLessonId={activeLessonId}
            enrollment={enrollment}
          />

          <SidebarInset className='bg-muted/50 overflow-y-auto'>
            <main className='p-4 md:p-6'>
              {currentLesson && (
                <LessonContent
                  lesson={currentLesson}
                  courseSlug={course.slug}
                  courseId={course._id}
                  examId={course.examRef?._ref}
                  enableAssessment={course.enableAssessment}
                  enrollment={enrollment}
                  onProgressUpdate={(newData: any) => setEnrollment(newData)}
                  totalLessons={totalLessons}
                />
              )}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
      {/* ✅ เพิ่มส่วนนี้เข้าไปครับ */}
      {user && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          user={user}
          courseId={course._id}
          courseTitle={course.title}
          // เมื่อส่งรีวิวสำเร็จ ให้รีเฟรชข้อมูล enrollment ท้องถิ่นเพื่อป้องกันการเด้งซ้ำ
          onSuccess={() => setEnrollment((prev: any) => ({ ...prev, isRated: true }))}
        />
      )}
    </div>
  )
}
