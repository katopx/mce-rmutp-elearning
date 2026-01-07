'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, RefreshCcw, ArrowRight, ArrowLeft } from 'lucide-react'

interface QuizPlayerProps {
  quizData: any
  onComplete?: (score: number) => void
}

export default function QuizPlayer({ quizData, onComplete }: QuizPlayerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [showResult, setShowResult] = useState(false)

  const questions = quizData?.questions || []
  const totalQuestions = questions.length
  const currentQ = questions[currentQuestion]

  if (totalQuestions === 0) return <div className='p-10 text-center'>ไม่พบข้อสอบ</div>

  const handleSelect = (idx: number) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: idx })
  }

  const handleSubmit = () => {
    let score = 0
    questions.forEach((q: any, index: number) => {
      const selectedIdx = selectedAnswers[index]
      if (q.choices?.[selectedIdx]?.isCorrect) score++
    })
    setShowResult(true)
    if (onComplete) onComplete(score)
  }

  if (showResult) {
    return (
      <QuizResult
        questions={questions}
        selectedAnswers={selectedAnswers}
        onReset={() => {
          setCurrentQuestion(0)
          setSelectedAnswers({})
          setShowResult(false)
        }}
      />
    )
  }

  return (
    <div className='animate-in fade-in mx-auto max-w-3xl space-y-8 duration-500'>
      <div className='space-y-4'>
        <div className='flex items-center justify-between text-sm font-medium'>
          <span className='text-slate-500'>
            ข้อที่ {currentQuestion + 1} จาก {totalQuestions}
          </span>
          <span className='text-primary font-bold'>
            {Math.round(((currentQuestion + 1) / totalQuestions) * 100)}%
          </span>
        </div>
        <Progress value={((currentQuestion + 1) / totalQuestions) * 100} className='h-2' />
      </div>

      <Card className='border-slate-100 p-8 shadow-sm'>
        {/* 🚀 การแสดงโจทย์ */}
        <div className='mb-8 text-xl leading-relaxed font-medium text-slate-800'>
          {/* ถ้าเนื้อหาเป็นข้อความธรรมดา */}
          {typeof currentQ?.content === 'string' ? (
            <div dangerouslySetInnerHTML={{ __html: currentQ.content }} />
          ) : (
            /* ถ้าเป็น Portable Text และไม่ได้ใช้ library แนะนำให้ดึงเฉพาะข้อความมาโชว์ก่อน */
            <p>{currentQ?.content?.[0]?.children?.[0]?.text || 'ไม่มีเนื้อหาโจทย์'}</p>
          )}
        </div>

        <div className='grid gap-4'>
          {currentQ?.choices?.map((choice: any, index: number) => (
            <button
              key={choice._key || index}
              onClick={() => handleSelect(index)}
              className={`flex items-center justify-between rounded-2xl border-2 p-5 text-left transition-all ${
                selectedAnswers[currentQuestion] === index
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-100 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className='text-base font-medium'>{choice.choiceText}</span>
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-primary bg-primary'
                    : 'border-slate-200'
                }`}
              >
                {selectedAnswers[currentQuestion] === index && (
                  <div className='h-2 w-2 rounded-full bg-white' />
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className='flex items-center justify-between'>
        <Button
          variant='ghost'
          onClick={() => setCurrentQuestion((v) => v - 1)}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className='mr-2' size={18} /> ข้อก่อนหน้า
        </Button>

        {currentQuestion + 1 < totalQuestions ? (
          <Button
            onClick={() => setCurrentQuestion((v) => v + 1)}
            disabled={selectedAnswers[currentQuestion] === undefined}
          >
            ข้อถัดไป <ArrowRight className='ml-2' size={18} />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length < totalQuestions}
            className='bg-green-600 hover:bg-green-700'
          >
            ส่งคำตอบ
          </Button>
        )}
      </div>
    </div>
  )
}

function QuizResult({ questions, selectedAnswers, onReset }: any) {
  const score = questions.reduce(
    (acc: number, q: any, i: number) =>
      q.choices?.[selectedAnswers[i]]?.isCorrect ? acc + 1 : acc,
    0,
  )

  return (
    <div className='space-y-6 py-12 text-center'>
      <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600'>
        <CheckCircle2 size={40} />
      </div>
      <h2 className='text-3xl font-bold'>ทำแบบทดสอบเรียบร้อย!</h2>
      <p className='text-lg text-slate-500'>
        คุณได้คะแนน {score} จาก {questions.length} ข้อ
      </p>
      <Button variant='outline' onClick={onReset} className='gap-2'>
        <RefreshCcw size={16} /> ทำใหม่อีกครั้ง
      </Button>
    </div>
  )
}
