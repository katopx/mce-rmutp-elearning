import { client } from '@/sanity/lib/client'
import { validateSlug } from '@/utils/format'
import { groq } from 'next-sanity'
import { notFound } from 'next/dist/client/components/not-found'
import ClassroomClient from './ClassroomClient'

async function getCourseClassroom(slug: string) {
  const query = groq`*[_type == "course" && slug.current == $slug && status == "published"][0] {
    _id,
    title,
    "slug": slug.current,
        
    enableAssessment,
    examRef,
    
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

        // ดึงข้อมูลจาก Exercise (Inline จาก course.ts)
        "exerciseData": {
          "questions": exerciseData.questions[] {
            _key,
            questionType,
            content,
            choices[] {
              _key,
              choiceText,
              "choiceImage": choiceImage.asset->url,
              isCorrect
            },
            correctAnswerText,
            explanation
          },
          "questionCount": count(exerciseData.questions)
        },
        

        // ดึงข้อมูล Assessment (จาก exam.ts)
        "assessmentData": assessmentReference-> {
          _id,
          title,
          passingScore,
          timeLimit,
          shuffleQuestions,
          shuffleChoices,
          showResultImmediate,
          allowReview,
          preventTabSwitch,
          preventCopyPaste,
          questions[] {
            _key,
            questionType,
            content,
            choices[] {
              _key,
              choiceText,
              "choiceImage": choiceImage.asset->url,
              isCorrect
            },
            correctAnswerText,
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
    "totalExercises": count(modules[].lessons[lessonType == "exercise"]),
    "totalAssessments": count(modules[].lessons[lessonType == "assessment"]),
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
