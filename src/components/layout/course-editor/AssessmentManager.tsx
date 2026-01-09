'use client'

import { useEffect, useState } from 'react'
import { FileQuestion, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ExerciseManager from './ExerciseManager'
import { getExamByIdAction, updateExamQuestionsAction } from '@/lib/sanity/exam-actions'
import { toast } from 'sonner'

export default function AssessmentManager({ examId }: { examId: string }) {
  const [questions, setQuestions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ดึงข้อมูลข้อสอบเมื่อ examId เปลี่ยน
  useEffect(() => {
    async function loadExam() {
      if (!examId) return
      setIsLoading(true)
      const data = await getExamByIdAction(examId)
      setQuestions(data?.questions || [])
      setIsLoading(false)
    }
    loadExam()
  }, [examId])

  // บันทึกคำถามเมื่อมีการแก้ไขใน ExerciseManager
  const handleUpdate = async (newQuestions: any[]) => {
    setQuestions(newQuestions) // Update UI ทันที
    const res = await updateExamQuestionsAction(examId, newQuestions)
    if (res.success) {
      // ไม่ต้อง toast บ่อยก็ได้เพราะมี Debounce ใน TextEditor อยู่แล้ว
    } else {
      toast.error('บันทึกคำถามไม่สำเร็จ')
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-40 items-center justify-center text-slate-400'>
        <Loader2 className='mr-2 size-5 animate-spin' />
        กำลังโหลดข้อมูลข้อสอบ...
      </div>
    )
  }

  return (
    <div className='animate-in fade-in space-y-6 duration-500'>
      <div className='flex items-center justify-between border-b border-slate-100 pb-4'>
        <div className='flex items-center gap-2'>
          <div className='flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600'>
            <FileQuestion className='size-5' />
          </div>
          <h3 className='text-base font-medium text-slate-900'>จัดการโจทย์ข้อสอบ</h3>
        </div>
        <Badge variant='outline' className='font-normal text-slate-500'>
          {questions.length} ข้อ
        </Badge>
      </div>

      <ExerciseManager questions={questions} onChange={handleUpdate} />
    </div>
  )
}
