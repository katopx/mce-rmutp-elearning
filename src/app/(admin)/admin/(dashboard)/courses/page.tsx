// app/admin/courses/page.tsx (หรือ path ที่คุณใช้อยู่)

import { getAllCoursesAction } from '@/lib/sanity/course-actions'
import AdminCoursesClient from './AdminCoursesClient'
import Loading from '@/components/layout/common/GlobalLoading'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic' // บังคับให้โหลดข้อมูลใหม่เสมอ (ถ้าต้องการ)

export default async function AdminCoursesPage() {
  const courses = await getAllCoursesAction()

  return (
    <Suspense fallback={<Loading />}>
      <AdminCoursesClient initialCourses={courses || []} />
    </Suspense>
  )
}
