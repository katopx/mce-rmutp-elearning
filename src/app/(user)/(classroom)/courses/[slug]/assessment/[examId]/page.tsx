import { client } from '@/sanity/lib/client'
import { groq } from 'next-sanity'
import { notFound } from 'next/navigation'
import AssessmentPlayer from './AssessmentPlayer'

interface Props {
  params: Promise<{
    slug: string
    examId: string
  }>
}

async function getAssessmentData(examId: string) {
  const query = groq`*[_id == $examId][0] {
    _id,
    title,
    timeLimit,
    passingScore,
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
      explanation
    }
  }`

  return await client.fetch(query, { examId })
}

export default async function AssessmentPage({ params }: Props) {
  const { examId } = await params
  const assessmentData = await getAssessmentData(examId)

  if (!assessmentData) {
    notFound()
  }

  return (
    <main className='min-h-screen bg-slate-50 py-10'>
      <div className='container mx-auto max-w-4xl px-4'>
        {/* Header ส่วนหัวของหน้าสอบ */}
        <div className='mb-8 flex flex-col items-center text-center'>
          <h1 className='mb-2 text-3xl font-bold text-slate-900'>{assessmentData.title}</h1>
          <div className='bg-primary mb-4 h-1 w-20 rounded-full' />
          <p className='max-w-md text-slate-500'>
            ขอให้คุณตั้งใจทำข้อสอบอย่างเต็มที่
            ระบบจะทำการบันทึกคะแนนหลังจากที่คุณกดส่งคำตอบหรือหมดเวลา
          </p>
        </div>

        {/* เรียกใช้ Player ที่คุณทำไว้ */}
        <AssessmentPlayer assessmentData={assessmentData} />
      </div>
    </main>
  )
}
