import { client } from '@/sanity/lib/client'
import { validateSlug } from '@/utils/format'
import { notFound } from 'next/dist/client/components/not-found'
import ClassroomClient from './ClassroomClient'
import { groq } from 'next-sanity'

async function getCourseClassroom(slug: string) {
  const query = groq`*[_type == "course" && slug.current == $slug && status == "published"][0] {
    _id,
    title,
    "slug": slug.current,
        
    // โครงสร้างบทเรียน
    modules[] {
      _key,
      title,
      lessons[] {
        _key,
        title,
        lessonType,
        lessonDuration,
        videoUrl,
        videoSource,
        videoContent,
        articleContent,

        // ดึงข้อมูลจาก exam.ts
	      "quizData": quizReference-> {
          _id,
          title,
          category,
          passingScore,
          questions[] {
            _key,
            content,
            choices[] {
              _key,
              choiceText,
              isCorrect,
            },
            explanation
            },
          "questionCount": count(questions)
        }
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
    "totalQuizzes": count(modules[].lessons[lessonType == "quiz"]),
    "courseDuration": math::sum(modules[].lessons[].lessonDuration)
  }`

  return await client.fetch(query, { slug })
}
export default async function ClassroomPage({ params }: { params: Promise<{ slug: string }> }) {
  const decodedSlug = validateSlug((await params).slug)
  const course = await getCourseClassroom(decodedSlug)

  if (!course) notFound()

  return <ClassroomClient course={course} />
}
