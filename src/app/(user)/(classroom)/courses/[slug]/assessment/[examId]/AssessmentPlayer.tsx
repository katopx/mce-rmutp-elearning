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
import { AlertCircle, ArrowLeft, ArrowRight, FileQuestion, Timer, Trophy } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

// ปรับ Type ให้ตรงกับข้อมูลที่ดึงมาจาก Sanity Query ล่าสุด
interface ExerciseProps {
  assessmentData: {
    title: string
    timeLimit: number
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

export default function ExercisePlayer({ assessmentData }: ExerciseProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [isFinished, setIsFinished] = useState(false)
  const [isReviewMode, setIsReviewMode] = useState(false)

  // state สำหรับจับเวลาข้อสอบ
  const [timeLeft, setTimeLeft] = useState(assessmentData.timeLimit * 60)
  const [isTimeOut, setIsTimeOut] = useState(false)

  const q = assessmentData.questions[currentQuestion]
  const isAnswered = (index: number) => selectedAnswers.hasOwnProperty(index)

  const handleSubmit = useCallback(() => {
    setIsFinished(true)
  }, [])

  useEffect(() => {
    if (timeLeft <= 0 || isFinished) {
      if (timeLeft <= 0 && !isFinished) {
        setIsTimeOut(true)
        handleSubmit()
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, isFinished, handleSubmit])

  // ฟังก์ชันแปลงวินาทีเป็น MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const correctCount = assessmentData.questions.reduce((acc, question, idx) => {
    const userAns = selectedAnswers[idx]

    if (!userAns) return acc

    if (question.questionType === 'multiple') {
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
      {/* ⏱️ ตัวจับเวลา */}
      {!isFinished && (
        <div
          className={`sticky top-20 z-20 mb-4 flex items-center justify-between rounded-full border px-6 py-2 shadow-sm ${timeLeft < 60 ? 'animate-pulse border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-700'}`}
        >
          <div className='flex items-center gap-2 font-medium'>
            <Timer size={18} />
            <span>{timeLeft < 60 ? 'ใกล้หมดเวลาแล้ว!' : 'เวลาที่เหลือ'}</span>
          </div>
          <div className='font-mono text-xl font-bold'>{formatTime(timeLeft)}</div>
        </div>
      )}

      {!isFinished ? (
        <>
          <Card className='relative z-10 mb-6 overflow-hidden rounded-xl border border-slate-800'>
            <CardHeader className='px-6 py-5'>
              <div className='text-primary mb-2 flex items-center gap-2'>
                <FileQuestion size={14} />
                <span className='text-sm'>
                  ข้อ {currentQuestion + 1} จาก {assessmentData.questions.length}
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
                value={selectedAnswers[currentQuestion] || ''}
                onValueChange={(val) =>
                  setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: val })
                }
                className='grid gap-2'
              >
                {q.choices?.map((opt, i) => {
                  const optionId = opt._key
                  const isActive = selectedAnswers[currentQuestion] === optionId
                  return (
                    <Label
                      key={optionId}
                      htmlFor={optionId}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ${
                        isActive
                          ? 'border-primary bg-primary/10 hover:bg-primary/20'
                          : 'border-secondary hover:bg-secondary/10'
                      }`}
                    >
                      <RadioGroupItem value={optionId} id={optionId} className='sr-only' />
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-sm font-light ${
                          isActive
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
              {currentQuestion === assessmentData.questions.length - 1 ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className='bg-green-600 hover:bg-green-700'>ส่งข้อสอบ</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className='rounded-xl'>
                    <AlertDialogHeader>
                      <AlertDialogTitle className='text-xl font-medium'>
                        ยืนยันการส่งข้อสอบ ?
                      </AlertDialogTitle>
                      <AlertDialogDescription className='text-xl font-medium'>
                        หากส่งแล้วจะไม่สามารถกลับมาแก้ไขคำตอบได้
                      </AlertDialogDescription>
                      <AlertDialogDescription className='text-base'>
                        ตอบไปแล้ว {Object.keys(selectedAnswers).length} จาก{' '}
                        {assessmentData.questions.length} ข้อ
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ตรวจทาน</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSubmit}
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
            {assessmentData.questions.map((_, index) => (
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
          {isTimeOut && (
            <div className='mb-4 flex items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-red-600'>
              <AlertCircle size={20} />
              <span className='font-medium'>หมดเวลาการทำข้อสอบ ระบบได้ส่งคำตอบให้อัตโนมัติ</span>
            </div>
          )}
          <div className='mb-6 flex justify-center'>
            <Trophy className='h-16 w-16 text-yellow-500' />
          </div>
          <CardTitle className='mb-4 text-2xl text-slate-800'>ส่งคำตอบเรียบร้อย</CardTitle>
          <div className='mb-8 text-lg font-normal text-slate-600'>
            ตอบถูกทั้งหมด <span className='font-medium text-green-600'>{correctCount}</span> ข้อ จาก{' '}
            <span className='font-medium'>{assessmentData.questions.length}</span> ข้อ
          </div>
          <div className='flex justify-center gap-4'>
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
