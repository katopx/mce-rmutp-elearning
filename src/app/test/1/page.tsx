'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Timer, ArrowLeft, ArrowRight, FileQuestion, CheckCircle2, LogOut } from 'lucide-react'
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

const mockExam = {
  title: 'การติดตั้งและบำรุงรักษา PLC Mitsubishi FX5U',
  timeLimit: 30, // ปรับเป็น 30 นาทีสำหรับ 10 ข้อ
  questions: [
    {
      id: 'q1',
      question: 'พอร์ตสื่อสารที่ติดตั้งมาให้เป็นมาตรฐาน (Built-in) บนตัว PLC FX5U คือข้อใด?',
      options: ['RS-232C', 'Ethernet และ RS-485', 'USB Type-C', 'CC-Link'],
      answer: 1,
    },
    {
      id: 'q2',
      question: 'จากภาพ อุปกรณ์ที่ระบุด้วยลูกศรสีแดงคือส่วนประกอบใดของเครื่องจักร?',
      media: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800',
      },
      options: ['เซนเซอร์ตรวจจับวัตถุ', 'มอเตอร์ขับเคลื่อน', 'ปุ่มหยุดฉุกเฉิน', 'หน้าจอ HMI'],
      answer: 0,
    },
    {
      id: 'q3',
      question: 'พิจารณาวิดีโอสาธิตการทำงาน หากต้องการหยุดการทำงานของสายพานทันทีต้องกดปุ่มใด?',
      media: {
        type: 'video',
        url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      },
      options: ['ปุ่ม Start (สีเขียว)', 'ปุ่ม Stop (สีแดง)', 'ปุ่ม Emergency Stop', 'ปุ่ม Reset'],
      answer: 2,
    },
    {
      id: 'q4',
      question: 'คำสั่ง "LD X0" ในโปรแกรม GX Works3 หมายถึงอะไร?',
      options: [
        'การสั่ง Output Y0 ทำงาน',
        'การตรวจสอบสถานะ Input X0 (ปกติเปิด)',
        'การลบโปรแกรมในหน่วยความจำ',
        'การตั้งค่าเวลาของ Timer',
      ],
      answer: 1,
    },
    {
      id: 'q5',
      question: 'ซอฟต์แวร์ที่ใช้ในการเขียนโปรแกรมและตั้งค่า PLC ตระกูล iQ-F (FX5U) คือข้อใด?',
      options: ['GX Developer', 'GX Works2', 'GX Works3', 'GT Designer3'],
      answer: 2,
    },
    {
      id: 'q6',
      question:
        'แรงดันไฟเลี้ยงมาตรฐาน (Power Supply) สำหรับ PLC FX5U รุ่นที่เป็น AC Type คือเท่าใด?',
      options: ['12V DC', '24V DC', '100-240V AC', '380V AC'],
      answer: 2,
    },
    {
      id: 'q7',
      question: 'สัญลักษณ์ "-( )-" ใน Ladder Diagram แทนอุปกรณ์ประเภทใด?',
      media: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
      },
      options: ['Input Contact', 'Internal Relay', 'Output Coil', 'Timer Block'],
      answer: 2,
    },
    {
      id: 'q8',
      question: 'การบำรุงรักษา PLC ในเบื้องต้น ข้อใดสำคัญที่สุด?',
      options: [
        'การทำความสะอาดฝุ่นและตรวจเช็คการระบายความร้อน',
        'การเปลี่ยนสายไฟทุกเดือน',
        'การอัปเดตเฟิร์มแวร์ทุกสัปดาห์',
        'การฉีดน้ำยาหล่อลื่นลงบนตัวเครื่อง',
      ],
      answer: 0,
    },
    {
      id: 'q9',
      question: 'หากต้องการขยายจำนวน Input/Output ให้กับ PLC FX5U ต้องใช้อุปกรณ์ใด?',
      options: ['Extension Module', 'Battery Back-up', 'SD Memory Card', 'Communication Adapter'],
      answer: 0,
    },
    {
      id: 'q10',
      question: 'สถานะไฟ LED "ERROR" กะพริบเป็นสีแดงที่ตัว PLC หมายถึงข้อใด?',
      options: [
        'เครื่องทำงานปกติ',
        'มีการส่งข้อมูลทาง Ethernet',
        'เกิดข้อผิดพลาดในโปรแกรมหรือฮาร์ดแวร์',
        'หน่วยความจำเต็ม',
      ],
      answer: 2,
    },
  ],
}

export default function ExamPage() {
  const router = useRouter()
  const params = useParams()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [isFinished, setIsFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(mockExam.timeLimit * 60)

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsFinished(true)
      return
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isAnswered = (index: number) => selectedAnswers.hasOwnProperty(index)

  if (isFinished) {
    const score = mockExam.questions.reduce((acc, q, idx) => {
      return selectedAnswers[idx] === q.answer ? acc + 1 : acc
    }, 0)

    return (
      <div className='flex min-h-[80vh] items-center justify-center p-4'>
        <Card className='w-full max-w-sm border-none p-6 text-center shadow-lg'>
          <div className='mb-3 flex justify-center text-green-500'>
            <CheckCircle2 size={48} />
          </div>
          <h2 className='mb-1 text-xl font-semibold text-slate-800'>ส่งข้อสอบเรียบร้อย</h2>
          <div className='my-4 rounded-xl border border-slate-100 bg-slate-50 py-4'>
            <div className='text-xs font-medium text-slate-400 uppercase'>คะแนนของคุณ</div>
            <div className='text-3xl font-bold text-blue-600'>
              {score} / {mockExam.questions.length}
            </div>
          </div>
          <Button
            className='w-full font-medium'
            onClick={() => router.push(`/courses/${params.slug}/classroom`)}
          >
            กลับสู่ห้องเรียน
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-slate-50/50'>
      <main className='mx-auto w-full max-w-3xl px-4 py-6'>
        {/* Navigation Top Bar */}
        <div className='mb-4 flex items-center justify-between'>
          <Button
            variant='ghost'
            size='sm'
            className='text-slate-500 hover:text-red-600'
            onClick={() => router.push(`/courses/${params.slug}/classroom`)}
          >
            <LogOut className='mr-2 size-4' /> ออกจากห้องสอบ
          </Button>

          <div className='flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 shadow-sm'>
            <Timer className={`size-4 ${timeLeft < 300 ? 'text-red-500' : 'text-slate-400'}`} />
            <span
              className={`font-mono text-sm font-semibold ${timeLeft < 300 ? 'text-red-600' : 'text-slate-700'}`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Exam Info */}
        <div className='mb-6'>
          <div className='mb-1 flex items-center gap-2'>
            <span className='rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700'>
              แบบทดสอบ
            </span>
          </div>
          <h1 className='text-lg font-semibold text-slate-800'>{mockExam.title}</h1>
        </div>

        {/* Question Card */}
        <Card className='mb-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm'>
          <CardHeader className='border-b border-slate-50 bg-white px-6 py-5'>
            <div className='mb-2 flex items-center gap-2 text-slate-400'>
              <FileQuestion size={14} />
              <span className='text-xs font-medium tracking-wider uppercase'>
                ข้อ {currentQuestion + 1} จาก {mockExam.questions.length}
              </span>
            </div>
            <CardTitle className='text-base leading-normal font-semibold text-slate-800'>
              {mockExam.questions[currentQuestion].question}
            </CardTitle>
          </CardHeader>

          <CardContent className='p-6'>
            {mockExam.questions[currentQuestion].media && (
              <div className='mb-6 overflow-hidden rounded-lg border border-slate-100'>
                {mockExam.questions[currentQuestion].media.type === 'image' ? (
                  <img
                    src={mockExam.questions[currentQuestion].media.url}
                    className='mx-auto max-h-64 object-contain'
                  />
                ) : (
                  <video
                    src={mockExam.questions[currentQuestion].media.url}
                    controls
                    className='max-h-64 w-full'
                  />
                )}
              </div>
            )}

            <RadioGroup
              value={selectedAnswers[currentQuestion]?.toString()}
              onValueChange={(val) =>
                setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: parseInt(val) })
              }
              className='grid gap-2'
            >
              {mockExam.questions[currentQuestion].options.map((opt, i) => (
                <Label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    selectedAnswers[currentQuestion] === i
                      ? 'border-blue-500 bg-blue-50/30'
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <RadioGroupItem value={i.toString()} className='sr-only' />
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                      selectedAnswers[currentQuestion] === i
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className='text-sm font-normal text-slate-700'>{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <div className='flex items-center justify-between'>
          <Button
            variant='outline'
            size='sm'
            disabled={currentQuestion === 0}
            onClick={() => setCurrentQuestion((prev) => prev - 1)}
            className='text-xs font-medium'
          >
            <ArrowLeft className='mr-1 size-3' /> ก่อนหน้า
          </Button>

          <div className='flex gap-2'>
            {currentQuestion === mockExam.questions.length - 1 ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size='sm' className='bg-green-600 text-xs font-medium hover:bg-green-700'>
                    ส่งคำตอบ
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className='rounded-xl'>
                  <AlertDialogHeader>
                    <AlertDialogTitle className='text-base font-semibold'>
                      ยืนยันการส่งข้อสอบ?
                    </AlertDialogTitle>
                    <AlertDialogDescription className='text-sm'>
                      คุณตอบไปแล้ว {Object.keys(selectedAnswers).length} จาก{' '}
                      {mockExam.questions.length} ข้อ
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className='text-xs'>กลับไปตรวจทาน</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => setIsFinished(true)}
                      className='bg-green-600 text-xs'
                    >
                      ยืนยัน
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                size='sm'
                onClick={() => setCurrentQuestion((prev) => prev + 1)}
                className='text-xs font-medium'
              >
                ถัดไป <ArrowRight className='ml-1 size-3' />
              </Button>
            )}
          </div>
        </div>

        {/* Compact Navigator */}
        <div className='mt-8 flex flex-wrap justify-center gap-1.5'>
          {mockExam.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`size-7 rounded text-[10px] font-medium transition-all ${
                currentQuestion === index
                  ? 'bg-slate-800 text-white'
                  : isAnswered(index)
                    ? 'border border-blue-100 bg-blue-50 text-blue-600'
                    : 'border border-slate-100 bg-white text-slate-400'
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
