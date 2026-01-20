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
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  FileQuestion,
  LogOut,
  Timer,
  Trophy,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'

// Auth & Firebase
import { useAuth } from '@/contexts/auth-context'
import { saveExamResult } from '@/lib/firebase/services'

interface AssessmentClientProps {
  exam: any
  courseId: string
  courseSlug: string
  mode: 'pre_test' | 'post_test'
}

const thaiLabels = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช']

export default function AssessmentClient({
  exam,
  courseId,
  courseSlug,
  mode,
}: AssessmentClientProps) {
  const { user } = useAuth()
  const router = useRouter()

  // --- States ---
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({}) // { questionKey: choiceKey }
  const [isFinished, setIsFinished] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultData, setResultData] = useState<any>(null)

  // Timer State
  const timeLimitMinutes = exam.timeLimit || 0
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // เตรียมคำถาม
  const questions = useMemo(() => {
    let qs = [...(exam.questions || [])]
    if (exam.shuffleQuestions) {
      qs = qs.sort(() => Math.random() - 0.5)
    }
    return qs
  }, [exam])

  const totalQuestions = questions.length
  const currentQuestion = questions[currentQIndex]
  const isAnswered = (index: number) => {
    const qKey = questions[index]?._key
    return !!answers[qKey]
  }

  // --- Logic 1: Timer ---
  useEffect(() => {
    if (timeLimitMinutes > 0 && !isFinished && timeLeft === null) {
      setTimeLeft(timeLimitMinutes * 60)
    }
  }, [timeLimitMinutes, isFinished, timeLeft])

  useEffect(() => {
    if (timeLeft === null || isFinished) return

    if (timeLeft <= 0) {
      handleTimeOut()
      return
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isFinished])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // --- Logic 2: Actions ---
  const handleSelectAnswer = (choiceKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._key]: choiceKey,
    }))
  }

  const handleTimeOut = () => {
    toast.error('หมดเวลา! ระบบส่งคำตอบอัตโนมัติ')
    handleSubmit()
  }

  const handleExit = () => {
    if (confirm('คุณต้องการออกจากห้องสอบ? ข้อมูลจะไม่ถูกบันทึก')) {
      router.replace(`/courses/${courseSlug}/classroom`)
    }
  }

  // --- Logic 3: Submit ---
  const handleSubmit = useCallback(async () => {
    if (!user || isSubmitting || isFinished) return
    setIsSubmitting(true)

    try {
      const totalTimeLimitInSeconds = (timeLimitMinutes || 0) * 60
      const timeTaken = timeLeft !== null ? totalTimeLimitInSeconds - timeLeft : 0

      let rawScore = 0
      const detailedAnswers = questions.map((q: any) => {
        const userAnswerKey = answers[q._key]
        const correctChoice = q.choices?.find((c: any) => c.isCorrect)
        const isCorrect = userAnswerKey === correctChoice?._key
        if (isCorrect) rawScore++
        return {
          questionId: q._key,
          isCorrect: isCorrect,
          selectedChoiceId: userAnswerKey || null,
        }
      })

      const percentage = (rawScore / totalQuestions) * 100
      const isPassed = percentage >= (exam.passingScore || 60)

      await saveExamResult(user.uid, courseId, {
        examId: exam._id,
        type: mode,
        score: rawScore,
        totalScore: totalQuestions,
        isPassed: isPassed,
        timeTaken: timeTaken,
        answers: detailedAnswers,
      })

      setResultData({
        score: rawScore,
        total: totalQuestions,
        percent: percentage,
        isPassed: isPassed,
      })
      setIsFinished(true)

      if (mode === 'post_test' && isPassed) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
      }
    } catch (error) {
      console.error(error)
      toast.error('เกิดข้อผิดพลาดในการส่งคำตอบ')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    user,
    answers,
    questions,
    exam,
    mode,
    courseId,
    isSubmitting,
    isFinished,
    timeLeft,
    timeLimitMinutes,
    totalQuestions,
  ])

  // ================= RENDER =================

  // 1. Result Screen
  // ================= RENDER: RESULT SCREEN (สอบเสร็จแล้ว) =================
  if (isFinished && resultData) {
    const isPreTest = mode === 'pre_test'
    const isPass = resultData.isPassed

    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-50 p-4'>
        <Card className='w-full max-w-md space-y-6 p-8 text-center shadow-xl'>
          {/* Icon Header */}
          <div className='flex justify-center'>
            {isPreTest ? (
              <div className='flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600'>
                <CheckCircle size={40} />
              </div>
            ) : isPass ? (
              <div className='flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-green-100 text-green-600'>
                <CheckCircle size={40} />
              </div>
            ) : (
              <div className='flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600'>
                <XCircle size={40} />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <h1 className='text-2xl font-bold text-slate-800'>
              {isPreTest ? 'บันทึกผลสอบก่อนเรียนแล้ว' : isPass ? 'สอบผ่าน!' : 'สอบไม่ผ่าน'}
            </h1>
            <p className='mt-2 text-slate-500'>
              {isPreTest
                ? 'คุณสามารถเข้าสู่บทเรียนได้แล้ว'
                : isPass
                  ? 'ยินดีด้วย คุณผ่านเกณฑ์การประเมินแล้ว'
                  : 'เสียใจด้วย คะแนนของคุณยังไม่ถึงเกณฑ์'}
            </p>
          </div>

          {/* Score Card */}
          <div className='rounded-xl border border-slate-100 bg-slate-50 p-6'>
            <div className='mb-1 text-sm tracking-wider text-slate-400 uppercase'>คะแนนของคุณ</div>
            <div className='text-4xl font-black text-slate-800'>
              {resultData.score}{' '}
              <span className='text-lg font-medium text-slate-400'>/ {resultData.total}</span>
            </div>
            <div className='mt-2 text-sm font-medium'>
              คิดเป็น {resultData.percent.toFixed(0)}%
              {!isPreTest && (
                <span className='text-slate-400'> (เกณฑ์ผ่าน {exam.passingScore}%)</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className='space-y-3'>
            <Button
              className='h-12 w-full text-lg'
              onClick={() => router.replace(`/courses/${courseSlug}/classroom`)}
            >
              กลับเข้าสู่ห้องเรียน <ArrowRight className='ml-2' />
            </Button>

            {/* ปุ่มสอบแก้ตัว (เฉพาะ Post-test ที่ไม่ผ่าน) */}
            {!isPreTest && !isPass && (
              <Button variant='outline' className='w-full' onClick={() => window.location.reload()}>
                ทำแบบทดสอบอีกครั้ง
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // 2. Exam Screen
  return (
    <div className='min-h-screen bg-slate-50/50 font-sans'>
      <main className='mx-auto w-full max-w-3xl px-4 py-6'>
        {/* Navigation Top Bar */}
        <div className='mb-4 flex items-center justify-between'>
          <Button
            variant='ghost'
            size='sm'
            className='px-0 text-slate-500 hover:bg-transparent hover:text-red-600'
            onClick={handleExit}
          >
            <LogOut className='mr-2 size-4' /> ออกจากห้องสอบ
          </Button>

          {timeLeft !== null && (
            <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 shadow-sm'>
              <Timer className={`size-4 ${timeLeft < 300 ? 'text-red-500' : 'text-slate-400'}`} />
              <span
                className={`font-mono text-sm font-semibold ${timeLeft < 300 ? 'text-red-600' : 'text-slate-700'}`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>

        {/* Exam Info */}
        <div className='mb-6'>
          <div className='mb-1 flex items-center gap-2'>
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${mode === 'pre_test' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}
            >
              {mode === 'pre_test' ? 'Pre-test' : 'Post-test'}
            </span>
          </div>
          <h1 className='line-clamp-1 text-lg font-semibold text-slate-800'>{exam.title}</h1>
        </div>

        {/* Question Card */}
        <Card className='mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
          <CardHeader className='border-b border-slate-50 bg-white px-6 py-5'>
            <div className='mb-2 flex items-center gap-2 text-slate-400'>
              <FileQuestion size={14} />
              <span className='text-xs font-medium tracking-wider uppercase'>
                ข้อ {currentQIndex + 1} จาก {totalQuestions}
              </span>
            </div>

            {/* HTML Question Content */}
            <CardTitle className='text-base leading-normal font-semibold text-slate-800'>
              <div
                className='prose prose-slate max-w-none'
                dangerouslySetInnerHTML={{ __html: currentQuestion.content }}
              />
            </CardTitle>
          </CardHeader>

          <CardContent className='p-6'>
            <RadioGroup
              key={currentQuestion._key}
              value={answers[currentQuestion._key] || ''}
              onValueChange={handleSelectAnswer}
              className='grid gap-2'
            >
              {currentQuestion.choices?.map((opt: any, i: number) => {
                const optionId = opt._key
                const isActive = answers[currentQuestion._key] === optionId

                return (
                  <Label
                    key={optionId}
                    htmlFor={optionId}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50/30'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <RadioGroupItem value={optionId} id={optionId} className='sr-only' />

                    {/* Circle Label (A, B, C...) */}
                    <div
                      className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                        isActive
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      {thaiLabels[i]}
                    </div>

                    <div className='flex-1'>
                      <span className='block text-sm leading-relaxed font-normal text-slate-700'>
                        {opt.choiceText}
                      </span>
                      {opt.choiceImage && (
                        <img
                          src={opt.choiceImage}
                          alt='choice'
                          className='mt-2 max-h-48 rounded-md border border-slate-100'
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
            size='sm'
            disabled={currentQIndex === 0}
            onClick={() => setCurrentQIndex((prev) => prev - 1)}
            className='border-slate-200 text-xs font-medium text-slate-600'
          >
            <ArrowLeft className='mr-1 size-3' /> ก่อนหน้า
          </Button>

          <div className='flex gap-2'>
            {currentQIndex === totalQuestions - 1 ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size='sm'
                    className='bg-green-600 text-xs font-medium hover:bg-green-700'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'กำลังส่ง...' : 'ส่งคำตอบ'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className='rounded-xl'>
                  <AlertDialogHeader>
                    <AlertDialogTitle className='text-base font-semibold'>
                      ยืนยันการส่งข้อสอบ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className='text-sm'>
                      คุณตอบไปแล้ว {Object.keys(answers).length} จาก {totalQuestions} ข้อ
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className='text-xs'>กลับไปตรวจทาน</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit} className='bg-green-600 text-xs'>
                      ยืนยัน
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                size='sm'
                onClick={() => setCurrentQIndex((prev) => prev + 1)}
                className='bg-slate-900 text-xs font-medium text-white'
              >
                ถัดไป <ArrowRight className='ml-1 size-3' />
              </Button>
            )}
          </div>
        </div>

        {/* Compact Navigator (Square Buttons) */}
        <div className='mt-8 flex flex-wrap justify-center gap-1.5'>
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQIndex(index)}
              className={`size-7 rounded text-[10px] font-medium transition-all ${
                currentQIndex === index
                  ? 'bg-slate-800 text-white'
                  : isAnswered(index)
                    ? 'border border-blue-100 bg-blue-50 text-blue-600'
                    : 'border border-slate-100 bg-white text-slate-400 hover:border-slate-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
