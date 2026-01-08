'use client'

import Loading from '@/components/layout/common/GlobalLoading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCourseDifficulty } from '@/constants/course'
import { getAllCoursesAction } from '@/lib/sanity/course-actions'
import {
  Award,
  FileEdit,
  Globe,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export default function AdminCoursesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')

  // --- ข้อมูลจริงจาก Sanity ---
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true)
        const data = await getAllCoursesAction()
        console.log('Raw Data:', data)
        setCourses(data || [])
      } catch (err) {
        toast.error('ไม่สามารถโหลดข้อมูลได้')
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const title = course.title || ''
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase())
      const currentStatus = course.status || 'draft'
      const matchesStatus = statusFilter === 'all' || currentStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [courses, searchQuery, statusFilter])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className='space-y-8 p-6'>
      {/* Header Section */}
      <div className='flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-2xl leading-normal font-semibold text-slate-900'>คลังหลักสูตร</h1>
          <p className='text-base leading-normal font-normal text-slate-500'>
            ติดตามประสิทธิภาพการเรียนและคะแนนสอบของผู้เรียน
          </p>
        </div>
        <Link href='/admin/courses/create'>
          <Button className='h-11 shrink-0 cursor-pointer gap-2 rounded-xl bg-blue-600 px-6 text-white shadow-sm transition-all hover:bg-blue-700'>
            <Plus className='!size-5' />
            <span className='font-medium'>สร้างหลักสูตรด่วน</span>
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className='flex flex-col gap-4 md:flex-row'>
        <div className='group relative flex-1'>
          <Search className='absolute top-1/2 left-3 !size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600' />
          <Input
            placeholder='ค้นหาชื่อหลักสูตร...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='h-10 rounded-xl border-slate-200 bg-white pl-10 text-base outline-none'
          />
        </div>
        <div className='flex shrink-0 gap-2 overflow-x-auto pb-1'>
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === s
                  ? 'border border-blue-100 bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {s === 'all' ? 'ทั้งหมด' : s === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards */}
      <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div
              key={course._id}
              className='group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition-all hover:border-blue-200 hover:shadow-md sm:flex-row'
            >
              {/* Thumbnail Area */}
              <div className='relative aspect-video w-full shrink-0 overflow-hidden bg-slate-100 sm:aspect-auto sm:w-64'>
                <img
                  src={course.image || '/placeholder-course.jpg'}
                  alt={course.title}
                  className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                />
                <div className='absolute top-3 left-3 flex flex-col gap-2'>
                  {course.status === 'published' ? (
                    <Badge className='border-0 bg-green-500/90 py-0.5 text-[10px] font-medium text-white'>
                      <Globe className='mr-1 size-3' /> เผยแพร่
                    </Badge>
                  ) : (
                    <Badge className='border-0 bg-slate-500/90 py-0.5 text-[10px] font-medium text-white'>
                      <FileEdit className='mr-1 size-3' /> ฉบับร่าง
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className='flex min-w-0 flex-1 flex-col p-5'>
                <div className='mb-2 flex items-start justify-between gap-2'>
                  <h3
                    className='truncate text-lg leading-normal font-semibold text-slate-800'
                    title={course.title}
                  >
                    {course.title}
                  </h3>
                  <div className='flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-amber-500'>
                    <Star className='size-3.5 fill-current' />
                    <span className='text-xs font-bold'>{course.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>

                {/* Instructor */}
                <div className='mb-5 flex items-center gap-2'>
                  {course.Instructor?.image ? (
                    <img
                      src={course.instructor.image}
                      className='size-7 rounded-full border-2 border-white bg-slate-200 object-cover shadow-sm'
                      alt={course.instructor.name}
                    />
                  ) : (
                    <div className='flex size-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-500'>
                      {course.instructor?.name?.charAt(0) || 'I'}
                    </div>
                  )}
                  <span className='text-xs text-slate-500'>
                    ผู้สอน: {course.instructor?.name || 'ไม่ระบุ'}
                  </span>
                </div>

                {/* Statistics Grid (ปรับให้เข้ากับฟิลด์จริง) */}
                <div className='mb-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border-y border-slate-50 bg-slate-50/30 px-3 py-4'>
                  <div className='flex flex-col'>
                    <span className='text-[11px] font-medium tracking-tight text-slate-400 uppercase'>
                      ลงทะเบียนเรียน
                    </span>
                    <span className='text-base font-semibold text-slate-700'>
                      {course.registered || 0}{' '}
                      <span className='text-xs font-normal text-slate-400'>คน</span>
                    </span>
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-[11px] font-medium tracking-tight text-slate-400 uppercase'>
                      ระดับ
                    </span>
                    <span className='text-base font-semibold text-blue-600'>
                      {getCourseDifficulty(course.difficulty).label || 'ไม่ระบุ'}
                    </span>
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-[11px] font-medium tracking-tight text-slate-400 uppercase'>
                      หมวดหมู่
                    </span>
                    <span className='truncate text-sm font-semibold text-slate-700'>
                      {course.category?.[0] || 'ไม่ระบุ'}
                    </span>
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-[11px] font-medium tracking-tight text-slate-400 uppercase'>
                      คะแนนสอบเฉลี่ย
                    </span>
                    <span className='flex items-center gap-1 text-base font-semibold text-purple-600'>
                      <Award className='size-3.5' />
                      0.0 / 100
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className='mt-auto flex items-center justify-between pt-1'>
                  <div className='flex gap-5'>
                    {/* ลิงก์ไปยังหน้า Editor พร้อมส่ง ID คอร์สจริงไป */}
                    <Link
                      href={`/admin/courses/${course._id}`}
                      className='flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600'
                    >
                      <Pencil className='size-4' /> แก้ไข
                    </Link>
                    <button className='flex cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-red-600'>
                      <Trash2 className='size-4' /> ลบ
                    </button>
                  </div>
                  <button className='cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50'>
                    <MoreHorizontal className='size-5' />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className='col-span-full py-20 text-center text-slate-400'>
            ไม่พบหลักสูตรที่ตรงตามเงื่อนไข
          </div>
        )}
      </div>
    </div>
  )
}
