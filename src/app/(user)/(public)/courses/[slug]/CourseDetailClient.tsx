'use client'

import { AuthGuard } from '@/components/layout/common/auth-guard'
import GlobalLoading from '@/components/layout/common/GlobalLoading'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CircularProgress from '@/components/ui/circular-progress'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCourseDifficulty, getFileIcon, getLessonType } from '@/constants/course'
import { useAuth } from '@/contexts/auth-context'
import {
  checkBookmarkStatus,
  checkEnrollment,
  enrollCourse,
  getCourseRatingStats,
  getRegisteredCount,
  toggleBookmark,
} from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/format'
import {
  BarChart3,
  Bookmark,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CopyCheck,
  FileSymlink,
  LayoutList,
  PlayCircle,
  Share2,
  Star,
  Trophy,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface CourseDetailProps {
  course: any
}

export default function CourseDetailClient({ course }: CourseDetailProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [enrollmentData, setEnrollmentData] = useState<any>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [realRegisteredCount, setRealRegisteredCount] = useState(0) // จำนวนคนเรียนจริง
  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0 })
  const [isSaved, setIsSaved] = useState(false) // สถานะ Bookmark จริง

  // 🌍 1. ดึงข้อมูลสาธารณะ (ทำงานเสมอ ไม่ว่า Login หรือไม่)
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const count = await getRegisteredCount(course._id)
        setRealRegisteredCount(count)

        const stats = await getCourseRatingStats(course._id)
        setRatingStats(stats)
      } catch (error) {
        console.error('Public data error:', error)
      }
    }
    fetchPublicData()
  }, [course._id]) // ดึงข้อมูลใหม่เฉพาะเมื่อ courseId เปลี่ยน

  // 🔒 2. ดึงข้อมูลส่วนตัว (ทำงานเฉพาะเมื่อ Login)
  useEffect(() => {
    const fetchPrivateData = async () => {
      if (user) {
        try {
          // เช็คการลงทะเบียน
          const enrollment = await checkEnrollment(user.uid, course._id)
          if (enrollment) {
            setIsEnrolled(true)
            setEnrollmentData(enrollment)
          } else {
            setIsEnrolled(false)
            setEnrollmentData(null)
          }

          // เช็คการบันทึก Bookmark
          const savedStatus = await checkBookmarkStatus(user.uid, course._id)
          setIsSaved(savedStatus)
        } catch (error) {
          console.error('Private data error:', error)
        }
      } else {
        // ล้างค่าเมื่อ Logout
        setIsEnrolled(false)
        setEnrollmentData(null)
        setIsSaved(false)
      }
      setIsChecking(false)
    }

    if (!authLoading) fetchPrivateData()
  }, [user, authLoading, course._id])

  // 2. ฟังก์ชันกดลงทะเบียน
  const handleEnrollClick = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      await enrollCourse(user.uid, course, {
        name: user.displayName || '',
        image: user.photoURL || '',
      })
      toast.success('ลงทะเบียนสำเร็จ!')
      setIsEnrolled(true)
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (error.message || 'กรุณาลองใหม่'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. ฟังก์ชันบันทึกคอร์ส
  const handleSaveCourse = async () => {
    if (!user) return
    try {
      // เรียกใช้ Service เพื่อ Toggle ค่าใน Firestore
      const newStatus = await toggleBookmark(user.uid, course._id, isSaved)
      setIsSaved(newStatus)

      if (newStatus) {
        toast.success('บันทึกหลักสูตรลงในรายการโปรดแล้ว')
      } else {
        toast.info('นำออกจากรายการโปรดแล้ว')
      }
    } catch (error) {
      toast.error('ไม่สามารถบันทึกได้ กรุณาลองใหม่')
    }
  }

  if (isChecking || authLoading) {
    return <GlobalLoading />
  }

  return (
    <div className='flex min-h-screen flex-1 flex-col bg-gray-50/50 pb-10'>
      {/* --- ส่วนหัวเว็บไซต์ ปกใหญ่ ชื่อหลักสูตร --- */}
      <div className='relative w-full overflow-hidden rounded-2xl bg-slate-900 px-4 pt-10 pb-24 sm:px-6 lg:px-8'>
        <div
          className='absolute inset-0 z-0 scale-110 bg-cover bg-center bg-no-repeat opacity-60 blur-md'
          style={{ backgroundImage: `url(${course.image})` }}
        />
        <div className='absolute inset-0 z-10 bg-slate-900/70' />
        <div className='relative z-20 container mx-auto'>
          <div className='max-w-4xl space-y-6'>
            {/* ปุ่มย้อนกลับ */}
            <Button
              variant='ghost'
              size='sm'
              onClick={() => router.push('/courses')}
              className='-ml-2 cursor-pointer gap-1 px-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white'
            >
              <ChevronLeft className='h-4 w-4' />
              <span>ย้อนกลับ</span>
            </Button>

            {/* แสดงหมวดหมู่ */}
            <div className='space-y-4 text-white'>
              <div className='flex flex-wrap items-center gap-2'>
                {course.category && (
                  <div className='flex items-center gap-2'>
                    <Badge className='border-none bg-blue-600 text-white'>{course.category}</Badge>
                  </div>
                )}
                {/* --- แสดง Rating --- */}
                <div className='flex items-center gap-1 rounded-full bg-amber-400/20 px-3 py-0.5 text-amber-400'>
                  <Star className='h-3.5 w-3.5 fill-current' />
                  <span className='text-xs font-bold'>
                    {ratingStats.count > 0 ? ratingStats.average.toFixed(1) : '0.0'}
                  </span>
                  <span className='text-[10px] opacity-70'>({ratingStats.count} รีวิว)</span>
                </div>
              </div>

              {/* ชื่อหลักสูตร */}
              <h1 className='text-3xl leading-tight font-medium md:text-4xl lg:text-5xl'>
                {course.title}
              </h1>

              {/* คำอธิบายย่อ */}
              <p className='max-w-2xl text-lg leading-relaxed text-slate-200'>
                {course.shortDescription}
              </p>
              <div className='flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-200'>
                {/* ระดับความยากของหลักสูตร */}
                <div className='flex items-center gap-1.5'>
                  <Trophy className='h-4 w-4 text-yellow-400' />
                  <span>{getCourseDifficulty(course.difficulty).label}</span>
                </div>
                {/* จำนวนผู้ลงทะเบียน */}
                <div className='flex items-center gap-1.5'>
                  <Users className='h-4 w-4 text-blue-400' />
                  <span>ลงทะเบียนแล้ว {realRegisteredCount} คน</span>
                </div>
                <div className='flex items-center gap-1.5'></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ส่วนโครงสร้าง รายละเอียด ผู้สอน --- */}
      <div className='relative z-30 container mx-auto -mt-12 px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          <div className='order-2 lg:order-1 lg:col-span-2'>
            <div className='min-h-[500px] rounded-xl border bg-white p-6 shadow-sm'>
              {/* เมนูเลือกแท็บ */}
              <Tabs defaultValue='structure' className='w-full'>
                <TabsList className='mb-6 flex w-full justify-start rounded-none border-b bg-transparent p-0'>
                  <TabsTrigger
                    value='details'
                    className='hover:text-primary hover:border-b-primary data-[state=active]:border-b-primary data-[state=active]:text-primary cursor-pointer rounded-none border-2 transition-all duration-300 ease-in-out'
                  >
                    รายละเอียด
                  </TabsTrigger>

                  <TabsTrigger
                    value='structure'
                    className='hover:text-primary hover:border-b-primary data-[state=active]:border-b-primary data-[state=active]:text-primary cursor-pointer rounded-none border-2 transition-all duration-300 ease-in-out'
                  >
                    โครงสร้างหลักสูตร
                  </TabsTrigger>

                  <TabsTrigger
                    value='instructor'
                    className='hover:text-primary hover:border-b-primary data-[state=active]:border-b-primary data-[state=active]:text-primary cursor-pointer rounded-none border-2 transition-all duration-300 ease-in-out'
                  >
                    ผู้สอน
                  </TabsTrigger>
                </TabsList>

                {/* แท็บรายละเอียด */}
                <TabsContent value='details' className='space-y-6'>
                  {/* คำอธิบายหลักสูตร */}
                  <div>
                    <h3 className='mb-3 text-xl font-semibold text-slate-800'>คำอธิบายหลักสูตร</h3>
                    {course.description ? (
                      <p className='leading-relaxed whitespace-pre-line text-slate-600'>
                        {course.description}
                      </p>
                    ) : (
                      <p className='text-slate-400 italic'>ไม่พบข้อมูล</p>
                    )}
                  </div>
                  <Separator />

                  {/* จุดประสงค์ */}
                  <div>
                    <h3 className='mb-3 text-xl font-semibold text-slate-800'>วัตถุประสงค์</h3>
                    <div className='grid grid-cols-1 gap-3 text-slate-600 md:grid-cols-2'>
                      {course.objectives?.length > 0 ? (
                        course.objectives.map((obj: string, i: number) => (
                          <div key={i} className='flex items-start gap-2'>
                            <CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-green-600' />
                            <span>{obj}</span>
                          </div>
                        ))
                      ) : (
                        <p className='text-slate-400 italic'>ไม่พบข้อมูล</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* แท็บโครงสร้างหลักสูตร */}
                <TabsContent value='structure' className='space-y-6'>
                  {/* สรุปหัวข้อการเรียนรู้ */}
                  <div className='flex items-center justify-between px-2'>
                    <h3 className='font-semibold text-slate-800'>หัวข้อการเรียนรู้</h3>
                    <p className='text-sm text-slate-500'>
                      รวมทั้งหมด {course.modules?.length || 0} บทเรียน
                    </p>
                  </div>

                  {/* แสดงบทเรียน */}
                  {course.modules?.length > 0 ? (
                    <Accordion
                      type='multiple'
                      defaultValue={course.modules?.map((m: any) => m._key)} // ขยายทั้งหมด
                      className='w-full space-y-3'
                    >
                      {course.modules?.map((module: any, index: number) => {
                        // Logic Progress
                        const moduleLessons = module.lessons || []
                        const completedInModule = isEnrolled
                          ? moduleLessons.filter((l: any) =>
                              enrollmentData?.completedLessons?.includes(l._key),
                            ).length
                          : 0
                        const modulePercent =
                          isEnrolled && moduleLessons.length > 0
                            ? Math.round((completedInModule / moduleLessons.length) * 100)
                            : 0

                        return (
                          <AccordionItem
                            key={module._key}
                            value={module._key}
                            className='rounded-md border border-slate-200 last:border-b'
                          >
                            <AccordionTrigger className='cursor-pointer px-4 py-3 font-medium hover:rounded-none hover:bg-slate-100 hover:no-underline'>
                              <div className='flex w-full items-center justify-between pr-4'>
                                {/* ฝั่งซ้าย: ชื่อบทเรียน */}
                                <span>
                                  บทที่ {index + 1} : {module.title}
                                </span>
                                {/* ฝั่งขวา: วงกลม Progress + จำนวนหัวข้อ */}
                                {isEnrolled && (
                                  <div className='flex items-center gap-3'>
                                    <div className='flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1'>
                                      <CircularProgress value={modulePercent} />
                                      <span className='text-xs font-normal text-slate-500'>
                                        {completedInModule}/{moduleLessons.length} หัวข้อ
                                      </span>
                                    </div>
                                    {modulePercent === 100 && (
                                      <CheckCircle2 className='h-4 w-4 text-emerald-500' />
                                    )}
                                  </div>
                                )}
                              </div>
                            </AccordionTrigger>

                            {/* แสดงรายละเอียดบทเรียน */}
                            <AccordionContent className='space-y-1 pt-0 pb-2'>
                              {module.lessons?.map((lesson: any, lessonIndex: number) => {
                                const {
                                  icon: Icon,
                                  label,
                                  color,
                                } = getLessonType(lesson.lessonType)
                                const isLessonDone =
                                  isEnrolled &&
                                  enrollmentData?.completedLessons?.includes(lesson._key)

                                return (
                                  <div
                                    key={lesson._key}
                                    className='group flex items-center justify-between p-3 pr-8 pl-8 transition-colors hover:bg-slate-50'
                                  >
                                    <div className='flex items-center gap-4'>
                                      {/* สถานะบทเรียน */}
                                      <div
                                        className={cn(
                                          'flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white',
                                          isLessonDone
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-slate-100 text-slate-400',
                                        )}
                                      >
                                        {isLessonDone ? (
                                          <CheckCircle2 size={16} />
                                        ) : (
                                          <Icon size={14} />
                                        )}
                                      </div>

                                      <div className='flex flex-col'>
                                        <span
                                          className={cn(
                                            'text-sm font-medium',
                                            isLessonDone ? 'text-slate-400' : 'text-slate-700',
                                          )}
                                        >
                                          {lesson.title}
                                        </span>
                                        <Badge
                                          variant='secondary'
                                          className='h-4 w-fit px-1.5 text-[9px] font-normal uppercase'
                                        >
                                          {label}
                                        </Badge>
                                      </div>
                                    </div>

                                    {/* โซนขวา: เวลา หรือ จำนวนข้อ */}
                                    <div className='flex items-center gap-4 text-slate-400'>
                                      {/* แสดงจำนวนข้อสำหรับแบบฝึกหัด */}
                                      {lesson.lessonType === 'exercise' && (
                                        <div className='flex items-center gap-1'>
                                          <span className='text-xs font-normal'>
                                            {lesson.exerciseQuestionCount || 0} ข้อ
                                          </span>
                                        </div>
                                      )}

                                      {/* แสดงจำนวนข้อสำหรับแบบทดสอบ */}
                                      {lesson.lessonType === 'assessment' && (
                                        <div className='flex items-center gap-1'>
                                          <span className='text-xs font-normal'>
                                            {lesson.assessmentData?.questionCount || 0} ข้อ
                                          </span>
                                        </div>
                                      )}

                                      {/* แสดงเวลาเรียน เฉพาะบทเรียนวิดีโอ และบทเรียนเนื้อหา */}
                                      {(lesson.lessonType === 'video' ||
                                        lesson.lessonType === 'article') &&
                                        lesson.lessonDuration > 0 && (
                                          <div className='flex items-center gap-1.5'>
                                            <Clock className='h-3 w-3' />
                                            <span className='text-xs font-normal'>
                                              {formatDuration(lesson.lessonDuration)}
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                )
                              })}
                            </AccordionContent>
                          </AccordionItem>
                        )
                      })}
                    </Accordion>
                  ) : (
                    // ถ้าไม่มีบทเรียน
                    <div className='text-center text-slate-400 italic'>ไม่พบข้อมูล</div>
                  )}

                  {/* แสดงรายการเอกสารประกอบ */}
                  {course.resources?.length > 0 && (
                    <Accordion
                      type='single'
                      collapsible
                      defaultValue='resources'
                      className='mt-4 w-full'
                    >
                      <AccordionItem
                        value='resources'
                        className='rounded-md border border-slate-200 last:border-b'
                      >
                        <AccordionTrigger className='cursor-pointer px-4 py-3 font-medium hover:rounded-none hover:bg-slate-100 hover:no-underline'>
                          {/* สรุปเอกสารประกอบ */}
                          <div className='flex w-full items-center justify-between pr-4'>
                            <span className='text-left text-gray-800'>เอกสารประกอบ</span>
                            <span className='text-sm font-normal'>
                              {course.resources.length} รายการ
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className='pt-0 pb-2'>
                          <div className='mt-2 grid grid-cols-1 gap-3 px-2 md:grid-cols-2'>
                            {course.resources?.map((resource: any) => (
                              <a
                                key={resource._key}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex items-center gap-3 rounded-lg border bg-white p-3'
                              >
                                {/* ไอคอนแสดงประเภทไฟล์ */}
                                <div className='flex shrink-0 items-center justify-center'>
                                  <img
                                    src={getFileIcon(resource.fileType).icon}
                                    alt={getFileIcon(resource.fileType).label}
                                    className='size-9 object-contain'
                                  />
                                </div>

                                {/* ชื่อเอกสาร ชื่อไฟล์ */}
                                <div className='flex flex-col'>
                                  <span className='line-clamp-1 text-sm font-medium'>
                                    {resource.title}
                                  </span>
                                  <span className='text-xs font-normal text-slate-400 uppercase'>
                                    {resource.fileType}
                                  </span>
                                </div>
                              </a>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </TabsContent>

                {/* --- แท็บผู้สอน --- */}
                <TabsContent value='instructor' className='animate-in fade-in-50 mt-4 duration-500'>
                  {(() => {
                    // ดึงข้อมูลผู้สอนทั้งหมด
                    const instructorsList = []
                    // ดึงข้อมูลผู้สอนหลัก
                    if (course.instructor) {
                      instructorsList.push({ ...course.instructor, isMain: true })
                    }
                    // ดึงข้อมูลผู้สอนร่วม
                    if (course.coInstructors && course.coInstructors.length > 0) {
                      course.coInstructors.forEach((ins: any) =>
                        instructorsList.push({ ...ins, isMain: false }),
                      )
                    }
                    return instructorsList.length > 0 ? (
                      <div className='grid grid-cols-1 gap-4'>
                        {instructorsList.map((instructor: any, index: number) => (
                          <div
                            key={instructor._id || index}
                            className='flex flex-col items-center gap-5 rounded-2xl border border-slate-200 p-5 transition-all duration-300 ease-in-out hover:scale-102 hover:shadow-md md:flex-row md:items-start'
                          >
                            {/* แสดงรูปผู้สอน */}
                            <Avatar className='h-20 w-20 border-2 border-white shadow-md'>
                              <AvatarImage src={instructor.image} className='object-cover' />
                              <AvatarFallback className='bg-blue-100 text-lg font-semibold text-blue-600'>
                                {instructor.name?.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>

                            {/* ส่วนแสดงข้อมูลผู้สอน */}
                            <div className='flex-1 space-y-2 text-center md:text-left'>
                              <div>
                                <div className='flex items-center justify-center gap-2 md:justify-start'>
                                  <h3 className='text-lg leading-tight font-semibold text-slate-900'>
                                    {instructor.name}
                                  </h3>
                                  {/* โชว์ว่าเป็นผู้สอนหลัก */}
                                  {instructor.isMain && (
                                    <Badge className='h-5 border-none bg-blue-600/10 text-[10px] text-blue-600'>
                                      ผู้สอนหลัก
                                    </Badge>
                                  )}
                                </div>

                                {/* แสดงตำแหน่ง ความชำนาญ */}
                                <p className='text-xs font-normal tracking-wider text-slate-400 uppercase'>
                                  {instructor.jobPosition}
                                </p>
                              </div>

                              {/* แสดงประวัติผู้สอน */}
                              <p className='line-clamp-3 max-w-xl text-[13px] leading-relaxed font-normal text-slate-500'>
                                {instructor.bio || 'ไม่มีข้อมูลประวัติ'}
                              </p>

                              {/* ช่องทางการติดต่อ */}
                              <div className='flex justify-center gap-4 pt-2 md:justify-start'>
                                {/* Facebook */}
                                {instructor.contact?.facebook && (
                                  <a
                                    href={instructor.contact.facebook}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-slate-400 transition-all duration-300 ease-in-out hover:scale-110 hover:text-[#1877F2]'
                                    title='Facebook'
                                  >
                                    <i className='bi bi-facebook text-xl' />
                                  </a>
                                )}

                                {/* Line */}
                                {instructor.contact?.line && (
                                  <a
                                    href={`https://line.me/ti/p/~${instructor.contact.line}`}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-slate-400 transition-all duration-300 ease-in-out hover:scale-110 hover:text-[#06C755]'
                                    title='Line'
                                  >
                                    <i className='bi bi-line text-xl' />
                                  </a>
                                )}

                                {/* Phone */}
                                {instructor.contact?.phone && (
                                  <a
                                    href={`tel:${instructor.contact.phone}`}
                                    className='text-slate-400 transition-all duration-300 ease-in-out hover:scale-110 hover:text-blue-600'
                                    title='โทร'
                                  >
                                    <i className='bi bi-telephone-fill text-xl' />
                                  </a>
                                )}

                                {/* Website */}
                                {instructor.contact?.website && (
                                  <a
                                    href={instructor.contact.website}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-slate-400 transition-all duration-300 ease-in-out hover:scale-110 hover:text-slate-900'
                                    title='เว็บไซต์'
                                  >
                                    <i className='bi bi-globe text-xl' />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // ถ้าไม่มีบทเรียน
                      <div className='text-center text-slate-400 italic'>ไม่พบข้อมูล</div>
                    )
                  })()}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* --- ส่วนสรุป รายละเอียดหลักสูตร ---- */}
          <div className='order-1 lg:order-2 lg:col-span-1'>
            <div className='sticky top-24 space-y-6'>
              <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'>
                {/* แสดงภาพหน้าปกหลักสูตร และชื่อหลักสูตร */}
                <div className='group relative aspect-video bg-slate-200'>
                  <img
                    src={course.image}
                    className='h-full w-full object-cover'
                    alt={course.title}
                  />

                  {/* --- แสดง Progress ด้านหน้าคอร์ส (เฉพาะคนที่ลงทะเบียนแล้ว) --- */}
                  {isEnrolled && enrollmentData && (
                    <div className='absolute inset-x-0 bottom-0 bg-slate-900/80 p-4 backdrop-blur-sm'>
                      <div className='mb-2 flex items-center justify-between text-xs text-white'>
                        <span className='flex items-center gap-1.5'>
                          <PlayCircle className='h-3 w-3' /> ความคืบหน้าการเรียน
                        </span>
                        <span className='font-bold text-blue-400'>
                          {enrollmentData.progressPercentage || 0}%
                        </span>
                      </div>
                      <Progress value={enrollmentData.progressPercentage || 0} className='h-1.5' />
                    </div>
                  )}
                </div>

                <div className='space-y-6 p-6'>
                  {/* แสดงปุ่มต่างๆ */}
                  <div className='space-y-3'>
                    {isEnrolled ? (
                      // --- สถานะ: ลงทะเบียนแล้ว ---
                      <div className='space-y-2'>
                        <Button
                          onClick={() => router.push(`/courses/${course.slug}/classroom`)}
                          className='h-12 w-full'
                        >
                          เข้าเรียน
                        </Button>

                        <Button
                          variant='outline-muted'
                          //onClick={() => router.push(`/courses/${course.slug}/grades`)}
                          className='h-11 w-full'
                        >
                          ผลการเรียน
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* ปุ่มลงทะเบียนเรียน */}
                        <AuthGuard
                          action={handleEnrollClick}
                          text='กรุณาเข้าสู่ระบบเพื่อลงทะเบียนเรียน'
                          toastType='error'
                        >
                          <Button disabled={isSubmitting} className='h-12 w-full text-lg'>
                            {isSubmitting ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนเข้าเรียน'}
                          </Button>
                        </AuthGuard>
                      </>
                    )}

                    <div className='grid grid-cols-2 gap-2'>
                      {/* ปุ่มบันทึกหลักสูตร */}
                      <AuthGuard
                        text='กรุณาเข้าสู่ระบบเพื่อบันทึกหลักสูตร'
                        toastType='error'
                        action={handleSaveCourse}
                      >
                        <Button
                          variant={isSaved ? 'default' : 'outline'}
                          className='gap-2 transition-all'
                        >
                          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                          {isSaved ? 'บันทึกแล้ว' : 'บันทึก'}
                        </Button>
                      </AuthGuard>

                      {/* ปุ่มแชร์หลักสูตร */}
                      <Button variant='outline' className='gap-2'>
                        <Share2 className='h-4 w-4' /> แชร์
                      </Button>
                    </div>
                  </div>

                  <Separator className='my-6' />

                  {/* แสดงสรุปรายละเอียดหลักสูตร */}
                  <h4 className='font-medium'>รายละเอียดหลักสูตร</h4>
                  <div className='font-normal'>
                    {/* แสดงเวลาเรียนรวมของหลักสูตร */}
                    {course.courseDuration > 0 && (
                      <div className='flex items-center gap-4'>
                        <div className='rounded-full p-2'>
                          <Clock size={18} />
                        </div>
                        <div className='flex flex-col'>
                          <span>{formatDuration(course.courseDuration)}</span>
                        </div>
                      </div>
                    )}

                    {/* แสดงระดับความยากของหลักสูตร */}
                    <div className='flex items-center gap-4'>
                      <div className='rounded-full p-2'>
                        <BarChart3 size={18} />
                      </div>
                      <div className='flex flex-col'>
                        <span>{getCourseDifficulty(course.difficulty).label}</span>
                      </div>
                    </div>

                    {/* แสดงจำนวนบทเรียนทั้งหมดของหลักสูตร */}
                    <div className='flex items-center gap-4'>
                      <div className='rounded-full p-2'>
                        <LayoutList size={18} />
                      </div>
                      <div className='flex flex-col'>
                        <span>{course.modules?.length || 0} บทเรียน</span>
                      </div>
                    </div>

                    {/* แสดงจำนวนหัวข้อการเรียนทั้งหมดของหลักสูตร */}
                    <div className='flex items-center gap-4'>
                      <div className='rounded-full p-2'>
                        <PlayCircle size={18} />
                      </div>
                      <div className='flex flex-col'>
                        <span>{course.totalLessons || 0} หัวข้อการเรียนรู้</span>
                      </div>
                    </div>

                    {/* แสดงว่ามีแบบฝึกหัดในหลักสูตร */}
                    {course.totalExercises > 0 && (
                      <div className='flex items-center gap-4'>
                        <div className='rounded-full p-2'>
                          <CopyCheck size={18} />
                        </div>
                        <div className='flex flex-col'>
                          <span>แบบฝึกหัดระหว่างบท</span>
                        </div>
                      </div>
                    )}

                    {/* แสดงว่ามีแบบทดสอบวัดผล ก่อน-หลังเรียนจบ */}
                    {course.enableAssessment && (
                      <div className='flex items-center gap-4'>
                        <div className='rounded-full p-2'>
                          <Trophy size={18} />
                        </div>
                        <div className='flex flex-col'>
                          <span>แบบทดสอบวัดผลก่อนและหลังเรียน</span>
                        </div>
                      </div>
                    )}

                    {/* แสดงว่ามีเอกสารดาวน์โหลด */}
                    {course.resources?.length > 0 && (
                      <div className='flex items-center gap-4'>
                        <div className='rounded-full p-2'>
                          <FileSymlink size={18} />
                        </div>
                        <div className='flex flex-col'>
                          <span>มีเอกสารประกอบ</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
