'use client'

import VideoPlayer from '@/components/features/video-player'
import { Badge } from '@/components/ui/badge'
import { getLessonType } from '@/constants/course'
import { ArrowRight, Clock, FileText, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import ExercisePlayer from './ExercisePlayer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface LessonContentProps {
  lesson: any
  courseSlug: string
}

export default function LessonContent({ lesson, courseSlug }: LessonContentProps) {
  useEffect(() => {}, [lesson?._key])

  if (!lesson)
    return (
      <div className='p-10 text-center font-normal text-slate-400'>
        เลือกบทเรียนเพื่อเริ่มเรียนรู้
      </div>
    )

  const lessonConfig = getLessonType(lesson.lessonType)
  const LessonIcon = lessonConfig.icon

  return (
    <div className='animate-in fade-in mx-auto max-w-5xl pb-24 duration-500'>
      {/* --- ส่วนหัวบทเรียน (Header) --- */}
      <div className='flex flex-col gap-4 border-b border-slate-100 pb-8 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-4'>
          {/* ไอคอนหลัก */}
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
            </div>
            <h1 className='md:text-28 text-2xl font-medium text-slate-900'>{lesson.title}</h1>
          </div>
        </div>
      </div>

      {/* --- พื้นที่แสดงเนื้อหา (Content Area) --- */}
      <div className='space-y-10'>
        {/* 1. กรณีบทเรียนวิดีโอ */}
        {lesson.lessonType === 'video' && (
          <div className='space-y-8'>
            <div className='aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl'>
              <VideoPlayer url={lesson.videoUrl} autoPlay={false} canSeek={true} />
            </div>

            {lesson.videoContent && lesson.videoContent.length > 0 && (
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

        {/* 2. กรณีบทความ (Article) */}
        {lesson.lessonType === 'article' && (
          <div className='p-8 md:p-4'>
            <div
              className='jodit-wysiwyg'
              dangerouslySetInnerHTML={{ __html: lesson.articleContent || '' }}
            />
          </div>
        )}

        {/* 3. กรณีแบบฝึกหัด Exercise */}
        {lesson.lessonType === 'exercise' && (
          <div className='animate-in fade-in slide-in-from-bottom-4 duration-700'>
            <ExercisePlayer exerciseData={lesson.exerciseData} />
          </div>
        )}

        {/* 4. กรณีแบบทดสอบ Assessment */}
        {lesson.lessonType === 'assessment' && lesson.assessmentData && (
          <div className='animate-in fade-in slide-in-from-bottom-4 duration-700'>
            <div className='mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm'>
              {/* Icon & Status */}
              <div className='bg-primary/5 text-primary mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full'>
                <Trophy size={40} />
              </div>

              <h2 className='mb-2 text-2xl font-bold text-slate-900'>
                แบบทดสอบ: {lesson.assessmentData.title}
              </h2>
              <p className='mb-8 text-slate-500'>
                นี่คือแบบทดสอบประเมินผลความรู้ประจำบทเรียน <br />
                โปรดเตรียมตัวให้พร้อมก่อนกดเริ่มทำแบบทดสอบ
              </p>

              {/* ข้อมูลเบื้องต้น (Stats) */}
              <div className='mb-10 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-6'>
                <div className='text-center'>
                  <p className='text-xs font-medium tracking-wider text-slate-400 uppercase'>
                    จำนวนข้อสอบ
                  </p>
                  <p className='text-xl font-bold text-slate-800'>
                    {lesson.assessmentData.questionCount} ข้อ
                  </p>
                </div>
                <div className='border-l border-slate-200 text-center'>
                  <p className='text-xs font-medium tracking-wider text-slate-400 uppercase'>
                    เวลาที่กำหนด
                  </p>
                  <p className='text-xl font-bold text-slate-800'>
                    {lesson.assessmentData.timeLimit} นาที
                  </p>
                </div>
              </div>

              {/* กฎการสอบเล็กน้อย */}
              <div className='mb-10 space-y-2 text-left text-sm text-slate-600'>
                <div className='flex items-center gap-2 text-slate-600'>
                  <span className='h-1 w-1 shrink-0 rounded-full bg-slate-400' />
                  <span>เมื่อกดเริ่มแล้ว เวลาจะเริ่มนับถอยหลังทันที</span>
                </div>
                <div className='mt-2 flex items-center gap-2 text-slate-600'>
                  <span className='h-1 w-1 shrink-0 rounded-full bg-slate-400' />
                  <span>ระบบจะส่งคำตอบอัตโนมัติเมื่อหมดเวลา</span>
                </div>
              </div>

              {/* ปุ่มกดไปหน้าสอบ */}
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
    </div>
  )
}
