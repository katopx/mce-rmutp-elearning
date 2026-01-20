'use server'

import { adminClient } from '@/sanity/lib/admin-client'
import { groq } from 'next-sanity'

// สร้างชุดข้อสอบใหม่ (Auto-create)
export async function createNewExamAction(title: string) {
  try {
    const newExam = await adminClient.create({
      _type: 'exam',
      title: title,
      questions: [],
      passingScore: 70,
      timeLimit: 60,
    })
    return newExam._id
  } catch (error) {
    console.error('Error creating exam:', error)
    throw new Error('Create exam failed')
  }
}

// อัปเดตเฉพาะคำถามในชุดข้อสอบ
export async function updateExamDataAction(examId: string, data: any) {
  try {
    // แยก questions กับ settings ออกจากกัน
    const { questions, ...settings } = data

    await adminClient
      .patch(examId)
      .set({
        questions: questions || [],
        ...settings, // timeLimit, passingScore, etc.
      })
      .commit()

    return { success: true }
  } catch (error) {
    console.error('Update Exam Error:', error)
    return { success: false, error: 'บันทึกข้อสอบไม่สำเร็จ' }
  }
}
