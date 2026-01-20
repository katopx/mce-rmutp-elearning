'use client'

import Loading from '@/components/layout/common/GlobalLoading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCourseDifficulty } from '@/constants/course'
import { getAllCoursesAction } from '@/lib/sanity/course-actions'
import {
  Award,
  BarChart3,
  Eye,
  FileEdit,
  Globe,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export default function AdminCoursesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true)
        const data = await getAllCoursesAction()
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

  if (isLoading) return <Loading />

  return (
    <div className='flex h-full flex-col bg-white'>
      {/* Header Section */}
      <div className='border-b border-slate-200 px-8 py-6'>
        <div className='mb-6 flex items-center justify-between'>
          <h1 className='text-xl font-bold text-slate-900'>เนื้อหาของช่อง (หลักสูตร)</h1>
          <Link href='/admin/courses/create'>
            <Button className='rounded-md bg-blue-600 text-white hover:bg-blue-700'>
              <Plus className='mr-2 size-4' /> สร้างใหม่
            </Button>
          </Link>
        </div>

        {/* Filters - YouTube Style Tab Bar */}
        <div className='-mb-6 flex items-center gap-8 border-b border-slate-100'>
          {(
            [
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'published', label: 'เผยแพร่' },
              { id: 'draft', label: 'ฉบับร่าง' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`relative pb-3 text-sm font-medium transition-all ${
                statusFilter === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {statusFilter === tab.id && (
                <div className='absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600' />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className='flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-4'>
        <div className='relative w-full max-w-md'>
          <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400' />
          <input
            type='text'
            placeholder='กรองหลักสูตร...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full bg-transparent py-2 pr-4 pl-10 text-sm focus:outline-none'
          />
        </div>
        <div className='text-xs text-slate-400'>แสดง {filteredCourses.length} รายการ</div>
      </div>

      {/* Content Table */}
      <div className='flex-1 overflow-auto'>
        <table className='w-full border-collapse text-left'>
          <thead>
            <tr className='sticky top-0 z-10 border-b border-slate-200 bg-white text-[13px] font-medium tracking-wider text-slate-500 uppercase'>
              <th className='px-8 py-3 font-medium'>หลักสูตร</th>
              <th className='px-4 py-3 font-medium'>การมองเห็น</th>
              <th className='px-4 py-3 font-medium'>วันที่สร้าง</th>
              <th className='px-4 py-3 font-medium'>ผู้เรียน</th>
              <th className='px-4 py-3 font-medium'>คะแนน</th>
              <th className='px-8 py-3 text-right font-medium'>จัดการ</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100'>
            {filteredCourses.map((course) => (
              <tr key={course._id} className='group transition-colors hover:bg-slate-50/80'>
                {/* Course Info */}
                <td className='px-8 py-4'>
                  <div className='flex items-center gap-4'>
                    <div className='relative aspect-video w-32 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100'>
                      <img
                        src={course.image || '/placeholder-course.jpg'}
                        className='h-full w-full object-cover'
                        alt=''
                      />
                    </div>
                    <div className='flex min-w-0 flex-col'>
                      <span className='truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-600'>
                        {course.title}
                      </span>
                      <span className='mt-1 line-clamp-1 text-xs text-slate-500'>
                        {course.instructor?.name || 'ไม่ระบุ'}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Visibility */}
                <td className='px-4 py-4'>
                  {course.status === 'published' ? (
                    <div className='flex items-center gap-2 text-green-600'>
                      <Globe className='size-4' />
                      <span className='text-sm'>สาธารณะ</span>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 text-slate-400'>
                      <FileEdit className='size-4' />
                      <span className='text-sm'>ฉบับร่าง</span>
                    </div>
                  )}
                </td>

                {/* Date */}
                <td className='px-4 py-4 text-sm text-slate-600'>{course._createdAt || '-'}</td>

                {/* Registered Count */}
                <td className='px-4 py-4'>
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-slate-700'>
                      {course.registered || 0}
                    </span>
                    <span className='text-[10px] text-slate-400'>คน</span>
                  </div>
                </td>

                {/* Rating */}
                <td className='px-4 py-4'>
                  <div className='flex items-center gap-1 text-sm font-medium text-amber-500'>
                    <Star className='size-3.5 fill-current' />
                    {course.rating?.toFixed(1) || '0.0'}
                  </div>
                </td>

                {/* Actions */}
                <td className='px-8 py-4 text-right'>
                  <div className='flex items-center justify-end gap-2'>
                    <Link href={`/admin/courses/${course._id}`}>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-8 text-slate-600 hover:text-blue-600'
                      >
                        <Pencil className='size-4' />
                      </Button>
                    </Link>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-8 text-slate-600 hover:text-blue-600'
                    >
                      <BarChart3 className='size-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-8 text-slate-600 hover:text-red-600'
                    >
                      <Trash2 className='size-4' />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCourses.length === 0 && (
          <div className='py-20 text-center text-sm text-slate-400'>ไม่พบข้อมูลหลักสูตร</div>
        )}
      </div>
    </div>
  )
}
