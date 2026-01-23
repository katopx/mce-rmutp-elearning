'use client'

import { ArrowRight, CheckCircle, Clock, FileText, Trophy } from 'lucide-react'
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
import { updateCourseProgressPercentage, updateLessonProgress } from '@/lib/firebase'

interface LessonContentProps {
  lesson: any
  courseSlug: string
  // ✅ Props ใหม่สำหรับ LMS Logic
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

  // 1. เช็คว่าบทนี้เรียนจบหรือยัง?
  const isLessonCompleted = useMemo(() => {
    return enrollment?.completedLessons?.includes(lesson._key) || false
  }, [enrollment, lesson._key])

  // ฟังก์ชันกดเรียนจบ
  const handleMarkAsComplete = async () => {
    if (!user || isLessonCompleted) return

    setIsCompleting(true)
    try {
      // 1. บันทึกว่าเรียนบทนี้จบแล้ว (Array)
      await updateLessonProgress(user.uid, courseId, lesson._key)

      // 2. คำนวณ % ใหม่ 🔥 จุดสำคัญอยู่ตรงนี้
      const currentCompletedCount = enrollment.completedLessons?.length || 0
      const newCompletedCount = currentCompletedCount + 1
      const newPercent = Math.round((newCompletedCount / totalLessons) * 100)

      // 3. บันทึก % ลง Firebase
      await updateCourseProgressPercentage(user.uid, courseId, newPercent)

      // อัปเดต Local State ให้ UI เปลี่ยนทันที
      if (enrollment && onProgressUpdate) {
        onProgressUpdate({
          ...enrollment,
          completedLessons: [...(enrollment.completedLessons || []), lesson._key],
          progressPercentage: newPercent,
        })
      }
      toast.success('บันทึกการเรียนเรียบร้อย')
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setIsCompleting(false)
    }
  }

  // Effect: Reset state เมื่อเปลี่ยนบท
  useEffect(() => {
    // Scroll to top
    // window.scrollTo(0, 0)
  }, [lesson?._key])

  if (!lesson) {
    return (
      <div className='p-10 text-center font-normal text-slate-400'>
        เลือกบทเรียนเพื่อเริ่มเรียนรู้
      </div>
    )
  }

  const lessonConfig = getLessonType(lesson.lessonType)
  const LessonIcon = lessonConfig.icon

  return (
    <div className='animate-in fade-in mx-auto max-w-5xl space-y-8 pb-24 duration-500'>
      {/* --- HEADER --- */}
      <div className='flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-4'>
          <div
            className={`bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full shadow-sm`}
          >
            <LessonIcon size={28} />
          </div>
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <Badge
                variant='outline'
                className='text-secondary text-[10px] font-medium tracking-wider'
              >
                {lessonConfig.label}
              </Badge>
              {lesson.lessonDuration > 0 && (
                <span className='flex items-center gap-1 text-xs font-normal text-slate-400'>
                  <Clock size={12} /> {lesson.lessonDuration} นาที
                </span>
              )}
              {isLessonCompleted && (
                <Badge className='border-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100'>
                  <CheckCircle className='mr-1 h-3 w-3' /> เรียนจบแล้ว
                </Badge>
              )}
            </div>
            <h1 className='text-xl font-medium text-slate-900 md:text-2xl'>{lesson.title}</h1>
          </div>
        </div>

        {/* ปุ่ม Mark Complete (Desktop) */}
        <div className='hidden md:block'>
          {!isLessonCompleted ? (
            <Button
              onClick={handleMarkAsComplete}
              disabled={isCompleting}
              variant='outline'
              className='border-slate-300 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
            >
              {isCompleting ? 'กำลังบันทึก...' : 'ทำเครื่องหมายว่าเรียนจบ'}
            </Button>
          ) : (
            <Button disabled variant='ghost' className='bg-emerald-50 text-emerald-600'>
              <CheckCircle className='mr-2 h-4 w-4' /> บันทึกแล้ว
            </Button>
          )}
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className='min-h-[50vh] space-y-10'>
        {/* 1. VIDEO */}
        {lesson.lessonType === 'video' && (
          <div className='space-y-8'>
            <div className='aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl'>
              <VideoPlayer url={lesson.videoUrl} autoPlay={false} canSeek={true} />
            </div>
            {lesson.videoContent && (
              <div className='rounded-2xl border border-slate-100 bg-slate-50/30 p-8'>
                <h3 className='mb-4 flex items-center gap-2 text-xl font-medium text-slate-800'>
                  <FileText size={20} className='text-primary' /> รายละเอียด
                </h3>
                <div
                  className='jodit-wysiwyg text-base leading-relaxed'
                  dangerouslySetInnerHTML={{ __html: lesson.videoContent }}
                />
              </div>
            )}
          </div>
        )}

        {/* 2. ARTICLE */}
        {lesson.lessonType === 'article' && (
          <div className='p-8 md:p-4'>
            <div
              className='jodit-wysiwyg prose max-w-none'
              dangerouslySetInnerHTML={{ __html: lesson.articleContent || '' }}
            />
          </div>
        )}

        {/* 3. EXERCISE */}
        {lesson.lessonType === 'exercise' && (
          <div className='animate-in fade-in slide-in-from-bottom-4 duration-700'>
            <ExercisePlayer exerciseData={lesson.exerciseData} />
          </div>
        )}

        {/* 4. ASSESSMENT (Inline - ถ้ามีการฝัง Quiz ในบทเรียน) */}
        {lesson.lessonType === 'assessment' && lesson.assessmentData && (
          <div className='animate-in fade-in slide-in-from-bottom-4 duration-700'>
            {/* ... (Assessment Card เดิมของคุณ - สวยแล้ว) ... */}
            <div className='mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm'>
              <div className='bg-primary/5 text-primary mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full'>
                <Trophy size={40} />
              </div>
              <h2 className='mb-2 text-2xl font-bold text-slate-900'>
                แบบทดสอบ: {lesson.assessmentData.title}
              </h2>
              {/* ... (เนื้อหา Card เดิม) ... */}
              <Button
                asChild
                size='lg'
                className='shadow-primary/20 h-14 w-full rounded-full text-lg font-medium shadow-lg transition-all hover:scale-[1.02]'
              >
                <Link href={`/courses/${courseSlug}/assessment/${lesson.assessmentData._id}`}>
                  เริ่มทำแบบทดสอบ <ArrowRight className='ml-2' size={20} />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* --- FOOTER ACTIONS (Mobile & Global) --- */}
      <div className='flex flex-col gap-6 border-t border-slate-100 pt-10'>
        {/* ปุ่ม Mark Complete (Mobile) */}
        <div className='md:hidden'>
          {!isLessonCompleted ? (
            <Button
              onClick={handleMarkAsComplete}
              disabled={isCompleting}
              className='w-full'
              size='lg'
            >
              ทำเครื่องหมายว่าเรียนจบ
            </Button>
          ) : (
            <Button disabled className='w-full bg-emerald-100 text-emerald-700' size='lg'>
              <CheckCircle className='mr-2 h-4 w-4' /> เรียนจบแล้ว
            </Button>
          )}
        </div>
        {/* 🚧 GATE 2: POST-TEST INVITATION 
             แสดงเมื่อ:
             1. มีระบบสอบ (enableAssessment)
             2. มี Exam ID
             3. เรียนจบครบ 100% (เช็คจาก enrollment.progressPercentage หรือคำนวณเอา)
         */}
        {enableAssessment &&
          examId &&
          enrollment?.progressPercentage === 100 &&
          !isPostTestPassed && (
            <div className='animate-in zoom-in-95 space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 text-center duration-500'>
              <div className='mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm'>
                <Trophy size={32} />
              </div>
              <h2 className='text-2xl font-bold text-slate-800'>
                ยินดีด้วย! คุณเรียนจบหลักสูตรแล้ว 🎉
              </h2>
              <p className='mx-auto max-w-lg text-slate-600'>
                ทำแบบทดสอบหลังเรียน (Post-test) เพื่อวัดผลความรู้ที่คุณได้รับ
              </p>
              <div className='pt-4'>
                <Button
                  size='lg'
                  onClick={() =>
                    router.push(`/courses/${courseSlug}/assessment/${examId}?mode=post`)
                  }
                  className='h-12 rounded-full bg-blue-600 px-8 text-lg text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl'
                >
                  เริ่มทำแบบทดสอบหลังเรียน <ArrowRight className='ml-2 h-5 w-5' />
                </Button>
              </div>
            </div>
          )}
        {/*
          (Optional) เพิ่มส่วนแสดงผลเมื่อ "สอบผ่านแล้ว" (User จะได้รู้ว่าจบแล้วจริงๆ)
         */}
        {enableAssessment && isPostTestPassed && (
          <div className='animate-in zoom-in-95 space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-8 text-center duration-500'>
            <div className='mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm'>
              <CheckCircle size={32} />
            </div>
            <h2 className='text-2xl font-bold text-emerald-800'>คุณผ่านการทดสอบเรียบร้อยแล้ว!</h2>
            <p className='text-emerald-600'>คุณได้เรียนจบหลักสูตรนี้อย่างสมบูรณ์</p>
          </div>
        )}
      </div>
    </div>
  )
}
