'use server'

import { adminClient } from '@/sanity/lib/admin-client'
import { groq } from 'next-sanity'

/**
 * 1. เช็ค Slug ซ้ำ
 */
export async function checkSlugAction(slug: string, courseId?: string) {
  try {
    const query = courseId
      ? groq`count(*[_type == "course" && slug.current == $slug && _id != $courseId])`
      : groq`count(*[_type == "course" && slug.current == $slug])`

    const count = await adminClient.fetch(query, {
      slug,
      courseId,
    })

    return {
      isAvailable: count === 0,
      count,
    }
  } catch (error) {
    console.error('Check Slug Error:', error)
    return { isAvailable: false, error: 'ตรวจสอบไม่สำเร็จ' }
  }
}

/**
 *  2. ตรวจสอบว่าผู้สอนมีในระบบหรือไม่ ถ้าไม่มีให้สร้างผู้สอนใหม่
 */
export async function getOrCreateInstructor(email: string, name: string) {
  try {
    // A. ทำความสะอาด Email (ป้องกันช่องว่างหรือตัวพิมพ์ใหญ่ที่อาจทำให้หาไม่เจอ)
    const cleanEmail = email.toLowerCase().trim()

    // B. ค้นหา ID
    const query = groq`*[_type == "instructor" && email == $email][0]._id`
    const existingId = await adminClient.fetch(query, { email: cleanEmail })

    if (existingId) return existingId

    // C. ถ้าไม่เจอ ให้สร้างใหม่พร้อมจัดการ Slug ให้เรียบร้อย
    // แนะนำให้ใช้ชื่อที่ส่งมา หรือถ้าไม่มีค่อยใช้ Prefix ของ Email
    const instructorName = name || cleanEmail.split('@')[0]

    const newInstructor = await adminClient.create({
      _type: 'instructor',
      email: cleanEmail,
      name: instructorName,
      // สร้าง slug พื้นฐานเพื่อให้ระบบ link ไปหน้า profile ได้ไม่พัง
      slug: {
        _type: 'slug',
        current: instructorName
          .toLowerCase()
          .replace(/[^a-z0-9ก-๙\s-]/gi, '')
          .replace(/[\s-]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 96),
      },
      jobPosition: 'Instructor',
    })

    console.log(`✅ Created new instructor: ${instructorName} (${cleanEmail})`)
    return newInstructor._id
  } catch (error) {
    console.error('Error in getOrCreateInstructor:', error)
    throw new Error('ระบบไม่สามารถระบุตัวตนผู้สอนได้')
  }
}

// 1. สร้าง Exam ใหม่ และผูกเข้ากับ Course ทันที
export async function createAndLinkExamAction(courseId: string, title: string) {
  try {
    // 1.1 สร้างเอกสาร Exam
    const newExam = await adminClient.create({
      _type: 'exam',
      title: title,
      questions: [], // เริ่มต้นเป็น array ว่าง
      settings: {
        timeLimit: 0,
        passingScore: 60,
        maxAttempts: 0,
        shuffleQuestions: false,
      },
    })

    // 1.2 ผูกเข้ากับ Course และเปิด Switch enableAssessment
    await adminClient
      .patch(courseId)
      .set({
        enableAssessment: true, // เปิดสวิตช์หลัก
        examRef: { _type: 'reference', _ref: newExam._id }, // ผูก Reference
      })
      .commit()

    return { success: true, examId: newExam._id }
  } catch (error) {
    console.error('Create Exam Error:', error)
    return { success: false, error: 'ไม่สามารถสร้างข้อสอบได้' }
  }
}

// 2. ลบการเชื่อมโยง (Unlink)
export async function unlinkExamAction(courseId: string) {
  try {
    await adminClient
      .patch(courseId)
      .set({ enableAssessment: false }) // ปิดสวิตช์
      .unset(['examRef']) // ลบ Reference ออก
      .commit()

    return { success: true }
  } catch (error) {
    console.error('Unlink Exam Error:', error)
    return { success: false, error: 'ไม่สามารถลบการเชื่อมโยงได้' }
  }
}
