'use client'

import { useEffect, useState } from 'react'
import {
  Loader2,
  FileQuestion,
  Settings2,
  PlusCircle,
  GraduationCap,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Shuffle,
  Eye,
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { toast } from 'sonner'

// Sub-component
import ExerciseManager from './ExerciseManager'

// Actions
import { getExamById } from '@/lib/sanity/exam-actions'
import { createAndLinkExamAction, unlinkExamAction } from '@/lib/sanity/course-actions'
import { cn } from '@/lib/utils'

interface AssessmentManagerProps {
  courseId: string
  examId?: string | null
  pendingData?: any
  onUpdate: (data: any) => void
  onRefresh: () => Promise<void>
  isEnabled: boolean
  onToggleEnable: (checked: boolean) => void
  courseTitle?: string
}

export default function AssessmentManager({
  courseId,
  examId,
  pendingData,
  onUpdate,
  onRefresh,
  isEnabled,
  onToggleEnable,
  courseTitle,
}: AssessmentManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false) // สำหรับปุ่ม Create/Delete
  const [activeTab, setActiveTab] = useState('questions')

  // เก็บข้อมูลที่โหลดมาจาก Server (แยกจาก pendingData ที่แก้ค้างไว้)
  const [serverData, setServerData] = useState<any>(null)

  useEffect(() => {
    if (!examId) {
      setServerData(null)
      return
    }
    const loadData = async () => {
      setIsLoading(true)
      const data = await getExamById(examId)
      if (data) {
        setServerData(data)
      }
      setIsLoading(false)
    }
    loadData()
  }, [examId, pendingData === null])

  // 1. Load Data เมื่อ examId เปลี่ยน
  useEffect(() => {
    async function loadData() {
      if (!examId) {
        setServerData(null)
        return
      }
      setIsLoading(true)
      try {
        const data = await getExamById(examId)
        if (data) {
          setServerData(data)
        }
      } catch (error) {
        toast.error('ไม่สามารถโหลดข้อมูลแบบทดสอบได้')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [examId])

  // คำนวณข้อมูลที่จะแสดงผล:
  const displayData = pendingData ||
    serverData || {
      questions: [],
      timeLimit: 0,
      passingScore: 60,
      maxAttempts: 0,
      shuffleQuestions: false,
      shuffleChoices: false,
      showResultImmediate: false,
      allowReview: false,
      preventTabSwitch: false,
      preventCopyPaste: false,
    }

  // --- Handlers: Create / Delete (Direct Actions) ---

  const handleCreate = async () => {
    setIsProcessing(true)
    try {
      const examTitle = `แบบทดสอบ: ${courseTitle}`
      const res = await createAndLinkExamAction(courseId, examTitle)
      if (res.success) {
        toast.success('สร้างแบบทดสอบเรียบร้อย')
        // สำคัญ: รอ Refresh ให้เสร็จ เพื่อให้ examId ใหม่ส่งกลับมา
        await onRefresh()
      } else {
        toast.error('สร้างไม่สำเร็จ')
      }
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    setIsProcessing(true)
    try {
      const res = await unlinkExamAction(courseId)
      if (res.success) {
        toast.success('ลบแบบทดสอบเรียบร้อย')
        // เคลียร์ค่าใน Local State ทันที เพื่อให้ UI เปลี่ยนทันที
        setServerData(null)
        // แจ้ง Parent ให้เคลียร์ examId ออก
        await onRefresh()
      } else {
        toast.error('ลบไม่สำเร็จ')
      }
    } catch (e) {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setIsProcessing(false)
    }
  }

  // --- Handlers: Editing (Pass to Parent) ---

  const handleQuestionsChange = (newQuestions: any[]) => {
    const updatedData = {
      ...displayData,
      questions: newQuestions,
      title: `แบบทดสอบ: ${courseTitle}`,
    }
    const { setting, settings, _rev, ...cleanData } = updatedData
    onUpdate(cleanData)
  }

  const handleSettingsChange = (field: string, value: any) => {
    // สร้างโครงสร้างข้อมูลที่ถูกต้องตาม Schema ( exam.ts )
    const updatedData = {
      ...displayData,
      [field]: value,
      title: `แบบทดสอบ: ${courseTitle}`,
    }
    const { setting, settings, _rev, _updatedAt, _createdAt, ...cleanData } = updatedData
    onUpdate(cleanData)
  }

  // ================= RENDER =================

  // 1. Loading (เฉพาะตอนโหลดครั้งแรก หรือเปลี่ยน examId)
  if (isLoading) {
    return (
      <div className='flex h-[50vh] flex-col items-center justify-center gap-3 text-slate-400'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  // 2. Empty State (ยังไม่มี Exam) - เช็คจาก examId เป็นหลัก
  if (!examId) {
    return (
      <div className='animate-in fade-in zoom-in-95 flex h-full flex-col items-center justify-center space-y-6 rounded-xl border-2 border-dashed bg-slate-50/50 p-6 text-center duration-500 md:p-12'>
        <div className='rounded-full bg-blue-100 p-4 text-blue-600 shadow-sm md:p-6'>
          <GraduationCap className='h-10 w-10 md:h-12 md:w-12' />
        </div>
        <div className='space-y-2'>
          <h2 className='text-xl font-bold text-slate-800'>ยังไม่มีแบบทดสอบวัดผล</h2>
          <p className='mx-auto max-w-md text-sm leading-relaxed text-slate-500 md:text-base'>
            คลิกปุ่มด้านล่างเพื่อสร้างชุดข้อสอบสำหรับ <br className='hidden md:inline' />
            <span className='font-semibold text-blue-600'>การทดสอบก่อนเรียน</span> และ
            <span className='font-semibold text-green-600'> การทดสอบหลังเรียน</span>
          </p>
        </div>
        <Button
          size='lg'
          onClick={handleCreate}
          disabled={isProcessing}
          className='w-full bg-blue-600 shadow-md transition-all hover:scale-105 hover:bg-blue-700 md:w-auto'
        >
          {isProcessing ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <PlusCircle className='mr-2 h-5 w-5' />
          )}
          สร้างแบบทดสอบทันที
        </Button>
      </div>
    )
  }

  // 3. Edit Mode
  return (
    <div className='animate-in slide-in-from-bottom-4 mx-auto w-full max-w-5xl space-y-6 pb-20 duration-500'>
      {/* Header Section */}
      <div className='flex flex-col items-start justify-between gap-4 border-b pb-6 md:flex-row md:items-center'>
        <div>
          <h1 className='flex items-center gap-2 text-xl font-bold text-slate-800 md:text-2xl'>
            <FileQuestion className='h-6 w-6 text-blue-600 md:h-7 md:w-7' />
            แบบทดสอบวัดผล
          </h1>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            {isEnabled ? (
              <Badge className='border-green-200 bg-green-100 text-green-700 hover:bg-green-100'>
                เปิดใช้งาน
              </Badge>
            ) : (
              <Badge variant='outline' className='border-slate-200 bg-slate-100 text-slate-500'>
                ปิดการใช้งาน
              </Badge>
            )}
            <span className='text-xs text-slate-500 md:text-sm'>
              ใช้สำหรับวัดผลก่อนและหลังเรียน
            </span>
          </div>
        </div>

        {/* Controls: Switch & Delete */}
        <div className='flex w-full flex-col-reverse items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center'>
          {/* Delete Button (Dialog) */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='outline'
                className='w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                ลบแบบทดสอบ
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className='max-w-[95vw] rounded-lg md:max-w-lg'>
              <AlertDialogHeader>
                <AlertDialogTitle className='flex items-center gap-2 text-red-600'>
                  <AlertTriangle className='h-5 w-5' /> ยืนยันการลบ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  คุณต้องการลบแบบทดสอบนี้ออกจากหลักสูตรใช่หรือไม่? <br />
                  การกระทำนี้จะปิดระบบวัดผลของหลักสูตรนี้ทันทีและข้อมูลข้อสอบจะถูกตัดขาด
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className='flex-col gap-2 sm:flex-row'>
                <AlertDialogCancel className='mt-2 w-full sm:mt-0 sm:w-auto'>
                  ยกเลิก
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className='w-full bg-red-600 hover:bg-red-700 sm:w-auto'
                >
                  {isProcessing ? <Loader2 className='h-4 w-4 animate-spin' /> : 'ยืนยันการลบ'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className='mx-2 hidden h-6 w-px bg-slate-200 sm:block' />

          {/* ✅ Switch เปิด-ปิด */}
          <div className='flex items-center justify-between gap-3 rounded-lg border bg-white p-2 px-3 shadow-sm'>
            <span className={cn('text-sm font-medium whitespace-nowrap text-slate-700')}>
              {isEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
            </span>
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggleEnable}
              className='data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200'
            />
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div
        className={cn(
          'transition-all duration-300',
          !isEnabled && 'pointer-events-none opacity-50 grayscale',
        )}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='mb-6 grid w-full grid-cols-2 lg:w-[400px]'>
            <TabsTrigger value='questions'>
              จัดการโจทย์ ({displayData?.questions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value='settings'>ตั้งค่าการสอบ</TabsTrigger>
          </TabsList>

          {/* Tab 1: Questions */}
          <TabsContent value='questions' className='mt-0'>
            <ExerciseManager
              questions={displayData?.questions || []}
              onChange={handleQuestionsChange} // ส่งค่ากลับ Parent ทันที (ไม่ Save)
              isReadOnly={!isEnabled}
            />
          </TabsContent>

          {/* Tab 2: Settings */}
          <TabsContent value='settings' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <Settings2 className='h-5 w-5 text-slate-500' />
                  กำหนดเกณฑ์การสอบ
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-8'>
                {/* 1. กลุ่ม Input ตัวเลข*/}
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
                  <div className='space-y-3'>
                    <Label>เวลาในการทำ (นาที)</Label>
                    <Input
                      type='number'
                      value={displayData.timeLimit}
                      onChange={(e) => handleSettingsChange('timeLimit', Number(e.target.value))}
                      placeholder='0 = ไม่จับเวลา'
                      className='h-11'
                    />
                    <p className='text-[10px] leading-tight text-slate-400'>
                      * ใส่ 0 เพื่อไม่จำกัดเวลาในการสอบ
                    </p>
                  </div>

                  <div className='space-y-3'>
                    <Label>เกณฑ์คะแนนผ่าน (%)</Label>
                    <Input
                      type='number'
                      max={100}
                      value={displayData.passingScore}
                      onChange={(e) => handleSettingsChange('passingScore', Number(e.target.value))}
                      className='h-11'
                    />
                  </div>

                  <div className='space-y-3'>
                    <Label>จำนวนครั้งที่สอบได้</Label>
                    <Input
                      type='number'
                      min={0}
                      value={displayData.maxAttempts}
                      onChange={(e) => handleSettingsChange('maxAttempts', Number(e.target.value))}
                      placeholder='0 = ไม่จำกัด'
                      className='h-11'
                    />
                    <p className='text-[10px] leading-tight text-slate-400'>
                      * ใส่ 0 เพื่อให้ผู้เรียนสอบซ้ำได้ไม่จำกัด
                    </p>
                  </div>
                </div>

                <hr className='border-slate-100' />

                {/* 2. กลุ่ม Switch (จัด 2 คอลัมน์) */}
                <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
                  {/* การสุ่มลำดับ */}
                  <div className='space-y-4'>
                    <Label className='flex items-center gap-2 text-sm font-semibold text-slate-700'>
                      <Shuffle className='size-4 text-blue-500' /> การสุ่มลำดับ
                    </Label>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between rounded-xl border bg-slate-50/50 p-3 px-4'>
                        <span className='text-xs font-medium text-slate-600'>
                          สุ่มลำดับคำถาม{' '}
                          <span className='text-[10px] text-red-600'>(ยังไม่พร้อมใช้งาน)</span>
                        </span>
                        <Switch
                          disabled
                          checked={displayData.shuffleQuestions}
                          onCheckedChange={(v) => handleSettingsChange('shuffleQuestions', v)}
                          className='data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200'
                        />
                      </div>
                      <div className='flex items-center justify-between rounded-xl border bg-slate-50/50 p-3 px-4'>
                        <span className='text-xs font-medium text-slate-600'>
                          สุ่มลำดับตัวเลือก (ก,ข,ค,ง)
                          <span className='text-[10px] text-red-600'> (ยังไม่พร้อมใช้งาน)</span>
                        </span>
                        <Switch
                          disabled
                          checked={displayData.shuffleChoices}
                          onCheckedChange={(v) => handleSettingsChange('shuffleChoices', v)}
                          className='data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200'
                        />
                      </div>
                    </div>
                  </div>

                  {/* การแสดงผล */}
                  <div className='space-y-4'>
                    <Label className='flex items-center gap-2 text-sm font-semibold text-slate-700'>
                      <Eye className='size-4 text-blue-500' /> การแสดงผลลัพธ์
                    </Label>
                    <div className='space-y-2'>
                      <div className='flex items-center justify-between rounded-xl border bg-slate-50/50 p-3 px-4'>
                        <span className='text-xs font-medium text-slate-600'>
                          แสดงคะแนนทันทีหลังสอบ
                          <span className='text-[10px] text-red-600'> (ยังไม่พร้อมใช้งาน)</span>
                        </span>
                        <Switch
                          disabled
                          checked={displayData.showResultImmediate}
                          onCheckedChange={(v) => handleSettingsChange('showResultImmediate', v)}
                          className='data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200'
                        />
                      </div>
                      <div className='flex items-center justify-between rounded-xl border bg-slate-50/50 p-3 px-4'>
                        <span className='text-xs font-medium text-slate-600'>
                          อนุญาตให้ดูเฉลยหลังสอบ{' '}
                          <span className='text-[10px] text-red-600'>(ยังไม่พร้อมใช้งาน)</span>
                        </span>
                        <Switch
                          disabled
                          checked={displayData.allowReview}
                          onCheckedChange={(v) => handleSettingsChange('allowReview', v)}
                          className='data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ส่วนความปลอดภัย (Anti-Cheat) คงเดิมแต่ปรับ Padding ให้สมดุล */}
            <Card className='border-orange-100 bg-orange-50/30'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg text-orange-800'>
                  <ShieldCheck className='h-5 w-5' />
                  ระบบความปลอดภัย (Anti-Cheat)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md'>
                    <div className='space-y-1'>
                      <p className='text-sm font-bold text-slate-700'>
                        ป้องกันการสลับหน้าจอ
                        <span className='text-[10px] font-medium text-red-600'>
                          {' '}
                          (ยังไม่พร้อมใช้งาน)
                        </span>
                      </p>
                      <p className='text-[11px] text-slate-500'>
                        แจ้งเตือนเมื่อผู้เรียนเปลี่ยน Tab หรือเปิดโปรแกรมอื่น
                      </p>
                    </div>
                    <Switch
                      disabled
                      checked={displayData.preventTabSwitch}
                      onCheckedChange={(v) => handleSettingsChange('preventTabSwitch', v)}
                      className='data-[state=checked]:bg-orange-600 data-[state=unchecked]:bg-slate-200'
                    />
                  </div>

                  <div className='flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md'>
                    <div className='space-y-1'>
                      <p className='text-sm font-bold text-slate-700'>
                        ป้องกันการคัดลอก/วาง
                        <span className='text-[10px] font-medium text-red-600'>
                          {' '}
                          (ยังไม่พร้อมใช้งาน)
                        </span>
                      </p>
                      <p className='text-[11px] text-slate-500'>
                        ปิดการใช้งานคลิกขวาและการใช้ปุ่มลัด Copy-Paste
                      </p>
                    </div>
                    <Switch
                      disabled
                      checked={displayData.preventCopyPaste}
                      onCheckedChange={(v) => handleSettingsChange('preventCopyPaste', v)}
                      className='data-[state=checked]:bg-orange-600 data-[state=unchecked]:bg-slate-200'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {!isEnabled && (
        <div className='mt-4 text-center text-sm text-slate-400 italic'>
          * ระบบวัดผลถูกปิดใช้งานอยู่ ผู้เรียนจะไม่เห็นแบบทดสอบนี้
        </div>
      )}
    </div>
  )
}
