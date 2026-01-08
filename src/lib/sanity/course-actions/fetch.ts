'use server'

import { adminClient } from '@/sanity/lib/admin-client'
import { groq } from 'next-sanity'

/**
 * 1. Fetch Metadata สำหรับหน้า CreateCourse
 */
export async function getCourseMetadata() {
  try {
    const query = groq`{
      "categories": *[_type == "category" && categoryType == "course"] | order(title asc) { 
        "value": _id, 
        "label": title 
      },
      "instructors": *[_type == "instructor"] | order(name asc) { 
        "value": _id, 
        "label": name 
      },
      "exams": *[_type == "exam"] | order(title asc) {
        "value": _id,
        "label": title
      }
    }`

    const data = await adminClient.fetch(query)

    return {
      categories: data.categories || [],
      instructors: data.instructors || [],
      exams: data.exams || [],
    }
  } catch (error) {
    console.error('Metadata Fetch Error:', error)
    return { categories: [], instructors: [], exams: [] }
  }
}

/**
 * 2. Fetch ข้อมูลหลักสูตรแบบเต็มตามโครงสร้าง Schema ล่าสุด
 * ใช้สำหรับหน้า Admin Course Editor
 */
export async function getFullCourseDataAction(courseId: string) {
  try {
    const query = groq`{
      // 1. ดึงข้อมูลตัว Course
      "course": *[_type == "course" && _id == $courseId][0] {
        ...,
        "slug": slug.current,
        "image": image.asset->url,
        
        // --- ส่วน References (instructor, coInstructors, category) ---
        "instructor": instructor-> { 
           _id, 
           name, 
           "image": image.asset->url 
        },
        "instructorId": instructor._ref, // สำหรับ Select Default Value
        
        "coInstructors": coInstructors[]-> {
           _id,
           name,
           "image": image.asset->url
        },
        "coInstructorIds": coInstructors[]._ref, // สำหรับ Multi-select Default Value

        "category": category[]-> {
           "value": _id,
           "label": title,
           color,
           icon
        },
        "categoryIds": category[]._ref, // สำหรับ Multi-select Default Value

        // --- ส่วน Content (modules -> lessons) ---
        "modules": modules[] {
          _key,
          title,
          "lessons": lessons[] {
            _key,
            title,
            lessonType,
            isFree,
            lessonDuration,
            videoSource,
            videoUrl,
            videoContent,
            articleContent,
            // แบบฝึกหัด (Inline Object)
            exerciseData {
              questions[] {
                _key,
                questionType,
                content,
                explanation,
                correctAnswerText,
                choices[] {
                  _key,
                  choiceText,
                  isCorrect,
                  "choiceImage": choiceImage.asset->url
                }
              }
            },
            // แบบทดสอบ (Reference ไปยัง Exam)
            "assessmentData": assessmentReference-> {
              _id,
              title,
              "questionCount": count(questions)
            },
            "assessmentReferenceId": assessmentReference._ref
          }
        },

        // --- ส่วน Resources (File List) ---
        "resources": resources[] {
          _key,
          title,
          fileUrl,
          fileType
        }
      },

      // 2. ดึง Metadata ทั้งหมดมาไว้ทำ Dropdown (แก้ปัญหา .find() พัง)
      "allCategories": *[_type == "category" && categoryType == "course"] | order(title asc) { 
        "value": _id, 
        "label": title 
      },
      "allInstructors": *[_type == "instructor"] | order(name asc) { 
        "value": _id, 
        "label": name 
      },
      "allExams": *[_type == "exam"] | order(title asc) {
        "value": _id,
        "label": title
      }
    }`

    const data = await adminClient.fetch(query, { courseId })

    // ตรวจสอบข้อมูลก่อนส่งกลับ
    if (!data.course) return null

    return {
      ...data.course,
      allCategories: data.allCategories || [],
      allInstructors: data.allInstructors || [],
      allExams: data.allExams || [],
    }
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
      "status": coalesce(status, 'draft'),
      "slug": slug.current,
      "image": image.asset->url,
      difficulty,

      "category": category[]->title,
      "mainCategory": category[0]->title,

      // ข้อมูลผู้สอนหลัก
      "instructor": instructor-> {
        name,
        "image": image.asset->url,
      },
      
      // ผู้สอนร่วม
      "coInstructors": coInstructors[]->{
        name,
        "image": image.asset->url
      },

      // สถิติเบื้องต้น
      "totalLessons": count(modules[].lessons[]),
      "totalModules": count(modules),
      "registered": coalesce(registered, 0),

      "_createdAt": _createdAt,
      "_updatedAt": _updatedAt
    }`
    return await adminClient.fetch(query)
  } catch (error) {
    console.error('Fetch Courses Error:', error)
    return []
  }
}
