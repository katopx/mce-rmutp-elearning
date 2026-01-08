'use server'

import { adminClient } from '@/sanity/lib/admin-client'

/**
 * 1. เช็ค Slug ซ้ำ
 */
export async function checkSlugAction(slug: string) {
  try {
    const count = await adminClient.fetch(`count(*[_type == "course" && slug.current == $slug])`, {
      slug,
    })
    return { isAvailable: count === 0 }
  } catch (error) {
    return { isAvailable: false, error: 'ตรวจสอบไม่สำเร็จ' }
  }
}

/**
 *  2. ตรวจสอบว่าผู้สอนมีในระบบหรือไม่ ถ้าไม่มีให้สร้างผู้สอนใหม่
 */
export async function getOrCreateInstructor(email: string, name: string) {
  try {
    // A. ค้นหาใน Sanity ว่ามีอีเมลนี้หรือยัง
    const query = `*[_type == "instructor" && email == $email][0]._id`
    const existingId = await adminClient.fetch(query, { email })

    if (existingId) return existingId

    // B. ถ้ายังไม่มี ให้สร้าง Document ใหม่ให้เลย (Auto-Provisioning)
    const newInstructor = await adminClient.create({
      _type: 'instructor',
      email: email,
      name: name || email.split('@')[0],
      role: 'Instructor',
    })

    return newInstructor._id
  } catch (error) {
    console.error('Error in getOrCreateInstructor:', error)
    throw new Error('ระบบไม่สามารถระบุตัวตนผู้สอนได้')
  }
}
