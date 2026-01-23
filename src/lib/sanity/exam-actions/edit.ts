'use server'

import { adminClient } from '@/sanity/lib/admin-client'
import { groq } from 'next-sanity'

// อัปเดตเฉพาะคำถามในชุดข้อสอบ
export async function updateExamDataAction(examId: string, data: any) {
  try {
    const { _id, _type, _rev, _createdAt, _updatedAt, ...cleanData } = data

    await adminClient
      .patch(examId)
      .set({
        ...cleanData,
        questions: cleanData.questions || [],
      })
      .commit()

    return { success: true }
  } catch (error) {
    console.error('Update Exam Error:', error)
    return { success: false, error: 'บันทึกข้อสอบไม่สำเร็จ' }
  }
}
