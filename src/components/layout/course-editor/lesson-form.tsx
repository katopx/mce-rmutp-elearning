'use client'

import TextEditor from '@/components/features/text-editor'
import VideoPlayer from '@/components/features/video-player'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/format'
import {
  BookOpen,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  HelpCircle,
  PenTool,
  PlayCircle,
  RefreshCw,
  Settings2,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import ExerciseManager from './ExerciseManager'
import AssessmentManager from './AssessmentManager'
import {
  createNewExamAction,
  getExamByIdAction,
  updateExamSettingsAction,
} from '@/lib/sanity/exam-actions'
import { Switch } from '@/components/ui/switch'

interface LessonFormProps {
  lesson: any
  onUpdate: (newData: any) => void
  exams?: any[]
}

export default function LessonForm({ lesson, onUpdate, exams = [] }: LessonFormProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [detectedDuration, setDetectedDuration] = useState<number>(0)

  const isSettingsEnabled = ['exercise', 'assessment'].includes(lesson.lessonType)
  const [isCreating, setIsCreating] = useState(false)
  const [examSettings, setExamSettings] = useState({
    timeLimit: 0,
    passingScore: 70,
    maxAttempts: 0,
    shuffleQuestions: false,
  })

  useEffect(() => setIsMounted(true), [])

  // 2. ดึงข้อมูล Setting มาใส่ State เมื่อมี assessmentReferenceId
  useEffect(() => {
    async function loadSettings() {
      if (lesson.lessonType === 'assessment' && lesson.assessmentReferenceId) {
        const data = await getExamByIdAction(lesson.assessmentReferenceId)
        if (data) {
          setExamSettings({
            timeLimit: data.timeLimit || 0,
            passingScore: data.passingScore || 0,
            maxAttempts: data.maxAttempts || 0,
            shuffleQuestions: data.shuffleQuestions || false,
          })
        }
      }
    }
    loadSettings()
  }, [lesson.assessmentReferenceId])

  // 3. ฟังก์ชันบันทึก Setting (Debounced หรือบันทึกทันที)
  const handleUpdateSettings = async (field: string, value: any) => {
    const newSettings = { ...examSettings, [field]: value }
    setExamSettings(newSettings) // Update UI

    // บันทึกลง Sanity (ใช้ Action ที่เราสร้างไว้)
    await updateExamSettingsAction(lesson.assessmentReferenceId, newSettings)
  }

  const handleChange = (field: string, value: any) => {
    onUpdate({
      ...lesson,
      [field]: value,
    })
  }

  const handleCreateExam = async () => {
    try {
      setIsCreating(true)
      const newId = await createNewExamAction(`ข้อสอบ: ${lesson.title}`)
      handleChange('assessmentReferenceId', newId) // พ่วง ID เข้ากับบทเรียน
      toast.success('สร้างชุดข้อสอบใหม่เรียบร้อย')
    } catch (error) {
      toast.error('สร้างไม่สำเร็จ')
    } finally {
      setIsCreating(false)
    }
  }

  const handleAutoDuration = () => {
    if (detectedDuration > 0) {
      const minutes = Math.ceil(detectedDuration / 60)
      handleChange('duration', minutes)
      toast.success(`ตรวจพบความยาววิดีโอเรียบร้อยแล้ว: ${formatDuration(minutes)}`)
    } else {
      toast.error('ยังไม่พบข้อมูลความยาววิดีโอ กรุณารอสักครู่ให้วิดีโอโหลด Metadata')
    }
  }

  if (!isMounted) return null

  // Helper สำหรับเลือก Icon ตามประเภท
  const LessonIcon = () => {
    switch (lesson.lessonType) {
      case 'video':
        return <PlayCircle size={20} />
      case 'article':
        return <FileText size={20} />
      case 'exercise':
        return <PenTool size={20} />
      case 'assessment':
        return <HelpCircle size={20} />
      default:
        return <BookOpen size={20} />
    }
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  if (!isMounted) return null

  const getVideoSourceLabel = () => {
    const source = lesson.videoSource || 'youtube'
    switch (source) {
      case 'youtube':
        return 'จาก YouTube'
      case 'vimeo':
        return 'จาก Vimeo'
      case 'mp4':
        return '(ไฟล์ MP4)'
      default:
        return ''
    }
  }

  return (
    <div className='animate-in fade-in mx-auto max-w-4xl pb-24 duration-300'>
      {/* --- HEADER: TITLE --- */}
      <div className='mb-6 flex items-center gap-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600'>
          <LessonIcon />
        </div>
        <div className='group relative flex-1'>
          <div className='mb-1 flex items-center gap-2 text-sm text-slate-500'>
            <span>
              {lesson.lessonType === 'video' && 'บทเรียนวิดีโอ'}
              {lesson.lessonType === 'article' && 'บทเรียนเนื้อหา'}
              {lesson.lessonType === 'exercise' && 'แบบฝึกหัด'}
              {lesson.lessonType === 'assessment' && 'แบบทดสอบ'}
            </span>
            {lesson.isNew && (
              <Badge
                variant='secondary'
                className='h-5 bg-green-100 px-1.5 text-[10px] font-medium text-green-700'
              >
                ใหม่
              </Badge>
            )}
          </div>

          <div className='relative'>
            <Input
              value={lesson.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={cn(
                'h-auto rounded-none border-0 border-b-2 border-dashed border-slate-200 bg-transparent px-0 pb-1 text-xl font-medium shadow-none transition-all',
                'placeholder:text-slate-300 focus-visible:ring-0',
                'hover:border-slate-400 focus:border-solid focus:border-blue-500',
              )}
              placeholder='ชื่อบทเรียน'
            />
            <div className='pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-slate-300 transition-colors group-hover:text-blue-400'>
              <Edit3 size={18} />
            </div>
          </div>
          <p className='mt-1.5 text-[10px] text-slate-400 opacity-50 transition-opacity group-hover:opacity-100'>
            คลิกเพื่อแก้ไขชื่อบทเรียน
          </p>
        </div>
      </div>

      {/* --- TABS LAYOUT --- */}
      <Tabs defaultValue='content' className='w-full'>
        <TabsList className='mb-8 grid h-auto w-full grid-cols-3 rounded-none border-b bg-transparent p-0'>
          <TabsTrigger
            value='content'
            className='hover:text-primary hover:border-primary data-[state=active]:border-primary data-[state=active]:text-primary h-full cursor-pointer rounded-none border-t-0 border-r-0 border-b-2 border-l-0 px-2 pt-2 pb-3 text-base font-medium transition-all duration-300 ease-in-out'
          >
            เนื้อหาบทเรียน
          </TabsTrigger>
          <TabsTrigger
            value='settings'
            // ✅ ถ้าไม่ใช่ exercise หรือ assessment จะกดไม่ได้ และเปลี่ยนสีให้ดูจางลง
            disabled={!isSettingsEnabled}
            className={cn(
              'h-full cursor-pointer rounded-none border-t-0 border-r-0 border-b-2 border-l-0 px-8 pt-2 pb-3 text-base font-medium transition-all',
              'hover:text-primary hover:border-primary data-[state=active]:border-primary data-[state=active]:text-primary',
              'disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-transparent', // สไตล์ตอนปิดใช้งาน
            )}
          >
            ตั้งค่าบทเรียน
            {!isSettingsEnabled && (
              <span className='ml-2 text-[10px] font-normal opacity-50'>(เร็วๆ นี้)</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='content' className='mt-0 space-y-8'>
          {/* CASE 1: VIDEO */}
          {lesson.lessonType === 'video' && (
            <>
              {/* Video Source */}
              <div className='space-y-3'>
                <Label className='text-base font-medium text-slate-900'>
                  ประเภทแหล่งที่มาของวิดีโอ
                </Label>
                <Select
                  value={lesson.videoSource || 'youtube'}
                  onValueChange={(val) => handleChange('videoSource', val)}
                >
                  <SelectTrigger className='h-11 w-full cursor-pointer border-slate-200 bg-white'>
                    <SelectValue placeholder='เลือกแหล่งที่มา' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='youtube'>YouTube</SelectItem>
                    <SelectItem value='vimeo'>Vimeo</SelectItem>
                    <SelectItem value='mp4'>Direct URL (MP4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Video URL */}
              <div className='space-y-3'>
                <Label className='text-base font-medium text-slate-900'>
                  ลิงก์วิดีโอ{' '}
                  <span className='font-normal text-slate-500'>{getVideoSourceLabel()}</span>
                </Label>
                <div className='flex gap-2'>
                  <Input
                    value={lesson.videoUrl || ''}
                    onChange={(e) => handleChange('videoUrl', e.target.value)}
                    placeholder='https://...'
                    className='border-slate-200 bg-white'
                  />
                  {lesson.videoUrl && isValidUrl(lesson.videoUrl) && (
                    <a href={lesson.videoUrl} target='_blank' rel='noreferrer'>
                      <Button size='icon' className='w-11'>
                        <ExternalLink size={18} />
                      </Button>
                    </a>
                  )}
                </div>

                {/* Video Preview */}
                {lesson.videoUrl && isValidUrl(lesson.videoUrl) && (
                  <div className='mt-4 flex w-full justify-center'>
                    <div className='relative aspect-video w-full max-w-4xl overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-900 shadow-lg'>
                      <VideoPlayer url={lesson.videoUrl} onDuration={setDetectedDuration} />
                    </div>
                  </div>
                )}
              </div>

              <div className='space-y-3'>
                {/* Label */}
                <Label className='text-base font-medium text-slate-900'>ความยาวบทเรียน</Label>

                <div className='flex items-center gap-3'>
                  <div className='relative flex-1'>
                    <Input
                      type='number'
                      value={lesson.duration || ''}
                      onChange={(e) => handleChange('duration', e.target.value)}
                      className='h-11 w-full border-slate-200 bg-white pr-16 focus-visible:ring-blue-500'
                      placeholder='ระบุจำนวนนาที'
                    />
                    <span className='absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium text-slate-400'>
                      นาที
                    </span>
                  </div>

                  <Button
                    type='button'
                    variant='secondary'
                    onClick={handleAutoDuration}
                    className='h-11 border border-purple-200 bg-purple-50 px-4 text-purple-600 shadow-sm hover:bg-purple-100 disabled:opacity-50'
                  >
                    <Sparkles className='mr-2 h-4 w-4' />
                    ดึงเวลาอัตโนมัติ
                  </Button>
                </div>

                {/* แสดงผลเวลาจริงใต้ Input */}
                {lesson.duration && Number(lesson.duration) > 0 && (
                  <div className='animate-in fade-in slide-in-from-top-1 flex items-center gap-1.5 text-sm font-normal text-blue-600 duration-200'>
                    <span>เป็นเวลา:</span>
                    <span className='font-normal decoration-blue-200 underline-offset-4'>
                      {formatDuration(Number(lesson.duration))}
                    </span>
                  </div>
                )}
              </div>

              {/* Description*/}
              <div className='space-y-3 pt-4'>
                <Label className='text-base font-medium text-slate-900'>คำอธิบายประกอบวิดีโอ</Label>
                <TextEditor
                  content={lesson.videoContent || ''}
                  onChange={(html) => handleChange('videoContent', html)}
                />
              </div>
            </>
          )}

          {/* CASE 2: ARTICLE */}
          {lesson.lessonType === 'article' && (
            <div className='space-y-3'>
              <Label className='text-lg'>เนื้อหาบทความ</Label>
              <TextEditor
                content={lesson.articleContent || ''}
                onChange={(html) => handleChange('articleContent', html)}
              />
            </div>
          )}

          {/* CASE 3: ASSESSMENT (REFERENCE) */}
          {lesson.lessonType === 'assessment' && (
            <div className='space-y-6'>
              {!lesson.assessmentReferenceId ? (
                // ถ้ายังไม่มีการเชื่อมต่อข้อสอบ
                <div className='flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center'>
                  <h3 className='mb-2 text-base font-medium text-slate-900'>
                    ยังไม่มีการเชื่อมต่อข้อสอบ
                  </h3>
                  <p className='mb-6 text-sm text-slate-400'>
                    สร้างชุดข้อสอบใหม่สำหรับบทเรียนนี้เพื่อเริ่มจัดการโจทย์
                  </p>
                  <Button onClick={handleCreateExam} disabled={isCreating} className='bg-blue-600'>
                    {isCreating ? 'กำลังสร้าง...' : 'สร้างชุดข้อสอบใหม่'}
                  </Button>
                </div>
              ) : (
                // ถ้าเชื่อมต่อแล้ว แสดงตัวจัดการ
                <AssessmentManager examId={lesson.assessmentReferenceId} />
              )}
            </div>
          )}

          {/* CASE 4: EXERCISE (INLINE) */}
          {lesson.lessonType === 'exercise' && (
            <div className='space-y-6'>
              <ExerciseManager
                // เก็บข้อมูลใน lesson.exerciseData.questions
                questions={lesson.exerciseData?.questions || []}
                onChange={(newQuestions) => {
                  handleChange('exerciseData', {
                    ...lesson.exerciseData,
                    questions: newQuestions,
                  })
                }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value='settings' className='space-y-6'>
          {/* CASE 1: ASSESSMENT SETTINGS */}
          {lesson.lessonType === 'assessment' && lesson.assessmentReferenceId && (
            <div className='animate-in fade-in slide-in-from-top-2 space-y-6 duration-300'>
              <div className='flex items-center gap-2 border-b border-slate-100 pb-3'>
                <Settings2 className='size-4 text-blue-500' />
                <h3 className='text-sm font-medium text-slate-800'>ตั้งค่าเกณฑ์การสอบ</h3>
              </div>

              <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                {/* เวลาในการทำ */}
                <div className='space-y-2'>
                  <Label className='text-[11px] font-medium tracking-wider text-slate-500 uppercase'>
                    เวลาในการทำ (นาที)
                  </Label>
                  <div className='group relative'>
                    <Clock className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-blue-500' />
                    <Input
                      type='number'
                      value={examSettings.timeLimit || ''}
                      onChange={(e) => handleUpdateSettings('timeLimit', e.target.value)}
                      className='h-9 border-slate-200 pl-9 text-sm focus-visible:ring-1 focus-visible:ring-blue-400'
                      placeholder='เช่น 60'
                    />
                  </div>
                </div>

                {/* เกณฑ์คะแนนผ่าน */}
                <div className='space-y-2'>
                  <Label className='text-[11px] font-medium tracking-wider text-slate-500 uppercase'>
                    เกณฑ์คะแนนผ่าน (%)
                  </Label>
                  <div className='group relative'>
                    <Trophy className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-emerald-500' />
                    <Input
                      type='number'
                      value={examSettings.passingScore || ''}
                      onChange={(e) => handleUpdateSettings('passingScore', e.target.value)}
                      className='h-9 border-slate-200 pl-9 text-sm focus-visible:ring-1 focus-visible:ring-blue-400'
                      placeholder='เช่น 70'
                    />
                  </div>
                </div>

                {/* จำนวนครั้งที่สอบได้ */}
                <div className='space-y-2'>
                  <Label className='text-[11px] font-medium tracking-wider text-slate-500 uppercase'>
                    จำนวนครั้งที่สอบได้
                  </Label>
                  <div className='group relative'>
                    <RefreshCw className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500' />
                    <Input
                      type='number'
                      value={examSettings.maxAttempts || ''}
                      onChange={(e) => handleUpdateSettings('maxAttempts', e.target.value)}
                      className='h-9 border-slate-200 pl-9 text-sm focus-visible:ring-1 focus-visible:ring-blue-400'
                      placeholder='0 = ไม่จำกัด'
                    />
                  </div>
                </div>

                {/* Shuffle Switch */}
                <div className='col-span-full flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-4'>
                  <div className='space-y-0.5'>
                    <Label
                      htmlFor='shuffle'
                      className='cursor-pointer text-sm font-medium text-slate-700'
                    >
                      สลับลำดับโจทย์ (Shuffle)
                    </Label>
                    <p className='text-[10px] font-normal text-slate-400'>
                      สลับลำดับข้อสอบทุกครั้งที่ผู้เรียนเข้าทำ
                    </p>
                  </div>
                  <Switch
                    id='shuffle'
                    checked={examSettings.shuffleQuestions}
                    onCheckedChange={(checked) => handleUpdateSettings('shuffleQuestions', checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {lesson.lessonType === 'assessment' && !lesson.assessmentReferenceId && (
            <div className='py-10 text-center text-slate-400'>
              <p className='text-sm'>กรุณาสร้างหรือเลือกชุดข้อสอบในหน้า "เนื้อหา" ก่อนตั้งค่า</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
