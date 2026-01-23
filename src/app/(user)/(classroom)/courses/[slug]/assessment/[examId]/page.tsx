import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'
import { notFound, redirect } from 'next/navigation'
import AssessmentClient from './AssessmentClient'

interface PageProps {
  params: Promise<{ slug: string; examId: string }>
  searchParams: Promise<{ mode?: string }>
}

// Query ดึงข้อมูลข้อสอบ
async function getExamData(examId: string) {
  const query = groq`*[_type == "exam" && _id == $examId][0] {
    _id,
    title,
    timeLimit, 
    passingScore,
    maxAttempts,
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
    }
  }`

  return await client.fetch(query, { examId })
}

// Query ดึง Course ID (เพื่อเอาไป Save ลง Firebase)
async function getCourseId(slug: string) {
  const query = groq`*[_type == "course" && slug.current == $slug][0]._id`
  return await client.fetch(query, { slug })
}

export default async function AssessmentPage({ params, searchParams }: PageProps) {
  const { slug, examId } = await params
  const { mode } = await searchParams

  // ตรวจสอบ Mode (ต้องเป็น pre หรือ post เท่านั้น)
  const validMode = mode === 'post' ? 'post_test' : 'pre_test'

  const [exam, courseId] = await Promise.all([getExamData(examId), getCourseId(slug)])

  if (!exam || !courseId) notFound()

  return <AssessmentClient exam={exam} courseId={courseId} courseSlug={slug} mode={validMode} />
}
