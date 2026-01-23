'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Minimize2,
  Maximize2,
} from 'lucide-react'
import TextEditor from '@/components/features/text-editor'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ExerciseManagerProps {
  questions: any[]
  onChange: (updatedQuestions: any[]) => void
  isReadOnly?: boolean
}

const THAI_CHOICES = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ']

export default function ExerciseManager({
  questions = [],
  onChange,
  isReadOnly = false,
}: ExerciseManagerProps) {
  // State สำหรับจัดการการย่อ/ขยาย ของแต่ละข้อ (เก็บเป็น array ของ index ที่ "เปิด" อยู่)
  // เริ่มต้นให้เปิดเฉพาะข้อสุดท้ายที่เพิ่งเพิ่ม (ถ้ามี) หรือเปิดหมดถ้าข้อไม่เยอะ
  const [openItems, setOpenItems] = useState<number[]>(questions.length > 0 ? [0] : [])

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    )
  }

  const expandAll = () => setOpenItems(questions.map((_, i) => i))
  const collapseAll = () => setOpenItems([])

  const addQuestion = (type: 'single' | 'multiple' | 'text') => {
    const newQuestion = {
      _key: crypto.randomUUID(),
      questionType: type,
      content: '',
      explanation: '',
      choices:
        type !== 'text'
          ? [
              { _key: crypto.randomUUID(), choiceText: 'ตัวเลือกที่ 1', isCorrect: true },
              { _key: crypto.randomUUID(), choiceText: 'ตัวเลือกที่ 2', isCorrect: false },
            ]
          : [],
      correctAnswerText: '',
    }
    const newIndex = questions.length
    onChange([...questions, newQuestion])
    // Auto expand the new question
    setOpenItems((prev) => [...prev, newIndex])

    // Scroll to bottom logic could be added here
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    onChange(newQuestions)
  }

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index))
    // Remove from openItems to prevent index mismatch
    setOpenItems((prev) => prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)))
  }

  const addChoice = (qIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].choices.push({
      _key: crypto.randomUUID(),
      choiceText: '',
      isCorrect: false,
    })
    onChange(newQuestions)
  }

  const toggleCorrect = (qIndex: number, cIndex: number) => {
    const newQuestions = [...questions]
    const q = newQuestions[qIndex]

    if (q.questionType === 'single') {
      q.choices = q.choices.map((c: any, i: number) => ({ ...c, isCorrect: i === cIndex }))
    } else {
      q.choices[cIndex].isCorrect = !q.choices[cIndex].isCorrect
    }
    onChange(newQuestions)
  }

  // Helper to extract plain text from HTML content for preview
  const getPreviewText = (htmlContent: string) => {
    if (!htmlContent) return 'ยังไม่ได้ระบุคำถาม...'
    const tmp = document.createElement('DIV')
    tmp.innerHTML = htmlContent
    const text = tmp.textContent || tmp.innerText || ''
    return text.length > 50 ? text.substring(0, 50) + '...' : text
  }

  return (
    <div className='space-y-6 pb-20'>
      {/* --- Toolbar: Sticky & Responsive --- */}
      <div className='sticky top-[64px] z-20 flex flex-col flex-wrap items-start gap-2 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur transition-all supports-[backdrop-filter]:bg-white/60 sm:flex-row sm:items-center'>
        <div className='no-scrollbar flex w-full gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0'>
          <Button
            onClick={() => addQuestion('single')}
            variant='outline'
            size='sm'
            className='gap-2 font-medium whitespace-nowrap text-slate-700'
          >
            <Plus className='size-3.5' /> คำตอบเดียว
          </Button>
          <Button
            onClick={() => addQuestion('multiple')}
            variant='outline'
            size='sm'
            className='gap-2 font-medium whitespace-nowrap text-slate-700'
          >
            <Plus className='size-3.5' /> หลายคำตอบ
          </Button>
          <Button
            onClick={() => addQuestion('text')}
            variant='outline'
            size='sm'
            className='gap-2 font-medium whitespace-nowrap text-slate-700'
          >
            <Plus className='size-3.5' /> เติมคำ
          </Button>
        </div>

        <div className='ml-auto flex gap-1 border-l pl-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={expandAll}
            title='ขยายทั้งหมด'
            className='text-slate-500 hover:text-blue-600'
          >
            <Maximize2 className='size-4' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={collapseAll}
            title='ย่อทั้งหมด'
            className='text-slate-500 hover:text-blue-600'
          >
            <Minimize2 className='size-4' />
          </Button>
        </div>
      </div>

      {/* --- รายการโจทย์ --- */}
      <div className='space-y-4'>
        {questions.length === 0 && (
          <div className='flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center text-sm text-slate-400'>
            <div className='mb-3 rounded-full bg-white p-3 shadow-sm'>
              <Plus className='size-6 text-slate-300' />
            </div>
            <p>ยังไม่มีข้อคำถาม</p>
            <p className='mt-1 text-xs opacity-70'>เลือกประเภทโจทย์ด้านบนเพื่อเริ่มสร้างแบบทดสอบ</p>
          </div>
        )}

        {questions.map((q, qIndex) => {
          const isOpen = openItems.includes(qIndex)

          return (
            <Collapsible
              key={q._key}
              open={isOpen}
              onOpenChange={() => toggleItem(qIndex)}
              className={cn(
                'group relative rounded-xl border bg-white transition-all duration-200',
                isOpen
                  ? 'border-blue-200 shadow-md ring-1 ring-blue-50'
                  : 'border-slate-200 shadow-sm hover:border-blue-200',
              )}
            >
              {/* Header ส่วนหัวของแต่ละข้อ (แสดงตลอดเวลา) */}
              <div
                className={cn(
                  'flex cursor-pointer items-center justify-between p-3 select-none sm:p-4',
                  isOpen ? 'border-b border-slate-100' : '',
                )}
                onClick={() => toggleItem(qIndex)}
              >
                <div className='flex items-center gap-3 overflow-hidden'>
                  {/* Drag Handle (Visual only for now) */}
                  <GripVertical className='hidden size-4 cursor-grab text-slate-300 active:cursor-grabbing sm:block' />

                  <Badge
                    variant={isOpen ? 'default' : 'outline'}
                    className={cn(
                      'flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-md px-1.5 text-sm transition-colors',
                      isOpen
                        ? 'border-transparent bg-blue-600 text-white hover:bg-blue-700'
                        : 'border-slate-200 font-medium text-slate-500',
                    )}
                  >
                    {qIndex + 1}
                  </Badge>

                  <div className='flex min-w-0 flex-col'>
                    <div className='flex items-center gap-2'>
                      <span className='rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400'>
                        {q.questionType === 'single' && 'คำตอบเดียว'}
                        {q.questionType === 'multiple' && 'คำตอบหลายข้อ'}
                        {q.questionType === 'text' && 'เติมคำ'}
                      </span>
                    </div>
                    {/* Preview Content when collapsed */}
                    {!isOpen && (
                      <p className='mt-0.5 truncate text-sm font-medium text-slate-600'>
                        {q.content ? (
                          <span
                            dangerouslySetInnerHTML={{ __html: q.content.replace(/<[^>]+>/g, '') }}
                          />
                        ) : (
                          <span className='text-slate-300 italic'>ไม่ได้ระบุคำถาม...</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className='ml-2 flex shrink-0 items-center gap-1'>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    >
                      {isOpen ? (
                        <ChevronUp className='size-4' />
                      ) : (
                        <ChevronDown className='size-4' />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={(e) => {
                      e.stopPropagation()
                      removeQuestion(qIndex)
                    }}
                    className='h-8 w-8 rounded-full text-slate-300 hover:bg-red-50 hover:text-red-600'
                    title='ลบข้อนี้'
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </div>
              </div>

              {/* Content ส่วนเนื้อหา (แสดงเมื่อเปิด) */}
              <CollapsibleContent className='animate-in slide-in-from-top-2 fade-in duration-200'>
                <div className='p-4 pt-2 sm:p-5'>
                  {/* --- โจทย์คำถาม --- */}
                  <div className='mb-6 space-y-2'>
                    <Label className='text-sm font-medium text-slate-700'>โจทย์คำถาม</Label>
                    <div className='rounded-md bg-slate-50/50'>
                      <TextEditor
                        content={q.content}
                        onChange={(newContent) => updateQuestion(qIndex, 'content', newContent)}
                        placeholder='พิมพ์คำถาม...'
                        height={200}
                        readOnly={isReadOnly}
                      />
                    </div>
                  </div>

                  {/* --- ส่วนคำตอบ --- */}
                  <div className='mb-6 rounded-xl border border-slate-100 bg-slate-50/50 p-4'>
                    {q.questionType !== 'text' ? (
                      <div className='space-y-3'>
                        <div className='flex items-center justify-between'>
                          <Label className='text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                            ตัวเลือกคำตอบ
                          </Label>
                          <span className='text-[10px] text-slate-400'>
                            {q.questionType === 'single'
                              ? '(เลือกข้อถูกได้ 1 ข้อ)'
                              : '(เลือกข้อถูกได้หลายข้อ)'}
                          </span>
                        </div>
                        <div className='grid gap-2.5'>
                          {q.choices.map((choice: any, cIndex: number) => (
                            <div
                              key={choice._key}
                              className='group relative flex items-center gap-2'
                            >
                              {/* Radio/Checkbox Indicator */}
                              <button
                                type='button'
                                onClick={() => toggleCorrect(qIndex, cIndex)}
                                className={cn(
                                  'flex-shrink-0 cursor-pointer rounded-full p-1 transition-all duration-200 active:scale-95',
                                  choice.isCorrect
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-white text-slate-300 hover:bg-slate-100',
                                )}
                                title={
                                  choice.isCorrect
                                    ? 'เป็นคำตอบที่ถูก'
                                    : 'คลิกเพื่อตั้งเป็นคำตอบที่ถูก'
                                }
                              >
                                <CheckCircle2
                                  className={cn(
                                    'size-5 transition-all sm:size-6',
                                    choice.isCorrect
                                      ? 'fill-green-600 text-white'
                                      : 'fill-transparent',
                                  )}
                                  strokeWidth={choice.isCorrect ? 3 : 2}
                                />
                              </button>

                              {/* Input Field */}
                              <div
                                className={cn(
                                  'flex flex-grow items-center rounded-lg border bg-white px-3 py-1 transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100',
                                  choice.isCorrect
                                    ? 'border-green-200 shadow-sm'
                                    : 'border-slate-200',
                                )}
                              >
                                <span
                                  className={cn(
                                    'mr-3 w-4 text-sm font-normal',
                                    choice.isCorrect ? 'text-green-600' : 'text-foreground',
                                  )}
                                >
                                  {THAI_CHOICES[cIndex] || String.fromCharCode(65 + cIndex)}.
                                </span>
                                <Input
                                  value={choice.choiceText}
                                  onChange={(e) => {
                                    const newChoices = [...q.choices]
                                    newChoices[cIndex].choiceText = e.target.value
                                    updateQuestion(qIndex, 'choices', newChoices)
                                  }}
                                  className='h-9 border-0 bg-transparent p-0 text-sm shadow-none placeholder:text-slate-300 focus-visible:ring-0'
                                  placeholder={`ตัวเลือก ${cIndex + 1}`}
                                />
                              </div>

                              {/* Delete Choice Button */}
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => {
                                  const newChoices = q.choices.filter(
                                    (_: any, i: number) => i !== cIndex,
                                  )
                                  updateQuestion(qIndex, 'choices', newChoices)
                                }}
                                className='h-8 w-8 rounded-full text-slate-300 opacity-100 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 sm:opacity-0'
                              >
                                <Trash2 className='size-4' />
                              </Button>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => addChoice(qIndex)}
                          className='mt-2 w-full border-dashed border-slate-300 text-slate-500 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600'
                        >
                          <Plus className='mr-1.5 size-3.5' /> เพิ่มตัวเลือก
                        </Button>
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        <Label className='text-xs font-semibold tracking-wider text-slate-500 uppercase'>
                          แนวทางคำตอบ (Keyword)
                        </Label>
                        <Input
                          value={q.correctAnswerText}
                          onChange={(e) =>
                            updateQuestion(qIndex, 'correctAnswerText', e.target.value)
                          }
                          placeholder='เช่น คำตอบที่ 1, คำตอบที่ 2'
                          className='bg-white'
                        />
                        <p className='text-[10px] text-slate-400'>
                          * ใช้เครื่องหมายจุลภาค (,) คั่นหากมีหลายคำตอบที่เป็นไปได้
                        </p>
                      </div>
                    )}
                  </div>

                  {/* --- เฉลย --- */}
                  <div className='space-y-2'>
                    <Label className='flex items-center gap-1.5 text-sm font-medium text-slate-700'>
                      <Sparkles className='size-3.5 text-purple-500' /> เฉลยและคำอธิบายเพิ่มเติม
                    </Label>
                    <div className='rounded-md border border-purple-100 bg-purple-50/30'>
                      <TextEditor
                        content={q.explanation}
                        onChange={(newExplanation) =>
                          updateQuestion(qIndex, 'explanation', newExplanation)
                        }
                        placeholder='อธิบายเหตุผลของคำตอบ...'
                        height={150}
                        readOnly={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
