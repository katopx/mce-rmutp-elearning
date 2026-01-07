'use client'

import VideoPlayer from '@/components/features/video-player'
import { Badge } from '@/components/ui/badge'
import { getLessonType } from '@/constants/course'
import { Clock, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import ExercisePlayer from './ExercisePlayer'

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
        {/* {lesson.lessonType === 'assessment' && (
          <AssessmentGate
            data={lesson.assessmentData}
            courseSlug={courseSlug}
            lessonId={lesson._key}
          />
        )} */}
      </div>
    </div>
  )
}
