'use server'

import { adminClient } from '@/sanity/lib/admin-client'
import { groq } from 'next-sanity'

// ดึงข้อมูลข้อสอบตาม ID
export async function getExamById(examId: string) {
  try {
    const query = groq`*[_type == "exam" && _id == $examId][0]{
      _id,
      title,
      questions,
      "timeLimit": coalesce(timeLimit, 0),
      "passingScore": coalesce(passingScore, 60),
      "maxAttempts": coalesce(maxAttempts, 0),
      "shuffleQuestions": coalesce(shuffleQuestions, false)
    }`

    return await adminClient.fetch(query, { examId })
  } catch (error) {
    console.error('Fetch Exam Error:', error)
    return null
  }
}
