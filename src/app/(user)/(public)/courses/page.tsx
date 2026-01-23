'use client'

import { useState, useEffect } from 'react'
import { client } from '@/sanity/lib/client'
import { formatDuration } from '@/utils/format'
import { BookOpen, Clock, ImageIcon, RotateCcw, User, LayoutGrid, Filter } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ดึงข้อมูลหลักสูตรและหมวดหมู่
async function getCoursesData() {
  const query = `{
    "courses": *[_type == "course" && status == "published"] | order(_createdAt desc) {
      _id,
      title,
      "slug": slug.current,
      shortDescription,
      "image": image.asset->url,
      "category": (category[0]->title),
      "instructor": instructor->name,
      "courseDuration": math::sum(modules[].lessons[].lessonDuration)
    },
    "categories": *[_type == "category" && categoryType == "course"] | order(title asc) {
      _id,
      title
    }
  }`
  return await client.fetch(query)
}

export default function CoursesPage() {
  const [data, setData] = useState<{ courses: any[]; categories: any[] }>({
    courses: [],
    categories: [],
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCoursesData().then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [])

  // กรองข้อมูลตามหมวดหมู่ที่เลือก
  const filteredCourses =
    selectedCategory === 'all'
      ? data.courses
      : data.courses.filter((c) => c.category === selectedCategory)

  // จัดกลุ่มข้อมูลสำหรับ "แสดงทั้งหมดแบ่งตามหมวดหมู่"
  const groupedCourses = data.categories
    .map((cat) => ({
      categoryTitle: cat.title,
      courses: data.courses.filter((c) => c.category === cat.title),
    }))
    .filter((group) => group.courses.length > 0) // เอาเฉพาะกลุ่มที่มีคอร์ส

  if (loading)
    return <div className='animate-pulse p-20 text-center text-slate-400'>กำลังโหลดหลักสูตร...</div>

  return (
    <div className='mx-auto max-w-7xl p-6 md:p-8'>
      <header className='mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end'>
        <div>
          <h1 className='text-2xl font-semibold text-slate-900'>หลักสูตรการเรียนรู้</h1>
          <p className='text-slate-500'>เลือกหมวดหมู่ที่สนใจเพื่อเรียนรู้</p>
        </div>

        {/* 🎯 เมนู Filter หมวดหมู่ */}
        <div className='flex items-center gap-3 self-center md:self-auto'>
          <span className='hidden text-sm font-medium text-slate-400 sm:inline'>หมวดหมู่:</span>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className='h-11 w-[240px] rounded-xl border-slate-200 bg-white shadow-sm focus:ring-blue-500/20'>
              <div className='flex items-center gap-2'>
                <LayoutGrid size={16} className='text-blue-600' />
                <SelectValue placeholder='เลือกหมวดหมู่' />
              </div>
            </SelectTrigger>
            <SelectContent className='rounded-xl border-slate-100 shadow-xl'>
              <SelectItem value='all' className='font-medium text-blue-600'>
                ทั้งหมด
              </SelectItem>
              {data.categories.map((cat) => (
                <SelectItem key={cat._id} value={cat.title}>
                  {cat.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* --- ส่วนแสดงผล --- */}
      {selectedCategory === 'all' ? (
        // 1. มุมมองทั้งหมด: แบ่งเป็น Section ตามหมวดหมู่
        <div className='space-y-12'>
          {groupedCourses.map((group) => (
            <section key={group.categoryTitle}>
              <div className='mb-6 flex items-center gap-2 border-b pb-2'>
                <div className='h-5 w-1' />
                <h2 className='text-lg font-semibold text-slate-800'>{group.categoryTitle}</h2>
                <span className='text-xs font-normal text-slate-400'>
                  ({group.courses.length} หลักสูตร)
                </span>
              </div>
              <CourseGrid courses={group.courses} />
            </section>
          ))}
        </div>
      ) : (
        // 2. มุมมองตามหมวดหมู่: แสดงเฉพาะที่เลือก
        <div>
          <div className='mb-6 text-sm text-slate-400 italic'>
            กำลังแสดงหลักสูตรในหมวดหมู่ "{selectedCategory}" ({filteredCourses.length} หลักสูตร)
          </div>
          <CourseGrid courses={filteredCourses} />
        </div>
      )}

      {filteredCourses.length === 0 && <EmptyState />}
    </div>
  )
}

// --- Component ย่อยสำหรับ Grid คอร์ส ---
function CourseGrid({ courses }: { courses: any[] }) {
  return (
    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
      {courses.map((course: any) => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  )
}

// --- Component ย่อยสำหรับ Card คอร์ส ---
function CourseCard({ course }: { course: any }) {
  return (
    <Link href={`/courses/${course.slug}`} className='group block'>
      <div className='flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-md'>
        <div className='relative aspect-video overflow-hidden bg-slate-100'>
          {course.image ? (
            <img
              src={course.image}
              alt={course.title}
              className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center'>
              <ImageIcon className='text-slate-300' />
            </div>
          )}
        </div>
        <div className='flex flex-1 flex-col p-5'>
          <span className='mb-2 w-fit rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600'>
            {course.category}
          </span>
          <h3 className='mb-2 line-clamp-2 text-base leading-snug font-medium text-slate-900'>
            {course.title}
          </h3>
          <p className='mb-5 line-clamp-2 flex-1 text-sm font-normal text-slate-500'>
            {course.shortDescription}
          </p>
          <div className='flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-500'>
            <div className='flex items-center gap-1.5 truncate'>
              <User size={13} />
              {course.instructor}
            </div>
            {course.courseDuration > 0 && (
              <div className='flex items-center gap-1.5'>
                <Clock size={13} />
                {formatDuration(course.courseDuration)}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className='py-20 text-center text-slate-400'>
      <BookOpen size={60} className='mx-auto mb-4 opacity-20' />
      <p>ไม่พบหลักสูตรในหมวดหมู่นี้</p>
    </div>
  )
}
