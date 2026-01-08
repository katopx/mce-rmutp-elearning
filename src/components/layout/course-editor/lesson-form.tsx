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
import {
  BookOpen,
  Edit3,
  ExternalLink,
  FileText,
  HelpCircle,
  PenTool,
  PlayCircle,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface LessonFormProps {
  lesson: any
  onUpdate: (newData: any) => void
  exams?: any[]
}

export default function LessonForm({ lesson, onUpdate, exams = [] }: LessonFormProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [detectedDuration, setDetectedDuration] = useState<number>(0)

  useEffect(() => setIsMounted(true), [])

  const handleChange = (field: string, value: any) => {
    onUpdate({
      ...lesson,
      [field]: value,
    })
  }

  // แปลงวินาทีเป็น MM:SS สำหรับการแสดงผล
  const formatDurationDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // แปลง MM:SS กลับเป็นวินาทีเพื่อบันทึก
  const parseDurationInput = (val: string) => {
    const parts = val.split(':')
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1])
    }
    return parseInt(val) || 0
  }

  const handleAutoDuration = () => {
    if (detectedDuration > 0) {
      handleChange('lessonDuration', detectedDuration)
      toast.success(`ตรวจพบความยาววิดีโอเรียบร้อยแล้ว`)
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
          <p className='mt-1.5 text-[10px] text-slate-400 opacity-0 transition-opacity group-hover:opacity-100'>
            คลิกเพื่อแก้ไขชื่อบทเรียน
          </p>
        </div>
      </div>

      {/* --- TABS LAYOUT --- */}
      <Tabs defaultValue='content' className='w-full'>
        <TabsList className='mb-8 grid h-auto w-full grid-cols-3 rounded-none border-b bg-transparent p-0'>
          <TabsTrigger
            value='content'
            className='h-full rounded-none border-b-2 border-transparent bg-transparent px-2 pt-2 pb-3 text-base font-semibold data-[state=active]:border-blue-600 data-[state=active]:text-blue-600'
          >
            เนื้อหาบทเรียน
          </TabsTrigger>
          <TabsTrigger
            value='settings'
            className='h-full rounded-none border-b-2 border-transparent bg-transparent px-2 pt-2 pb-3 text-base font-semibold data-[state=active]:border-blue-600 data-[state=active]:text-blue-600'
          >
            ตั้งค่าบทเรียน
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
                  <SelectTrigger className='h-11 w-full border-slate-200 bg-white'>
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
                      <Button variant='outline' size='icon' className='w-11'>
                        <ExternalLink size={18} />
                      </Button>
                    </a>
                  )}
                </div>

                {/* Video Preview */}
                {lesson.videoUrl && isValidUrl(lesson.videoUrl) && (
                  <div className='relative mt-2 aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-slate-100 shadow-sm'>
                    <VideoPlayer url={lesson.videoUrl} onDuration={setDetectedDuration} />
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
            <div className='rounded-xl border-2 border-dashed p-8 text-center'>
              <HelpCircle className='mx-auto mb-4 size-12 text-slate-300' />
              <h3 className='mb-4 text-lg font-semibold'>เชื่อมต่อกับแบบทดสอบในคลัง</h3>
              <div className='mx-auto max-w-sm'>
                <Select
                  value={lesson.assessmentReferenceId}
                  onValueChange={(v) => handleChange('assessmentReferenceId', v)}
                >
                  <SelectTrigger className='bg-white'>
                    <SelectValue placeholder='เลือกชุดข้อสอบจากคลัง...' />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam: any) => (
                      <SelectItem key={exam.value} value={exam.value}>
                        {exam.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className='mt-4 text-xs text-slate-400'>
                  * ข้อมูลชุดข้อสอบและเกณฑ์การผ่าน จะถูกดึงมาจากคลังข้อสอบโดยตรง
                </p>
              </div>
            </div>
          )}

          {/* CASE 4: EXERCISE (INLINE) */}
          {lesson.lessonType === 'exercise' && (
            <div className='space-y-3'>
              <div className='rounded-lg bg-blue-50 p-4 text-blue-700'>
                <p className='text-sm'>
                  โหมดแบบฝึกหัด Inline: คุณสามารถสร้างคำถามสั้นๆ ท้ายบทเรียนได้ที่นี่
                </p>
              </div>
              {/* ตรงนี้สามารถเพิ่ม UI จัดการ ExerciseData.questions ในอนาคตได้ */}
              <p className='text-slate-400 italic'>ส่วนจัดการชุดคำถามกำลังอยู่ในการพัฒนา...</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value='settings' className='space-y-6'>
          {/* Duration */}
          <div className='space-y-3'>
            <Label className='text-base font-medium text-slate-900'>ความยาวบทเรียน</Label>
            <div className='flex items-center gap-3'>
              <Input
                type='text'
                value={lesson.duration || ''}
                onChange={(e) => handleChange('duration', e.target.value)}
                className='w-full border-slate-200 bg-white'
                placeholder='00:00'
              />
              <Button
                type='button'
                variant='secondary'
                onClick={handleAutoDuration}
                disabled={!detectedDuration}
                className='border border-purple-200 bg-purple-50 px-4 text-purple-600 shadow-sm hover:bg-purple-100'
                title='Auto Detect from Video'
              >
                <Sparkles className='mr-2 h-4 w-4' />
                อัตโนมัติ
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
