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
    const level = formData.get('level') as string
    const imageFile = formData.get('image') as File

    // ข้อมูลจาก Firebase ที่ส่งมาจากหน้าบ้าน
    const creatorEmail = formData.get('creatorEmail') as string
    const creatorName = formData.get('creatorName') as string

    const instructorId = await getOrCreateInstructor(creatorEmail, creatorName)

    const existingCategoryIds = JSON.parse(formData.get('existingCategories') as string)
    const newCategoriesToCreate = JSON.parse(formData.get('newCategories') as string)

    // A. สร้างหมวดหมู่ใหม่ก่อน (ถ้ามี)
    const newlyCreatedCatRefs = await Promise.all(
      newCategoriesToCreate.map(async (cat: any) => {
        const created = await adminClient.create({
          _type: 'category',
          title: cat.title,
          slug: {
            _type: 'slug',
            current: cat.title
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9ก-๙\s-]/gi, '')
              .replace(/\s+/g, '-'),
          },
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
        })
        return created._id
      }),
    )

    const allCategoryIds = [...existingCategoryIds, ...newlyCreatedCatRefs]

    // B. อัปโหลดรูปภาพ
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const imageAsset = await adminClient.assets.upload('image', buffer, {
      filename: imageFile.name,
    })

    // C. สร้าง Document
    const newCourse = await adminClient.create({
      _type: 'course',
      title,
      slug: { _type: 'slug', current: slug },
      shortDescription,
      level,
      image: {
        _type: 'image',
        asset: { _type: 'reference', _ref: imageAsset._id },
      },
      mainInstructor: { _type: 'reference', _ref: instructorId },
      instructors: [{ _type: 'reference', _ref: instructorId, _key: 'owner' }],
      categories: allCategoryIds.map((id: string) => ({
        _type: 'reference',
        _ref: id,
        _key: Math.random().toString(36).slice(2),
      })),
      modules: [],
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
  description: string
  color: string
  icon: string
}) {
  try {
    const result = await adminClient.create({
      _type: 'category',
      title: payload.title,
      slug: { _type: 'slug', current: payload.slug },
      description: payload.description,
      color: payload.color,
      icon: payload.icon,
    })
    return {
      success: true,
      id: result._id,
      label: result.title,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * 3. บันทึกโครงสร้างหลักสูตรใหม่ (Modules, Lessons, Resources)
 */
export async function saveCourseStructureAction(
  courseId: string,
  modules: any[],
  resources: any[] = [],
) {
  try {
    // A. จัดการ Modules และ Lessons
    const processedModules = await Promise.all(
      modules.map(async (mod) => {
        const processedLessons = await Promise.all(
          (mod.lessons || []).map(async (lesson: any) => {
            // เตรียมข้อมูลสำหรับส่งไปที่ Sanity
            const lessonData = {
              title: lesson.title,
              type: lesson.type,
              // ป้องกัน slug เป็นค่าว่าง
              slug: lesson.slug?.current
                ? lesson.slug
                : {
                    _type: 'slug',
                    current:
                      lesson.title
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, '-') +
                      '-' +
                      Date.now(),
                  },
              videoUrl: lesson.videoUrl || '',
              content: lesson.content || [],
            }

            let lessonRefId = lesson._id

            // เช็คว่าเป็นบทเรียนใหม่ (สร้างจาก Sidebar) หรือบทเรียนเดิม
            if (lesson.isNew || lesson._id.startsWith('temp-')) {
              // สร้างบทเรียนใหม่ลง Sanity
              const newDoc = await adminClient.create({
                _type: 'lesson',
                ...lessonData,
              })
              lessonRefId = newDoc._id
            } else {
              // อัปเดตข้อมูลบทเรียนเดิม (Patch)
              await adminClient.patch(lesson._id).set(lessonData).commit()
            }

            // ส่งค่ากลับไปเป็น Reference เพื่อไปเก็บในฟิลด์ modules ของ Course
            return {
              _type: 'reference',
              _key: lesson._key || crypto.randomUUID(), // ป้องกัน key ซ้ำ
              _ref: lessonRefId,
            }
          }),
        )

        return {
          _key: mod._key,
          _type: 'object',
          title: mod.title,
          lessons: processedLessons,
        }
      }),
    )

    // B. จัดการ Resources (เอกสารประกอบ)
    const processedResources = resources.map((res) => ({
      _key: res._key || res._id || crypto.randomUUID(),
      title: res.title,
      url: res.url,
      type: res.type || 'link',
    }))

    // C. บันทึกลงตัวหลักสูตร
    await adminClient
      .patch(courseId)
      .set({
        modules: processedModules,
        resources: processedResources,
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
    const level = formData.get('level') as string
    const totalDuration = formData.get('totalDuration') as string
    const objectives = JSON.parse(formData.get('objectives') as string)
    const instructorIds = JSON.parse(formData.get('instructorIds') as string)
    const categoryIds = JSON.parse(formData.get('categoryIds') as string)
    const newCategories = JSON.parse(formData.get('newCategories') as string)
    const imageFile = formData.get('image') as File | null

    // เพิ่มหมวดหมู่ใหม่ (ถ้ามี)
    const newlyCreatedCatIds = await Promise.all(
      newCategories.map(async (cat: any) => {
        const created = await adminClient.create({
          _type: 'category',
          title: cat.title,
          slug: {
            _type: 'slug',
            current: cat.title.toLowerCase().trim().replace(/\s+/g, '-'),
          },
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
        })
        return created._id
      }),
    )

    const finalCategoryIds = [...categoryIds, ...newlyCreatedCatIds]

    let patchData: any = {
      title,
      slug: { _type: 'slug', current: slug },
      shortDescription,
      description,
      level,
      totalDuration,
      objectives,
      instructors: instructorIds.map((id: string, idx: number) => ({
        _type: 'reference',
        _ref: id,
        _key: idx === 0 ? 'owner' : Math.random().toString(36).slice(2),
      })),
      categories: finalCategoryIds.map((id: string) => ({
        _type: 'reference',
        _ref: id,
        _key: Math.random().toString(36).slice(2),
      })),
    }

    // ถ้ามีการอัปโหลดรูปใหม่
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

    await adminClient.patch(courseId).set(patchData).commit()
    revalidatePath(`/admin/courses/${courseId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
