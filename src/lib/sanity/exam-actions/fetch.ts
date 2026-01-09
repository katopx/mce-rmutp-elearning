'use server'

import { adminClient } from '@/sanity/lib/admin-client'

// ดึงข้อมูลข้อสอบตาม ID
export async function getExamByIdAction(id: string) {
  try {
    const query = `*[_type == "exam" && _id == $id][0]`
    const exam = await adminClient.fetch(query, { id })
    return exam
  } catch (error) {
    console.error('Error fetching exam:', error)
    return null
  }
}
