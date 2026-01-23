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
  Edit3,
  ExternalLink,
  FileText,
  PenTool,
  PlayCircle,
  Sparkles,
  FileDown,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import ExerciseManager from './ExerciseManager'
import dynamic from 'next/dynamic'

interface LessonFormProps {
  lesson: any
  onUpdate: (newData: any) => void
  exams?: any[]
  courseId: string
}

// โหลด LockedPDFViewer แบบ Client-only
const LockedPDFViewer = dynamic(() => import('@/components/features/locked-pdf-viewer'), {
  ssr: false,
  loading: () => (
    <div className='flex h-full w-full items-center justify-center bg-slate-100 text-slate-400'>
      กำลังโหลดตัวอย่างเอกสาร...
    </div>
  ),
})

export default function LessonForm({ lesson, onUpdate, exams = [], courseId }: LessonFormProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [detectedDuration, setDetectedDuration] = useState<number>(0)

  useEffect(() => setIsMounted(true), [])

  const handleChange = (field: string, value: any) => {
    onUpdate({
      ...lesson,
      [field]: value,
    })
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
      case 'document':
        return <FileDown size={20} />
      case 'exercise':
        return <PenTool size={20} />
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

  const getFileId = (url: string) => {
    if (!url) return null
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/)
    return match ? match[1] : null
  }

  return (
    <div className='animate-in fade-in mx-auto w-full max-w-4xl px-0 pb-24 duration-300 md:px-4'>
      {/* --- HEADER: TITLE --- */}
      <div className='mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4'>
        {/* Icon Box */}
        <div className='mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 sm:mt-0'>
          <LessonIcon />
        </div>

        {/* Title Inputs */}
        <div className='group relative w-full flex-1'>
          <div className='mb-1 flex items-center gap-2 text-sm text-slate-500'>
            <span>
              {lesson.lessonType === 'video' && 'บทเรียนวิดีโอ'}
              {lesson.lessonType === 'article' && 'บทเรียนเนื้อหา'}
              {lesson.lessonType === 'pdf' && 'บทเรียนเอกสาร'}
              {lesson.lessonType === 'exercise' && 'แบบฝึกหัด'}
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

          <div className='relative w-full'>
            <Input
              value={lesson.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={cn(
                'h-auto w-full rounded-none border-0 border-b-2 border-dashed border-slate-200 bg-transparent px-0 pb-1 text-lg font-medium shadow-none transition-all md:text-xl',
                'placeholder:text-slate-300 focus-visible:ring-0',
                'hover:border-slate-400 focus:border-solid focus:border-blue-500',
              )}
              placeholder='ชื่อบทเรียน'
            />
            <div className='pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-slate-300 transition-colors group-hover:text-blue-400'>
              <Edit3 size={16} className='md:h-[18px] md:w-[18px]' />
            </div>
          </div>
          <p className='mt-1.5 hidden text-[10px] text-slate-400 opacity-50 transition-opacity group-hover:opacity-100 sm:block'>
            คลิกเพื่อแก้ไขชื่อบทเรียน
          </p>
        </div>
      </div>

      {/* --- TABS LAYOUT --- */}
      <Tabs defaultValue='content' className='w-full'>
        <TabsList className='mb-6 flex h-auto w-full justify-start overflow-x-auto border-b bg-transparent p-0 md:mb-8'>
          <TabsTrigger
            value='content'
            className='hover:text-primary hover:border-primary data-[state=active]:border-primary data-[state=active]:text-primary h-full shrink-0 cursor-pointer rounded-none border-t-0 border-r-0 border-b-2 border-l-0 px-4 py-3 text-sm font-medium transition-all duration-300 ease-in-out md:text-base'
          >
            เนื้อหาบทเรียน
          </TabsTrigger>
          {/* สามารถเพิ่ม Tabs อื่นๆ ต่อท้ายตรงนี้ได้โดยไม่ต้องแก้ Grid */}
        </TabsList>

        <TabsContent value='content' className='mt-0 space-y-6 md:space-y-8'>
          {/* CASE 1: VIDEO */}
          {lesson.lessonType === 'video' && (
            <>
              {/* Video Source */}
              <div className='space-y-3'>
                <Label className='text-sm font-medium text-slate-900 md:text-base'>
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
                <Label className='text-sm font-medium text-slate-900 md:text-base'>
                  ลิงก์วิดีโอ{' '}
                  <span className='font-normal text-slate-500'>{getVideoSourceLabel()}</span>
                </Label>
                <div className='flex gap-2'>
                  <Input
                    value={lesson.videoUrl || ''}
                    onChange={(e) => handleChange('videoUrl', e.target.value)}
                    placeholder='https://...'
                    className='h-10 min-w-0 flex-1 border-slate-200 bg-white md:h-11'
                  />
                  {lesson.videoUrl && isValidUrl(lesson.videoUrl) && (
                    <a href={lesson.videoUrl} target='_blank' rel='noreferrer'>
                      <Button
                        size='icon'
                        className='h-10 w-10 shrink-0 md:h-11 md:w-11'
                        variant='outline'
                      >
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
                <Label className='text-sm font-medium text-slate-900 md:text-base'>
                  ความยาวบทเรียน
                </Label>

                {/* Responsive Duration Inputs */}
                <div className='flex flex-col items-stretch gap-3 sm:flex-row sm:items-center'>
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
                    className='h-11 w-full border border-purple-200 bg-purple-50 px-4 whitespace-nowrap text-purple-600 shadow-sm hover:bg-purple-100 disabled:opacity-50 sm:w-auto'
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
                <Label className='text-sm font-medium text-slate-900 md:text-base'>
                  คำอธิบายประกอบบทเรียน
                </Label>
                <div className='max-w-full overflow-hidden'>
                  <TextEditor
                    content={lesson.videoContent || ''}
                    onChange={(html) => handleChange('videoContent', html)}
                  />
                </div>
              </div>
            </>
          )}

          {/* CASE 2: ARTICLE */}
          {lesson.lessonType === 'article' && (
            <div className='space-y-3'>
              <Label className='text-lg'>เนื้อหาบทความ</Label>
              <div className='max-w-full overflow-hidden'>
                <TextEditor
                  content={lesson.articleContent || ''}
                  onChange={(html) => handleChange('articleContent', html)}
                />
              </div>
            </div>
          )}

          {/* ✅ CASE 4: DOCUMENT */}
          {lesson.lessonType === 'document' && (
            <>
              <div className='space-y-4'>
                <div className='mb-4 rounded-lg border border-orange-100 bg-orange-50 p-4'>
                  <p className='flex items-center gap-2 text-sm font-medium text-orange-800'>
                    <Sparkles size={16} /> เคล็ดลับการใช้ Google Drive
                  </p>
                  <p className='mt-1 text-xs text-orange-700'>
                    วางลิงก์จากปุ่ม Share ได้เลย ระบบจะแปลงให้เปิดดูบนเว็บได้อัตโนมัติ
                    (อย่าลืมตั้งค่าไฟล์เป็น "ทุกคนที่มีลิงก์อ่านได้")
                  </p>
                </div>

                <div className='space-y-3'>
                  <Label className='text-sm font-medium text-slate-900 md:text-base'>
                    ลิงก์ไฟล์ PDF (Google Drive หรือ URL อื่นๆ)
                  </Label>
                  <div className='flex gap-2'>
                    <Input
                      value={lesson.documentUrl || ''}
                      onChange={(e) => {
                        let val = e.target.value
                        // ✅ เช็คถ้าเป็นลิงก์ Google Drive ให้แปลงเป็น /preview ทันที
                        if (val.includes('drive.google.com')) {
                          val = val
                            .replace(/\/view.*$/, '/preview')
                            .replace(/\/edit.*$/, '/preview')
                        }
                        handleChange('documentUrl', val)
                      }}
                      placeholder='วางลิงก์ Google Drive ที่นี่...'
                      className='h-11 border-slate-200 bg-white'
                    />
                    {lesson.documentUrl && (
                      <a href={lesson.documentUrl} target='_blank' rel='noreferrer'>
                        <Button size='icon' variant='outline' className='h-11 w-11 shrink-0'>
                          <ExternalLink size={18} />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                {/* ระบุช่วงหน้าเพื่อ "ซอย" บทเรียน */}
                <div className='space-y-2'>
                  <Label className='flex items-center gap-2 text-xs font-normal text-slate-500'>
                    <FileText size={14} /> เลือกหน้าที่ต้องการแสดงผล
                  </Label>
                  <Input
                    value={lesson.pageSelection || ''}
                    onChange={(e) => handleChange('pageSelection', e.target.value)}
                    placeholder='ตัวอย่าง: 1-5, 8, 11-13 (พิมพ์ all เพื่อแสดงทุกหน้า)'
                    className='h-11 border-slate-200 bg-white text-sm'
                  />
                  <p className='text-[11px] text-slate-400'>
                    * ใช้ <code className='text-blue-500'>-</code> สำหรับช่วงหน้า และ{' '}
                    <code className='text-blue-500'>,</code> สำหรับแยกหน้า
                  </p>
                </div>

                {/* Preview จิ๋วให้ Admin ดูว่าลิงก์ใช้ได้ไหม */}
                {lesson.documentUrl && (
                  <div className='group relative mt-4 aspect-[16/9] overflow-hidden rounded-xl border bg-slate-100'>
                    <LockedPDFViewer
                      fileUrl={`/api/pdf-proxy?id=${getFileId(lesson.documentUrl)}`}
                      pageSelection={lesson.pageSelection || 'all'}
                    />
                    <div className='pointer-events-none absolute top-3 left-3 z-10'>
                      <Badge className='border-none bg-orange-500 text-white shadow-md hover:bg-orange-500'>
                        ตัวอย่างหน้าเรียน
                      </Badge>
                    </div>
                  </div>
                )}

                <div className='space-y-3 pt-4'>
                  <Label className='text-sm font-medium text-slate-900 md:text-base'>
                    คำอธิบายประกอบบทเรียน
                  </Label>
                  <TextEditor
                    content={lesson.documentContent || ''}
                    onChange={(html) => handleChange('documentContent', html)}
                  />
                </div>
              </div>
            </>
          )}

          {/* CASE 5: EXERCISE (INLINE) */}
          {lesson.lessonType === 'exercise' && (
            <div className='space-y-6'>
              <ExerciseManager
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
          {/* SETTINGS */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
