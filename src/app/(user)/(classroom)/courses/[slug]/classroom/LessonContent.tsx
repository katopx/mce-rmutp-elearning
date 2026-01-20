'use client'

import { ArrowRight, CheckCircle, Clock, FileText, Trophy, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

// Components & UI
import VideoPlayer from '@/components/features/video-player'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getLessonType } from '@/constants/course'
import ExercisePlayer from './ExercisePlayer'

// Services
import { useAuth } from '@/contexts/auth-context'
import { updateCourseProgressPercentage, updateLessonProgress } from '@/lib/firebase/services'
import { cn } from '@/lib/utils'

interface LessonContentProps {
  lesson: any
  courseSlug: string
  courseId: string
  examId?: string
  enableAssessment?: boolean
  enrollment?: any
  onProgressUpdate?: (newData: any) => void
  totalLessons: number
}

export default function LessonContent({
  lesson,
  courseSlug,
  courseId,
  examId,
  enableAssessment,
  enrollment,
  onProgressUpdate,
  totalLessons,
}: LessonContentProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isCompleting, setIsCompleting] = useState(false)
  const isPostTestPassed = enrollment?.assessmentProgress?.postTest?.isPassed || false

  const isLessonCompleted = useMemo(() => {
    return enrollment?.completedLessons?.includes(lesson._key) || false
  }, [enrollment, lesson._key])

  const handleMarkAsComplete = async () => {
    if (!user || isLessonCompleted) return
    setIsCompleting(true)
    try {
      await updateLessonProgress(user.uid, courseId, lesson._key)
      const currentCompletedCount = enrollment.completedLessons?.length || 0
      const newCompletedCount = currentCompletedCount + 1
      const newPercent = Math.round((newCompletedCount / totalLessons) * 100)
      await updateCourseProgressPercentage(user.uid, courseId, newPercent)

      if (enrollment && onProgressUpdate) {
        onProgressUpdate({
          ...enrollment,
          completedLessons: [...(enrollment.completedLessons || []), lesson._key],
          progressPercentage: newPercent,
        })
      }
      toast.success('บันทึกความคืบหน้าแล้ว')
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setIsCompleting(false)
    }
  }

  if (!lesson) {
    return (
      <div className='flex h-[50vh] flex-col items-center justify-center p-10 text-center font-light text-slate-400'>
        <div className='mb-4 rounded-full bg-slate-100 p-4'>
          <FileText size={32} />
        </div>
        เลือกบทเรียนเพื่อเริ่มเรียนรู้
      </div>
    )
  }

  const lessonConfig = getLessonType(lesson.lessonType)
  const LessonIcon = lessonConfig.icon

  return (
    <div className='animate-in fade-in slide-in-from-bottom-2 mx-auto max-w-4xl pb-32 duration-700 md:pb-20'>
      {/* --- HEADER SECTION --- */}
      <header className='mb-8 space-y-4'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div className='flex items-start gap-4'>
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm md:h-14 md:w-14',
                isLessonCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary',
              )}
            >
              <LessonIcon size={24} className='md:hidden' />
              <LessonIcon size={28} className='hidden md:block' />
            </div>

            <div className='min-w-0 flex-1 space-y-1.5'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge
                  variant='secondary'
                  className='rounded-md px-1.5 py-0 text-[10px] font-light'
                >
                  {lessonConfig.label}
                </Badge>
                {lesson.lessonDuration > 0 && (
                  <span className='flex items-center gap-1 text-[11px] font-light text-slate-400'>
                    <Clock size={12} /> {lesson.lessonDuration} นาที
                  </span>
                )}
                {isLessonCompleted && (
                  <Badge className='border-none bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'>
                    <CheckCircle className='mr-1 h-3 w-3' /> สำเร็จแล้ว
                  </Badge>
                )}
              </div>
              <h1 className='line-clamp-2 text-xl font-medium tracking-tight text-slate-900 md:text-3xl'>
                {lesson.title}
              </h1>
            </div>
          </div>

          {/* Desktop Complete Button */}
          <div className='hidden md:block'>
            {!isLessonCompleted ? (
              <Button
                onClick={handleMarkAsComplete}
                disabled={isCompleting}
                className='h-11 rounded-xl px-6 font-light shadow-sm transition-all hover:scale-[1.02]'
              >
                {isCompleting ? 'กำลังบันทึก...' : 'เรียนจบหัวข้อนี้'}
              </Button>
            ) : (
              <div className='flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 font-light text-emerald-600'>
                <CheckCircle size={18} />
                <span>บันทึกแล้ว</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- CONTENT AREA --- */}
      <main className='space-y-10'>
        {/* 1. VIDEO PLAYER */}
        {lesson.lessonType === 'video' && (
          <div className='group space-y-6'>
            <div className='relative aspect-video overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-slate-200'>
              <VideoPlayer url={lesson.videoUrl} autoPlay={false} canSeek={true} />
            </div>

            {lesson.videoContent && (
              <section className='overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 md:p-8'>
                <h3 className='mb-6 flex items-center gap-2 text-lg font-medium text-slate-800 md:text-xl'>
                  <FileText size={20} className='text-primary' /> รายละเอียดบทเรียน
                </h3>
                <article
                  className='jodit-wysiwyg prose prose-slate prose-headings:font-medium prose-p:leading-relaxed max-w-none text-slate-600'
                  dangerouslySetInnerHTML={{ __html: lesson.videoContent }}
                />
              </section>
            )}
          </div>
        )}

        {/* 2. ARTICLE CONTENT */}
        {lesson.lessonType === 'article' && (
          <section className='rounded-2xl border border-slate-100 bg-white p-6 md:p-10'>
            <article
              className='jodit-wysiwyg prose prose-slate prose-img:rounded-xl max-w-none'
              dangerouslySetInnerHTML={{ __html: lesson.articleContent || '' }}
            />
          </section>
        )}

        {/* 3. EXERCISE CONTENT */}
        {lesson.lessonType === 'exercise' && (
          <div className='animate-in fade-in slide-in-from-bottom-4 duration-700'>
            <ExercisePlayer exerciseData={lesson.exerciseData} />
          </div>
        )}

        {/* 4. ASSESSMENT CARD */}
        {lesson.lessonType === 'assessment' && lesson.assessmentData && (
          <section className='animate-in zoom-in-95 rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-xl md:p-12'>
            <div className='bg-primary/10 text-primary mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full'>
              <Trophy size={40} />
            </div>
            <h2 className='mb-3 text-2xl font-medium text-slate-900'>แบบทดสอบวัดความรู้</h2>
            <p className='mb-8 font-light text-slate-500'>{lesson.assessmentData.title}</p>
            <Button
              asChild
              size='lg'
              className='h-14 w-full max-w-sm rounded-full text-lg font-medium shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95'
            >
              <Link href={`/courses/${courseSlug}/assessment/${lesson.assessmentData._id}`}>
                เริ่มทำข้อสอบ <ArrowRight className='ml-2' size={20} />
              </Link>
            </Button>
          </section>
        )}
      </main>

      {/* --- POST-CONTENT NOTIFICATIONS --- */}
      <footer className='mt-12 space-y-6 border-t border-slate-100 pt-10'>
        {/* POST-TEST INVITATION */}
        {enableAssessment &&
          examId &&
          enrollment?.progressPercentage === 100 &&
          !isPostTestPassed && (
            <div className='animate-in slide-in-from-top-4 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl md:p-10'>
              <div className='flex flex-col items-center gap-6 md:flex-row md:text-left'>
                <div className='flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md'>
                  <Trophy size={40} className='text-amber-300' />
                </div>
                <div className='flex-1 space-y-2 text-center md:text-left'>
                  <h2 className='text-2xl font-medium text-white md:text-3xl'>
                    ยินดีด้วย! คุณเรียนจบแล้ว 🎉
                  </h2>
                  <p className='text-blue-100 opacity-90'>
                    ขั้นตอนสุดท้าย: ทำแบบทดสอบหลังเรียนเพื่อรับใบประกาศและวัดผลการเรียนรู้ของคุณ
                  </p>
                </div>
                <Button
                  size='lg'
                  onClick={() =>
                    router.push(`/courses/${courseSlug}/assessment/${examId}?mode=post`)
                  }
                  className='h-14 w-full bg-white px-8 font-medium text-blue-600 hover:bg-blue-50 md:w-auto'
                >
                  ทำข้อสอบหลังเรียน <ArrowRight className='ml-2' />
                </Button>
              </div>
            </div>
          )}

        {/* COMPLETED SUCCESS CARD */}
        {enableAssessment && isPostTestPassed && (
          <div className='rounded-3xl border border-emerald-100 bg-emerald-50/50 p-8 text-center'>
            <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600'>
              <CheckCircle size={24} />
            </div>
            <h2 className='text-xl font-medium text-emerald-900'>หลักสูตรสำเร็จสมบูรณ์</h2>
            <p className='text-emerald-700/80'>
              คุณได้ผ่านการทดสอบและเรียนจบหลักสูตรนี้เรียบร้อยแล้ว
            </p>
          </div>
        )}
      </footer>

      {/* --- MOBILE STICKY BOTTOM BAR --- */}
      <div className='fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/80 p-4 backdrop-blur-lg md:hidden'>
        {!isLessonCompleted ? (
          <Button
            onClick={handleMarkAsComplete}
            disabled={isCompleting}
            className='h-12 w-full rounded-xl text-base font-medium shadow-md'
          >
            {isCompleting ? 'กำลังบันทึก...' : 'เรียนจบหัวข้อนี้'}
          </Button>
        ) : (
          <Button
            disabled
            variant='outline'
            className='h-12 w-full rounded-xl border-emerald-200 bg-emerald-50 font-medium text-emerald-600'
          >
            <CheckCircle className='mr-2' size={18} /> เรียนจบแล้ว
          </Button>
        )}
      </div>
    </div>
  )
}
