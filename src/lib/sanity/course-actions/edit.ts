'use server'

import { adminClient } from '@/sanity/lib/admin-client'
import { revalidatePath } from 'next/cache'
import { getOrCreateInstructor } from './utils'

/**
 * 1. สร้างหลักสูตรใหม่
 */
export async function createCourseAction(formData: FormData) {
  try {
    const title = formData.get('title') as string
    const slug = formData.get('slug') as string
    const shortDescription = formData.get('shortDescription') as string
    const difficulty = formData.get('difficulty') as string
    const imageFile = formData.get('image') as File

    const creatorEmail = formData.get('creatorEmail') as string
    const creatorName = formData.get('creatorName') as string

    // 1. จัดการ Instructor
    const instructorId = await getOrCreateInstructor(creatorEmail, creatorName)

    // 2. จัดการ Categories
    const existingCategoryIds = JSON.parse((formData.get('existingCategories') as string) || '[]')
    const newCategoriesToCreate = JSON.parse((formData.get('newCategories') as string) || '[]')

    const newlyCreatedCatRefs = await Promise.all(
      newCategoriesToCreate.map(async (cat: any) => {
        const created = await adminClient.create({
          _type: 'category',
          categoryType: 'course', // ✅ สำคัญมาก: เพื่อให้ตรงกับ Filter ใน Schema
          title: cat.title,
          slug: {
            _type: 'slug',
            current: `c-${cat.title // ✅ ใส่ prefix c- ตามลอจิกใน Schema category
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9ก-๙\s-]/gi, '')
              .replace(/\s+/g, '-')}`,
          },
          description: cat.description,
          color: cat.color || '#3b82f6',
          icon: cat.icon,
        })
        return created._id
      }),
    )

    const allCategoryIds = [...existingCategoryIds, ...newlyCreatedCatRefs]

    // 3. อัปโหลดรูปภาพ (เช็คก่อนว่ามีไฟล์ไหม)
    let imageReference = null
    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const imageAsset = await adminClient.assets.upload('image', buffer, {
        filename: imageFile.name,
      })
      imageReference = {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAsset._id },
      }
    }

    // 4. สร้าง Course Document (ปรับฟิลด์ให้ตรง Schema)
    const newCourse = await adminClient.create({
      _type: 'course',
      status: 'draft',
      title,
      slug: { _type: 'slug', current: slug },
      shortDescription,
      difficulty, // ✅ เปลี่ยนจาก level
      image: imageReference,

      // ✅ เปลี่ยนจาก Instructor เป็น instructor ตาม Schema ใหม่
      instructor: { _type: 'reference', _ref: instructorId },

      // ✅ เปลี่ยนจาก categories เป็น category ตาม Schema ใหม่ (Array ของ Reference)
      category: allCategoryIds.map((id: string) => ({
        _type: 'reference',
        _ref: id,
        _key: Math.random().toString(36).slice(2), // ป้องกัน key ซ้ำ
      })),

      coInstructors: [], // เริ่มต้นเป็นค่าว่าง
      modules: [],
      resources: [],
      objectives: [],
      rating: 5,
      registered: 0,
    })

    revalidatePath('/admin/courses')
    return { success: true, id: newCourse._id }
  } catch (error: any) {
    console.error('Create Course Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 2. สร้างหมวดหมู่ใหม่
 */
export async function createCategoryAction(payload: {
  title: string
  slug: string
  description?: string
  color?: string
  icon?: string
  categoryType?: 'course' | 'manual'
}) {
  try {
    const result = await adminClient.create({
      _type: 'category',
      categoryType: payload.categoryType || 'course',
      title: payload.title,
      slug: {
        _type: 'slug',
        current:
          payload.slug.startsWith('c-') || payload.slug.startsWith('m-')
            ? payload.slug
            : `c-${payload.slug}`,
      },
      description: payload.description,
      color: payload.color || '#3b82f6',
      icon: payload.icon,
    })

    return {
      success: true,
      id: result._id,
      label: result.title,
      value: result._id,
    }
  } catch (error: any) {
    console.error('Create Category Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 3. บันทึกโครงสร้างหลักสูตรใหม่ (Modules, Lessons, Resources)
 */
export async function saveCourseStructureAction(
  courseId: string,
  modules: any[],
  status: string,
  resources: any[] = [],
) {
  try {
    // A. จัดการ Modules และ Lessons (แบบ Inline ตาม Schema)
    const processedModules = modules.map((mod) => {
      const processedLessons = (mod.lessons || []).map((lesson: any) => {
        // สร้างก้อนข้อมูล Lesson ให้ตรงกับ Schema defineField ล่าสุด
        const lessonData: any = {
          _key: lesson._key || crypto.randomUUID(),
          _type: 'lesson',
          title: lesson.title,
          lessonType: lesson.lessonType || 'video',
          isFree: lesson.isFree || false,
          lessonDuration: Number(lesson.lessonDuration) || 0,
        }

        // 1. ถ้าเป็น Video
        if (lessonData.lessonType === 'video') {
          lessonData.videoSource = lesson.videoSource || 'youtube'
          lessonData.videoUrl = lesson.videoUrl || ''
          lessonData.videoContent = lesson.videoContent || ''
        }

        // 2. ถ้าเป็น Article
        if (lessonData.lessonType === 'article') {
          lessonData.articleContent = lesson.articleContent || ''
        }

        // 3. ถ้าเป็น Exercise (เก็บข้อมูลคำถาม Inline)
        if (lessonData.lessonType === 'exercise') {
          lessonData.exerciseData = lesson.exerciseData || { questions: [] }
        }

        // 4. ถ้าเป็น Assessment (Reference ไปที่คลังข้อสอบ)
        if (lessonData.lessonType === 'assessment') {
          lessonData.assessmentReference = lesson.assessmentReferenceId
            ? { _type: 'reference', _ref: lesson.assessmentReferenceId }
            : lesson.assessmentReference
        }

        return lessonData
      })

      return {
        _key: mod._key || crypto.randomUUID(),
        _type: 'module',
        title: mod.title,
        lessons: processedLessons,
      }
    })

    // B. จัดการ Resources (ใช้ฟิลด์ fileUrl และ fileType ตาม Schema)
    const processedResources = resources.map((res) => ({
      _key: res._key || crypto.randomUUID(),
      title: res.title,
      fileUrl: res.fileUrl || res.url,
      fileType: res.fileType || res.type || 'link',
    }))

    // C. บันทึกลงตัวหลักสูตร (ใช้ Patch ครั้งเดียวจบ)
    await adminClient
      .patch(courseId)
      .set({
        modules: processedModules,
        resources: processedResources,
        status: status,
      })
      .commit()

    revalidatePath(`/admin/courses/${courseId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Save Structure Error:', error)
    return { success: false, error: error.message || 'Failed to save structure' }
  }
}

/**
 * 2. Update ข้อมูลหลักสูตรพื้นฐาน
 */
export async function updateCourseAction(courseId: string, formData: FormData) {
  try {
    const title = formData.get('title') as string
    const slug = formData.get('slug') as string
    const shortDescription = formData.get('shortDescription') as string
    const description = formData.get('description') as string
    const difficulty = formData.get('difficulty') as string
    const objectives = JSON.parse((formData.get('objectives') as string) || '[]')

    // แยก Instructor หลัก และ ผู้สอนร่วม
    const instructorId = formData.get('instructorId') as string
    const coInstructorIds = JSON.parse((formData.get('coInstructorIds') as string) || '[]')

    const categoryIds = JSON.parse((formData.get('categoryIds') as string) || '[]')
    const newCategories = JSON.parse((formData.get('newCategories') as string) || '[]')
    const imageFile = formData.get('image') as File | null

    // 1. เพิ่มหมวดหมู่ใหม่ (ถ้ามี)
    const newlyCreatedCatIds = await Promise.all(
      newCategories.map(async (cat: any) => {
        const created = await adminClient.create({
          _type: 'category',
          categoryType: 'course',
          title: cat.title,
          slug: {
            _type: 'slug',
            current: `c-${cat.title
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9ก-๙\s-]/gi, '')
              .replace(/\s+/g, '-')}`,
          },
          description: cat.description,
          color: cat.color || '#3b82f6',
          icon: cat.icon,
        })
        return created._id
      }),
    )

    const finalCategoryIds = [...categoryIds, ...newlyCreatedCatIds]

    // 2. เตรียมข้อมูล Patch
    let patchData: any = {
      title,
      slug: { _type: 'slug', current: slug },
      shortDescription,
      description,
      difficulty,
      objectives,
      // ✅ ผู้สอนหลัก (Reference เดียว)
      instructor: {
        _type: 'reference',
        _ref: instructorId,
      },
      // ✅ ผู้สอนร่วม (Array ของ References)
      coInstructors: coInstructorIds.map((id: string) => ({
        _type: 'reference',
        _ref: id,
        _key: crypto.randomUUID(),
      })),
      // ✅ หมวดหมู่ (Array ของ References)
      category: finalCategoryIds.map((id: string) => ({
        _type: 'reference',
        _ref: id,
        _key: crypto.randomUUID(),
      })),
    }

    // 3. ถ้ามีการอัปโหลดรูปใหม่
    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const imageAsset = await adminClient.assets.upload('image', buffer, {
        filename: imageFile.name,
      })
      patchData.image = {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAsset._id },
      }
    }

    // 4. บันทึก
    await adminClient.patch(courseId).set(patchData).commit()

    revalidatePath(`/admin/courses/${courseId}`)
    revalidatePath(`/admin/courses`)

    return { success: true }
  } catch (error: any) {
    console.error('Update Course Error:', error)
    return { success: false, error: error.message }
  }
}
