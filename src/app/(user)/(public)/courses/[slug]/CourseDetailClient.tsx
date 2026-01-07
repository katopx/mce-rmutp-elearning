'use client'

import { AuthGuard } from '@/components/layout/common/auth-guard'
import GlobalLoading from '@/components/layout/common/GlobalLoading'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCourseDifficulty, getFileIcon, getLessonType } from '@/constants/course'
import { useAuth } from '@/contexts/auth-context'
import { checkEnrollment, enrollCourse } from '@/lib/firebase/services'
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
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. เช็คสถานะการลงทะเบียนจาก Firestore
  useEffect(() => {
    const fetchStatus = async () => {
      if (user) {
        try {
          const enrollment = await checkEnrollment(user.uid, course._id)
          if (enrollment) setIsEnrolled(true)
        } catch (error) {}
      }
      setIsChecking(false)
    }
    if (!authLoading) fetchStatus()
  }, [user, authLoading, course._id])

  // 2. ฟังก์ชันกดลงทะเบียน
  const handleEnrollClick = async () => {
    if (!user) return

    setIsSubmitting(true)
    try {
      await enrollCourse(user.uid, course)
      toast.success('ลงทะเบียนสำเร็จ!')
      setIsEnrolled(true)
      router.push(`/courses/${course.slug}/classroom`)
    } catch (error: any) {
      toast.error('เกิดข้อผิดพลาด: ' + (error.message || 'กรุณาลองใหม่'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isChecking || authLoading) {
    return <GlobalLoading />
  }

  return (
    <div className='flex min-h-screen flex-1 flex-col bg-gray-50/50 pb-10'>
      {/* --- ส่วนหัวเว็บไซต์ ปกใหญ่ ชื่อหลักสูตร --- */}
      <div className='relative w-full overflow-hidden bg-slate-900 px-4 pt-10 pb-24 sm:px-6 lg:px-8'>
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
              onClick={() => router.back()}
              className='-ml-2 cursor-pointer gap-1 px-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white'
            >
              <ChevronLeft className='h-4 w-4' />
              <span>ย้อนกลับ</span>
            </Button>

            {/* แสดงหมวดหมู่ */}
            <div className='space-y-4 text-white'>
              {course.category && (
                <div className='flex items-center gap-2'>
                  <Badge className='border-none bg-blue-600 text-white'>{course.category}</Badge>
                </div>
              )}

              {/* ชื่อหลักสูตร */}
              <h1 className='text-3xl leading-tight font-medium md:text-4xl lg:text-5xl'>{course.title}</h1>

              {/* คำอธิบายย่อ */}
              <p className='max-w-2xl text-lg leading-relaxed text-slate-200'>{course.shortDescription}</p>
              <div className='flex flex-wrap items-center gap-6 pt-2 text-sm text-slate-200'>
                {/* ระดับความยากของหลักสูตร */}
                <div className='flex items-center gap-1.5'>
                  <Trophy className='h-4 w-4 text-yellow-400' />
                  <span>{getCourseDifficulty(course.difficulty).label}</span>
                </div>
                {/* จำนวนผู้ลงทะเบียน */}
                <div className='flex items-center gap-1.5'>
                  <Users className='h-4 w-4 text-blue-400' />
                  <span>ลงทะเบียนแล้ว {course.registered || 0} คน</span>
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
                <TabsList className='mb-6 grid w-full grid-cols-3 bg-slate-100 p-1'>
                  <TabsTrigger value='details'>รายละเอียด</TabsTrigger>
                  <TabsTrigger value='structure'>โครงสร้างหลักสูตร</TabsTrigger>
                  <TabsTrigger value='instructor'>ผู้สอน</TabsTrigger>
                </TabsList>

                {/* แท็บรายละเอียด */}
                <TabsContent value='details' className='space-y-6'>
                  {/* คำอธิบายหลักสูตร */}
                  <div>
                    <h3 className='mb-3 text-xl font-semibold text-slate-800'>คำอธิบายหลักสูตร</h3>
                    {course.description ? (
                      <p className='leading-relaxed whitespace-pre-line text-slate-600'>{course.description}</p>
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
                    <p className='text-sm text-slate-500'>รวมทั้งหมด {course.modules?.length || 0} บทเรียน</p>
                  </div>

                  {/* แสดงบทเรียน */}
                  {course.modules?.length > 0 ? (
                    <Accordion
                      type='multiple'
                      defaultValue={course.modules?.map((m: any) => m._key)}
                      className='w-full space-y-3'
                    >
                      {course.modules?.map((module: any, index: number) => (
                        <AccordionItem
                          key={module._key}
                          value={module._key}
                          className='rounded-lg border border-slate-200 bg-slate-50 px-2'
                        >
                          <AccordionTrigger className='px-2 py-3 font-medium hover:no-underline'>
                            <div className='flex w-full items-center justify-between pr-4'>
                              <span>
                                บทที่ {index + 1} : {module.title}
                              </span>
                              <span className='text-sm font-normal'>{module.lessons?.length || 0} หัวข้อ</span>
                            </div>
                          </AccordionTrigger>

                          {/* แสดงรายละเอียดบทเรียน */}
                          <AccordionContent className='space-y-1 pt-0 pb-2'>
                            {module.lessons?.map((lesson: any) => {
                              {
                                /* ใช้ฟังชั่นมาเปลี่ยนไอคอนและชื่อบทเรียนเป็นภาษาไทย */
                              }
                              const { icon: Icon, label, color } = getLessonType(lesson.lessonType)

                              return (
                                <div
                                  key={lesson._key}
                                  className='group flex items-center justify-between rounded-md border border-transparent p-3 transition-colors hover:border-slate-100 hover:bg-white'
                                >
                                  {/* โซนซ้าย: ไอคอนและชื่อบทเรียน */}
                                  <div className='flex items-center gap-3'>
                                    <div className='flex shrink-0 items-center justify-center'>
                                      <Icon className={`h-5 w-5 ${color}`} />
                                    </div>
                                    <div className='flex flex-col'>
                                      <span className='text-sm font-medium'>{lesson.title}</span>
                                      <span className='text-[10px] text-slate-400'>{label}</span>
                                    </div>
                                  </div>

                                  {/* โซนขวา: เวลา หรือ จำนวนข้อ */}
                                  <div className='flex items-center gap-4 text-slate-400'>
                                    {/* แสดงจำนวนข้อสำหรับแบบทดสอบและแบบฝึกหัด */}
                                    {(lesson.lessonType === 'quiz' || lesson.lessonType === 'exercise') && (
                                      <div className='flex items-center gap-1'>
                                        <span className='text-xs font-normal'>
                                          {lesson.quizData?.questionCount || 0} ข้อ
                                        </span>
                                      </div>
                                    )}

                                    {/* แสดงเวลาเรียน */}
                                    {lesson.lessonType !== 'quiz' && lesson.lessonDuration > 0 && (
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
                      ))}
                    </Accordion>
                  ) : (
                    // ถ้าไม่มีบทเรียน
                    <div className='text-center text-slate-400 italic'>ไม่พบข้อมูล</div>
                  )}

                  {/* แสดงรายการเอกสารประกอบ */}
                  {course.resources?.length > 0 && (
                    <Accordion type='single' collapsible defaultValue='resources' className='mt-4 w-full'>
                      <AccordionItem value='resources' className='rounded-lg border bg-slate-50 px-2'>
                        <AccordionTrigger className='px-2 py-3 font-medium hover:no-underline'>
                          {/* สรุปเอกสารประกอบ */}
                          <div className='flex w-full items-center justify-between pr-4'>
                            <span className='text-left text-gray-800'>เอกสารประกอบ</span>
                            <span className='text-sm font-normal'>{course.resources.length} รายการ</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className='pt-0 pb-2'>
                          <div className='mt-2 grid grid-cols-1 gap-3 px-2 md:grid-cols-2'>
                            {course.resources?.map((resource: any) => (
                              <a
                                key={resource._key}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex items-center gap-3 rounded-lg border bg-white p-3 transition-all hover:bg-slate-50'
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
                                  <span className='line-clamp-1 text-sm font-medium'>{resource.title}</span>
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
                      course.coInstructors.forEach((ins: any) => instructorsList.push({ ...ins, isMain: false }))
                    }
                    return instructorsList.length > 0 ? (
                      <div className='grid grid-cols-1 gap-4'>
                        {instructorsList.map((instructor: any, index: number) => (
                          <div
                            key={instructor._id || index}
                            className='flex flex-col items-center gap-5 rounded-2xl border border-slate-100 bg-slate-50/30 p-5 transition-all hover:bg-white hover:shadow-md md:flex-row md:items-start'
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
                                    className='text-slate-400 transition-colors hover:text-[#1877F2]'
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
                                    className='text-slate-400 transition-colors hover:text-[#06C755]'
                                    title='Line'
                                  >
                                    <i className='bi bi-line text-xl' />
                                  </a>
                                )}

                                {/* Phone */}
                                {instructor.contact?.phone && (
                                  <a
                                    href={`tel:${instructor.contact.phone}`}
                                    className='text-slate-400 transition-colors hover:text-blue-600'
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
                                    className='text-slate-400 transition-colors hover:text-slate-900'
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
                  <img src={course.image} className='h-full w-full object-cover' alt={course.title} />
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
                          onClick={() => router.push(`/courses/${course.slug}/grades`)}
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
                      <AuthGuard text='กรุณาเข้าสู่ระบบเพื่อบันทึกหลักสูตร' toastType='error'>
                        <Button variant='outline' className='gap-2'>
                          <Bookmark className='h-4 w-4' /> บันทึก
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
                    <div className='flex items-center gap-4'>
                      <div className='rounded-full p-2'>
                        <Clock size={18} />
                      </div>
                      <div className='flex flex-col'>
                        <span>{formatDuration(course.courseDuration)}</span>
                      </div>
                    </div>

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
                    {course.modules?.some((m: any) => m.lessons?.some((l: any) => l.lessonType === 'exercise')) && (
                      <div className='flex items-center gap-4'>
                        <div className='rounded-full p-2'>
                          <CopyCheck size={18} />
                        </div>
                        <div className='flex flex-col'>
                          <span>แบบฝึกหัดระหว่างบท</span>
                        </div>
                      </div>
                    )}

                    {/* แสดงว่ามีแบบทดสอบวัดผลหลังเรียนจบ */}
                    {course.modules?.some((m: any) => m.lessons?.some((l: any) => l.lessonType === 'quiz')) && (
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
