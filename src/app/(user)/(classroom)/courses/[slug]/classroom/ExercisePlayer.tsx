'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, ArrowRight, FileQuestion, Trophy } from 'lucide-react'
import { useState } from 'react'

// ปรับ Type ให้ตรงกับข้อมูลที่ดึงมาจาก Sanity Query ล่าสุด
interface ExerciseProps {
  exerciseData: {
    questions: Array<{
      _key: string
      questionType: string
      content: string // HTML string จาก Editor
      choices: Array<{
        _key: string
        choiceText: string
        choiceImage?: string
        isCorrect: boolean
      }>
      explanation?: string
    }>
  }
}

const thaiLabels = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช']

export default function ExercisePlayer({ exerciseData }: ExerciseProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  // เปลี่ยนการเก็บค่าจาก index (number) เป็น _key (string) เพื่อความแม่นยำ
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string | string[]>>({})
  const [isFinished, setIsFinished] = useState(false)
  const [isReviewMode, setIsReviewMode] = useState(false)

  const q = exerciseData.questions[currentQuestion]
  const isAnswered = (index: number) => selectedAnswers.hasOwnProperty(index)

  // คำนวณข้อที่ถูกจริง โดยหา choice ที่มี isCorrect เป็น true
  const correctCount = exerciseData.questions.reduce((acc, question, idx) => {
    const userAns = selectedAnswers[idx]

    // 1. ถ้าผู้เรียนยังไม่ได้ทำข้อนี้ ให้ข้ามไปเลย
    if (!userAns) return acc

    if (question.questionType === 'multiple') {
      // กรณีเลือกตอบหลายข้อ: ต้องเลือก "ครบ" และ "ถูกต้องทุกข้อ"
      const correctKeys = question.choices
        ?.filter((c) => c.isCorrect)
        .map((c) => c._key)
        .sort()

      const userKeys = Array.isArray(userAns) ? [...userAns].sort() : []

      const isCorrect = JSON.stringify(correctKeys) === JSON.stringify(userKeys)
      return isCorrect ? acc + 1 : acc
    } else {
      // กรณีเลือกตอบข้อเดียว (Single หรืออื่นๆ)
      const correctChoice = question.choices?.find((c) => c.isCorrect)
      return userAns === correctChoice?._key ? acc + 1 : acc
    }
  }, 0)

  return (
    <div className='mt-4'>
      {!isFinished ? (
        <>
          <Card className='relative z-10 mb-6 overflow-hidden rounded-xl border border-slate-800'>
            <CardHeader className='px-6 py-5'>
              <div className='text-primary mb-2 flex items-center gap-2'>
                <FileQuestion size={14} />
                <span className='text-sm'>
                  ข้อ {currentQuestion + 1} จาก {exerciseData.questions.length}
                </span>
              </div>
              <CardTitle className='text-lg font-medium'>
                <div
                  className='jodit-content'
                  dangerouslySetInnerHTML={{
                    __html: typeof q.content === 'string' ? q.content : 'ไม่พบคำถาม',
                  }}
                />
              </CardTitle>
            </CardHeader>

            <CardContent className='px-6'>
              <RadioGroup
                key={currentQuestion}
                disabled={isReviewMode} // ปิดการเลือกคำตอบในโหมดเฉลย
                value={
                  q.questionType === 'multiple'
                    ? ''
                    : (selectedAnswers[currentQuestion] as string) || ''
                }
                onValueChange={(val) => {
                  if (q.questionType === 'multiple') {
                    const currentRes =
                      (selectedAnswers[currentQuestion] as unknown as string[]) || []
                    const nextRes = currentRes.includes(val)
                      ? currentRes.filter((v) => v !== val)
                      : [...currentRes, val]
                    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: nextRes as any })
                  } else {
                    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: val })
                  }
                }}
                className='grid gap-2'
              >
                {q.choices?.map((opt, i) => {
                  const optionId = opt._key
                  const isActive = Array.isArray(selectedAnswers[currentQuestion])
                    ? (selectedAnswers[currentQuestion] as unknown as string[]).includes(optionId)
                    : selectedAnswers[currentQuestion] === optionId

                  let reviewColorClasses = ''
                  if (isReviewMode) {
                    if (opt.isCorrect) {
                      // ถ้าเป็นข้อที่ถูก -> สีเขียว
                      reviewColorClasses = 'border-green-500 bg-green-50'
                    } else if (isActive && !opt.isCorrect) {
                      // ถ้าเราเลือกแต่ผิด -> สีแดง
                      reviewColorClasses = 'border-red-500 bg-red-50'
                    } else {
                      // ข้ออื่นๆ ในหน้าเฉลย
                      reviewColorClasses = 'border-secondary opacity-60'
                    }
                  } else {
                    // โหมดปกติ:
                    reviewColorClasses = isActive
                      ? 'border-primary bg-primary/10 hover:bg-primary/20'
                      : 'border-secondary hover:bg-secondary/10'
                  }

                  return (
                    <Label
                      key={optionId}
                      htmlFor={optionId}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ${reviewColorClasses}`}
                    >
                      <RadioGroupItem value={optionId} id={optionId} className='sr-only' />
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-sm font-light ${
                          isReviewMode && opt.isCorrect
                            ? 'border-green-500 bg-green-500 text-white'
                            : isReviewMode && isActive && !opt.isCorrect
                              ? 'border-red-500 bg-red-500 text-white'
                              : isActive
                                ? 'border-primary bg-primary text-white'
                                : 'border-secondary text-secondary'
                        }`}
                      >
                        {thaiLabels[i]}
                      </div>

                      <div className='flex flex-1 flex-col gap-2'>
                        <span
                          className={`text-sm ${isActive ? 'text-primary font-medium' : 'text-slate-700'}`}
                        >
                          {opt.choiceText}
                        </span>
                        {/* แสดงรูปภาพประกอบในตัวเลือก (ถ้ามี) */}
                        {opt.choiceImage && (
                          <img
                            src={opt.choiceImage}
                            alt={`Option ${i}`}
                            className='max-h-40 w-fit rounded-lg border border-slate-100 object-contain'
                          />
                        )}
                      </div>
                    </Label>
                  )
                })}
              </RadioGroup>
              {isReviewMode && q.explanation && (
                <div className='animate-in fade-in slide-in-from-top-1 mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800'>
                  <div className='flex items-start gap-2'>
                    <span className='shrink-0 font-medium'>💡 อธิบายคำตอบ:</span>
                    <div dangerouslySetInnerHTML={{ __html: q.explanation }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Navigation */}
          <div className='flex items-center justify-between'>
            <Button
              variant='outline'
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion((prev) => prev - 1)}
            >
              <ArrowLeft className='size-5' /> ก่อนหน้า
            </Button>

            <div className='flex gap-2'>
              {currentQuestion === exerciseData.questions.length - 1 ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isReviewMode} className='bg-green-600 hover:bg-green-700'>
                      ส่งคำตอบ
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className='rounded-xl'>
                    <AlertDialogHeader>
                      <AlertDialogTitle className='text-xl font-medium'>
                        ยืนยันการส่งข้อสอบ ?
                      </AlertDialogTitle>
                      <AlertDialogDescription className='text-base'>
                        ตอบไปแล้ว {Object.keys(selectedAnswers).length} จาก{' '}
                        {exerciseData.questions.length} ข้อ
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ตรวจทาน</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => setIsFinished(true)}
                        className='bg-green-600 hover:bg-green-700'
                      >
                        ยืนยัน
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button onClick={() => setCurrentQuestion((prev) => prev + 1)}>
                  ถัดไป <ArrowRight className='ml-1 size-5' />
                </Button>
              )}
            </div>
          </div>

          {/* Compact Navigator */}
          <div className='mt-4 flex flex-wrap justify-center gap-2'>
            {exerciseData.questions.map((_, index) => (
              <button
                type='button'
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`size-10 rounded-full text-xs transition-all ${
                  currentQuestion === index
                    ? 'bg-primary cursor-pointer text-white'
                    : isAnswered(index)
                      ? 'cursor-pointer border border-blue-300/50 bg-blue-300/20 hover:bg-blue-300/80'
                      : 'hover:bg-secondary border-secondary cursor-pointer border bg-white hover:text-white'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Result Page */
        <Card className='mx-auto max-w-2xl p-8 text-center'>
          <div className='mb-6 flex justify-center'>
            <Trophy className='h-16 w-16 text-yellow-500' />
          </div>
          <CardTitle className='mb-4 text-2xl text-slate-800'>ส่งคำตอบเรียบร้อย</CardTitle>
          <div className='mb-8 text-lg font-normal text-slate-600'>
            ตอบถูกทั้งหมด <span className='font-medium text-green-600'>{correctCount}</span> ข้อ จาก{' '}
            <span className='font-medium'>{exerciseData.questions.length}</span> ข้อ
          </div>
          <div className='flex justify-center gap-4'>
            <Button
              variant='outline-muted'
              onClick={() => {
                setIsFinished(false)
                setIsReviewMode(true)
                setCurrentQuestion(0)
              }}
            >
              เฉลยคำตอบ
            </Button>

            <Button
              onClick={() => {
                setIsFinished(false)
                setCurrentQuestion(0)
                setSelectedAnswers({})
              }}
              className='bg-blue-600 hover:bg-blue-700'
            >
              ทำใหม่
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
