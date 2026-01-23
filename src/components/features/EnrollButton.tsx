'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { enrollCourse, checkEnrollment } from '@/lib/firebase'
import { toast } from 'sonner'

interface EnrollButtonProps {
  course: any // ข้อมูลคอร์สจาก Sanity
}

export default function EnrollButton({ course }: EnrollButtonProps) {
  const { user, loading: authLoading } = useAuth()
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchStatus = async () => {
      if (user) {
        const enrollment = await checkEnrollment(user.uid, course._id)
        if (enrollment) setIsEnrolled(true)
      }
      setLoading(false)
    }
    if (!authLoading) fetchStatus()
  }, [user, course._id, authLoading])

  const handleEnroll = async () => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนลงทะเบียน')
      return
    }

    setSubmitting(true)
    try {
      await enrollCourse(user.uid, course)
      toast.success('ลงทะเบียนสำเร็จ!')
      setIsEnrolled(true)
      // พาไปหน้า Classroom ทันที
      router.push(`/courses/${course.slug.current}/classroom`)
    } catch (error) {
      console.error(error)
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <button className='btn btn-disabled'>กำลังตรวจสอบ...</button>

  if (isEnrolled) {
    return (
      <button
        onClick={() => router.push(`/courses/${course.slug.current}/classroom`)}
        className='h-12 w-full rounded-lg bg-green-600 font-bold text-white transition hover:bg-green-700'
      >
        เข้าสู่บทเรียน
      </button>
    )
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={submitting}
      className='h-12 w-full rounded-lg bg-blue-600 font-bold text-white transition hover:bg-blue-700 disabled:bg-gray-400'
    >
      {submitting ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนเข้าเรียน'}
    </button>
  )
}
