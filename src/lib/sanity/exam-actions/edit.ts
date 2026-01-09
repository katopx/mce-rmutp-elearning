'use server'

import { adminClient } from '@/sanity/lib/admin-client'

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
export async function updateExamQuestionsAction(id: string, questions: any[]) {
  try {
    await adminClient.patch(id).set({ questions }).commit()
    return { success: true }
  } catch (error) {
    console.error('Error updating questions:', error)
    return { success: false }
  }
}

// อัปเดตการตั้งค่า (Settings) ของข้อสอบ
export async function updateExamSettingsAction(id: string, settings: any) {
  try {
    await adminClient
      .patch(id)
      .set({
        timeLimit: parseInt(settings.timeLimit) || 0,
        passingScore: parseInt(settings.passingScore) || 0,
        maxAttempts: parseInt(settings.maxAttempts) || 0,
        shuffleQuestions: settings.shuffleQuestions || false,
      })
      .commit()
    return { success: true }
  } catch (error) {
    console.error('Error updating settings:', error)
    return { success: false }
  }
}
