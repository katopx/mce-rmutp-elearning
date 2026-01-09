'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Plus, Trash2, CheckCircle2, Circle, ListChecks, AlignLeft, Sparkles } from 'lucide-react'
import TextEditor from '@/components/features/text-editor'

interface ExerciseManagerProps {
  questions: any[]
  onChange: (updatedQuestions: any[]) => void
}

export default function ExerciseManager({ questions = [], onChange }: ExerciseManagerProps) {
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
    onChange([...questions, newQuestion])
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    onChange(newQuestions)
  }

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index))
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

  return (
    <div className='space-y-6'>
      {/* --- Toolbar: กะทัดรัดขึ้น --- */}
      <div className='sticky top-0 z-10 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm'>
        <Button
          onClick={() => addQuestion('single')}
          variant='outline-muted'
          size='sm'
          className='gap-2 font-normal text-black'
        >
          <Plus className='size-3.5' /> คำตอบเดียว
        </Button>
        <Button
          onClick={() => addQuestion('multiple')}
          variant='outline-muted'
          size='sm'
          className='gap-2 font-normal text-black'
        >
          <Plus className='size-3.5' /> หลายคำตอบ
        </Button>
        <Button
          onClick={() => addQuestion('text')}
          variant='outline-muted'
          size='sm'
          className='gap-2 font-normal text-black'
        >
          <Plus className='size-3.5' /> เติมคำ/อธิบาย
        </Button>
      </div>

      {/* --- รายการโจทย์ --- */}
      <div className='space-y-6'>
        {questions.length === 0 && (
          <div className='rounded-xl border-2 border-dashed py-12 text-center text-sm text-slate-400'>
            เลือกประเภทโจทย์ด้านบนเพื่อเริ่มสร้าง
          </div>
        )}

        {questions.map((q, qIndex) => (
          <div
            key={q._key}
            className='animate-in fade-in slide-in-from-bottom-2 relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm'
          >
            <div className='mb-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='text-md rounded-md border-slate-200 font-normal text-black'
                >
                  ข้อที่ {qIndex + 1}
                </Badge>
                <span className='text-xs font-normal tracking-wider text-slate-400 uppercase'>
                  {q.questionType === 'single' && 'คำตอบเดียว'}
                  {q.questionType === 'multiple' && 'หลายคำตอบ'}
                  {q.questionType === 'text' && 'เติมคำ/อธิบาย'}
                </span>
              </div>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => removeQuestion(qIndex)}
                className='h-8 w-8 text-slate-300 hover:text-red-600'
              >
                <Trash2 className='size-4' />
              </Button>
            </div>

            {/* --- โจทย์คำถาม --- */}
            <div className='mb-6 space-y-2'>
              <Label className='text-sm font-normal'>โจทย์คำถาม</Label>
              <TextEditor
                content={q.content}
                onChange={(newContent) => updateQuestion(qIndex, 'content', newContent)}
                placeholder='พิมพ์คำถาม...'
                height={300}
              />
            </div>

            {/* --- ส่วนคำตอบ --- */}
            <div className='mb-6 rounded-lg border border-slate-50 bg-slate-50/30 p-4'>
              {q.questionType !== 'text' ? (
                <div className='space-y-3'>
                  <Label className='text-xs font-normal tracking-tight'>ตัวเลือกคำตอบ</Label>
                  <div className='grid gap-2'>
                    {q.choices.map((choice: any, cIndex: number) => (
                      <div key={choice._key} className='group flex items-center gap-3'>
                        <button
                          type='button'
                          onClick={() => toggleCorrect(qIndex, cIndex)}
                          className={cn(
                            'flex-shrink-0 cursor-pointer transition-all duration-200 active:scale-90',
                            choice.isCorrect
                              ? 'text-green-500 hover:text-green-600'
                              : 'text-slate-300 hover:text-slate-400',
                          )}
                        >
                          <CheckCircle2
                            className={cn(
                              'size-6 transition-all',
                              choice.isCorrect ? 'fill-white' : 'fill-transparent',
                            )}
                            strokeWidth={choice.isCorrect ? 2.5 : 2}
                          />
                        </button>
                        <div className='flex flex-grow items-center rounded-lg border border-slate-200 bg-white px-3 py-0.5 transition-colors focus-within:border-blue-400'>
                          <span className='mr-2 text-xs font-medium text-slate-400'>
                            {String.fromCharCode(3585 + cIndex)}.
                          </span>
                          <Input
                            value={choice.choiceText}
                            onChange={(e) => {
                              const newChoices = [...q.choices]
                              newChoices[cIndex].choiceText = e.target.value
                              updateQuestion(qIndex, 'choices', newChoices)
                            }}
                            className='h-8 border-0 bg-transparent text-sm shadow-none focus-visible:ring-0'
                            placeholder='ข้อความตัวเลือก...'
                          />
                        </div>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => {
                            const newChoices = q.choices.filter((_: any, i: number) => i !== cIndex)
                            updateQuestion(qIndex, 'choices', newChoices)
                          }}
                          className='h-7 w-7 text-slate-200 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500'
                        >
                          <Trash2 className='size-3.5' />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => addChoice(qIndex)}
                    className='mt-1 w-full border border-dashed border-slate-200 text-sm text-slate-400 hover:text-blue-600'
                  >
                    <Plus className='mr-1 size-3' /> เพิ่มตัวเลือก
                  </Button>
                </div>
              ) : (
                <div className='space-y-2'>
                  <Label className='text-xs font-medium text-slate-600'>แนวทางคำตอบ</Label>
                  <Input
                    value={q.correctAnswerText}
                    onChange={(e) => updateQuestion(qIndex, 'correctAnswerText', e.target.value)}
                    placeholder='พิมพ์คำตอบที่ถูกต้อง...'
                    className='h-9 text-sm'
                  />
                </div>
              )}
            </div>

            {/* --- เฉลย --- */}
            <div className='space-y-2 pt-2'>
              <Label className='flex items-center gap-1.5 text-sm font-normal'>
                <Sparkles className='size-3.5 text-blue-500' /> เฉลยและคำอธิบาย
              </Label>
              <TextEditor
                content={q.explanation}
                onChange={(newExplanation) => updateQuestion(qIndex, 'explanation', newExplanation)}
                placeholder='อธิบายคำตอบ...'
                height={200}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
