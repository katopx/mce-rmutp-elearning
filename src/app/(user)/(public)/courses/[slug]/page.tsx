import { client } from '@/sanity/lib/client'
import { validateSlug } from '@/utils/format'
import { notFound } from 'next/dist/client/components/not-found'
import CourseDetailClient from './CourseDetailClient'
import { groq } from 'next-sanity'

async function showCourseDetail(slug: string) {
  const query = groq`*[_type == "course" && slug.current == $slug && status == "published"][0] {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    shortDescription,
    description,
    objectives,
    difficulty,
    rating,
    registered,
    "image": image.asset->url,
    "category": category[]->title,

    enableAssessment,
    assessmentConfig,
    
    "exam": examRef->{
      _id,
      title,
      timeLimit,
      passingScore,
      "totalQuestions": count(questions)
    },
    
    // ข้อมูลผู้สอนหลัก
    "instructor": instructor-> {
      name,
      jobPosition,
      bio,
      "image": image.asset->url,
      contact {
        facebook,
        line,
        phone,
        website
      }
    },
    
    // ข้อมูลผู้สอนร่วม (Array)
    "coInstructors": coInstructors[]-> {
      name,
      jobPosition,
      bio,
      "image": image.asset->url,
      contact {
        facebook,
        line,
        phone,
        website
      }
    },
    
    // โครงสร้างบทเรียน
    modules[] {
      _key,
      title,
      lessons[] {
        _key,
        title,
        lessonType,
        lessonDuration,
        "exerciseQuestionCount": count(exerciseData.questions),
      }
    },
    
    // ไฟล์แนบ
    resources[] {
      _key,
      title,
      fileUrl,
      fileType
    },
    
    // สถิติและเวลาเรียน
    "totalLessons": count(modules[].lessons[]),
    "totalVideos": count(modules[].lessons[lessonType == "video"]),
    "totalArticles": count(modules[].lessons[lessonType == "article"]),
    "totalExercises": count(modules[].lessons[lessonType == "exercise"]),
    "courseDuration": math::sum(modules[].lessons[].lessonDuration)
  }`

  return await client.fetch(query, { slug })
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const decodedSlug = validateSlug((await params).slug)
  const course = await showCourseDetail(decodedSlug)

  if (!course) return notFound()

  return <CourseDetailClient course={course} />
}
