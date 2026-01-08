'use server'

import { adminClient } from '@/sanity/lib/admin-client'
import { groq } from 'next-sanity'

/**
 * 1. Fetch Metadata สำหรับหน้า CreateCourse
 */
export async function getCourseMetadata() {
  try {
    const [categories, instructors] = await Promise.all([
      adminClient.fetch(
        `*[_type == "category"] | order(title asc) { "value": _id, "label": title }`,
      ),
      adminClient.fetch(`*[_type == "instructor"] { "value": _id, "label": name }`),
    ])
    return { categories, instructors }
  } catch (error) {
    return { categories: [], instructors: [] }
  }
}

/**
 * 2. Fetch ข้อมูลหลักสูตรแบบเต็ม
 */
export async function getFullCourseDataAction(courseId: string) {
  try {
    const query = groq`{
      // 1. ข้อมูลตัวคอร์สและโครงสร้างทั้งหมด
      "course": *[_type == "course" && _id == $courseId][0] {
        ...,
        // แปลงฟิลด์พิเศษให้ใช้งานง่ายในฝั่ง Client
        "slug": slug.current,
        "image": image.asset->url,
        
        // ดึงข้อมูลหลักจากกลุ่ม References
        "mainInstructor": mainInstructor-> { 
           _id, 
           name, 
           "image": image.asset->url 
        },
        "categoryIds": categories[]._ref,
        "instructorIds": instructors[]._ref,
        "mainInstructorId": mainInstructor._ref,
        
        // ดึงโครงสร้าง Modules และขยายข้อมูล (Dereference) บทเรียนภายใน
        "modules": modules[] {
          _key, 
          title,
          "lessons": lessons[]-> { 
            _id, 
            _key, // สำคัญสำหรับดึง key จาก doc ต้นทางมาใช้ใน list
            title, 
            type, 
            "slug": slug.current, 
            videoUrl, 
            content 
          }
        },
        
        // ดึงข้อมูลในกลุ่ม Resources (เนื่องจากเป็น Object ใน Array ดึงตรงๆ ได้เลย)
        "resources": resources[] {
          _key,
          title,
          url,
          type
        }
      },
      
      // 2. ข้อมูล Metadata สำหรับ Dropdown ( categories & instructors ทั้งหมดในระบบ)
      "categories": *[_type == "category"] | order(title asc) { 
        "value": _id, 
        "label": title 
      },
      "instructors": *[_type == "instructor"] | order(name asc) { 
        "value": _id, 
        "label": name 
      }
    }`

    return await adminClient.fetch(query, { courseId })
  } catch (error) {
    console.error('Error fetching full course data:', error)
    return null
  }
}

/**
 * 3. Fetch รายการหลักสูตรทั้งหมด (สำหรับหน้า Admin)
 */
export async function getAllCoursesAction() {
  try {
    const query = groq`*[_type == "course"] | order(_createdAt desc) {
      _id,
      title,
      status,
      "slug": slug.current,
      "image": image.asset->url,
      level,
      "categoryTitles": categories[]->title,
      "mainInstructor": mainInstructor->{
         name,
         "photo": image.asset->url
      },
      "instructors": instructors[]->{
         name,
         "photo": image.asset->url
      }
    }`
    return await adminClient.fetch(query)
  } catch (error) {
    console.error('Fetch Courses Error:', error)
    return []
  }
}
