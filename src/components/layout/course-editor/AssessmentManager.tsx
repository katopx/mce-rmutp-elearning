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

// Sub-component (ใช้ตัวเดิมที่มี)
import ExerciseManager from './ExerciseManager'

// Actions ใหม่
import { getExamById } from '@/lib/sanity/exam-actions'
import { createAndLinkExamAction, unlinkExamAction } from '@/lib/sanity/course-actions'
import { cn } from '@/lib/utils'

interface AssessmentManagerProps {
  courseId: string
  examId?: string | null

  // 🔥 Props สำคัญสำหรับ Global Save
  pendingData?: any // ข้อมูลที่แก้ค้างไว้จาก Parent
  onUpdate: (data: any) => void // ฟังก์ชันส่งค่ากลับไป Parent
  onRefresh: () => void // สั่ง Refresh หน้าจอเมื่อ Create/Delete

  // ✅ Props ใหม่: สำหรับ Switch เปิด/ปิด
  isEnabled: boolean
  onToggleEnable: (checked: boolean) => void
}

export default function AssessmentManager({
  courseId,
  examId,
  pendingData,
  onUpdate,
  onRefresh,
  isEnabled, // รับค่ามา
  onToggleEnable, // รับฟังก์ชันมา
}: AssessmentManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false) // สำหรับปุ่ม Create/Delete
  const [activeTab, setActiveTab] = useState('questions')
  const [initialData, setInitialData] = useState<any>(null) // ข้อมูลตั้งต้นจาก Server

  // 1. Load Data
  useEffect(() => {
    async function loadData() {
      if (!examId) return

      // ถ้ามี pendingData (แก้ค้างไว้) ให้ใช้ตัวนั้นเลย ไม่ต้องโหลดใหม่
      if (pendingData) {
        setInitialData(pendingData)
        return
      }

      setIsLoading(true)
      try {
        const data = await getExamById(examId)
        if (data) {
          setInitialData(data)
          // ส่งค่าตั้งต้นกลับไปให้ Parent รับรู้ (เผื่อไว้เทียบ Dirty)
          // onUpdate(data) <-- บรรทัดนี้ Optional แล้วแต่ Logic ของ Page.tsx
        }
      } catch (error) {
        toast.error('ไม่สามารถโหลดข้อมูลแบบทดสอบได้')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [examId]) // ลบ pendingData ออกเพื่อกัน Loop

  // ข้อมูลที่จะแสดงผล = ข้อมูลที่แก้ค้างไว้ (ถ้ามี) หรือ ข้อมูลตั้งต้น
  const displayData = pendingData ||
    initialData || { questions: [], timeLimit: 0, passingScore: 60 }

  // --- Handlers: Create / Delete (Direct Actions) ---

  const handleCreate = async () => {
    setIsProcessing(true)
    try {
      const res = await createAndLinkExamAction(courseId, 'แบบทดสอบวัดผลก่อนและหลังเรียน')
      if (res.success) {
        toast.success('สร้างแบบทดสอบเรียบร้อย')
        onRefresh() // แจ้ง Parent ให้ Refresh เพื่อรับ examId ใหม่
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
        onRefresh() // แจ้ง Parent ให้ Refresh เพื่อเคลียร์ examId
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
    // ส่ง Object ทั้งก้อนกลับไป (Merge กับค่าเดิม)
    onUpdate({
      ...displayData,
      questions: newQuestions,
    })
  }

  const handleSettingsChange = (field: string, value: any) => {
    onUpdate({
      ...displayData,
      [field]: value,
    })
  }

  // ================= RENDER =================

  // 1. Loading
  if (isLoading) {
    return (
      <div className='flex h-[50vh] flex-col items-center justify-center gap-3 text-slate-400'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  // 2. Empty State (ยังไม่มี Exam)
  if (!examId) {
    return (
      <div className='animate-in fade-in zoom-in-95 flex h-full flex-col items-center justify-center space-y-6 rounded-xl border-2 border-dashed bg-slate-50/50 p-12 text-center duration-500'>
        <div className='rounded-full bg-blue-100 p-6 text-blue-600 shadow-sm'>
          <GraduationCap size={48} />
        </div>
        <div className='space-y-2'>
          <h2 className='text-xl font-bold text-slate-800'>ยังไม่มีแบบทดสอบวัดผล</h2>
          <p className='mx-auto max-w-md leading-relaxed text-slate-500'>
            คลิกปุ่มด้านล่างเพื่อสร้างชุดข้อสอบสำหรับ <br />
            <span className='font-semibold text-blue-600'>การทดสอบก่อนเรียน</span> และ
            <span className='font-semibold text-green-600'> การทดสอบหลังเรียน</span>
          </p>
        </div>
        <Button
          size='lg'
          onClick={handleCreate}
          disabled={isProcessing}
          className='bg-blue-600 shadow-md transition-all hover:scale-105 hover:bg-blue-700'
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
    <div className='animate-in slide-in-from-bottom-4 mx-auto max-w-5xl space-y-6 pb-20 duration-500'>
      {/* Header Section */}
      <div className='flex flex-col items-start justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold text-slate-800'>
            <FileQuestion className='text-blue-600' />
            แบบทดสอบวัดผล
          </h1>
          <div className='mt-2 flex items-center gap-2'>
            {isEnabled ? (
              <Badge className='border-green-200 bg-green-100 text-green-700 hover:bg-green-100'>
                เปิดใช้งาน
              </Badge>
            ) : (
              <Badge variant='outline' className='border-slate-200 bg-slate-100 text-slate-500'>
                ปิดการใช้งาน
              </Badge>
            )}
            <span className='text-sm text-slate-500'>ใช้สำหรับวัดผลก่อนและหลังเรียน</span>
          </div>
        </div>

        {/* Controls: Switch & Delete */}
        <div className='flex items-center gap-4'>
          {/* ✅ Switch เปิด-ปิด */}
          <div className='flex min-w-[140px] items-center justify-between gap-3 rounded-lg border bg-white p-2 shadow-sm'>
            <span className={cn('text-sm font-medium text-slate-700')}>
              {isEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
            </span>
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggleEnable}
              className='data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200'
            />
          </div>

          <div className='mx-2 h-6 w-px bg-slate-200' />

          {/* Delete Button (Dialog) */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='outline'
                className='border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                ลบแบบทดสอบ
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className='flex items-center gap-2 text-red-600'>
                  <AlertTriangle className='h-5 w-5' /> ยืนยันการลบ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  คุณต้องการลบแบบทดสอบนี้ออกจากหลักสูตรใช่หรือไม่? <br />
                  การกระทำนี้จะปิดระบบวัดผลของหลักสูตรนี้ทันที
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className='bg-red-600 hover:bg-red-700'>
                  {isProcessing ? <Loader2 className='h-4 w-4 animate-spin' /> : 'ยืนยันการลบ'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ถ้าปิดใช้งาน (Disabled) เราอาจจะ Disable UI ข้างล่างด้วย 
         เพื่อให้ Admin รู้ว่ามันไม่ Active 
      */}

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
          <TabsContent value='settings'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings2 className='h-5 w-5 text-slate-500' />
                  กำหนดเกณฑ์การสอบ
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                  <div className='space-y-3'>
                    <Label>เวลาในการทำ (นาที)</Label>
                    <Input
                      type='number'
                      value={displayData.timeLimit}
                      onChange={(e) => handleSettingsChange('timeLimit', Number(e.target.value))}
                      placeholder='0 = ไม่จับเวลา'
                    />
                  </div>
                  <div className='space-y-3'>
                    <Label>เกณฑ์คะแนนผ่าน (%)</Label>
                    <Input
                      type='number'
                      max={100}
                      value={displayData.passingScore}
                      onChange={(e) => handleSettingsChange('passingScore', Number(e.target.value))}
                    />
                  </div>
                  <div className='space-y-3'>
                    <Label>จำนวนครั้งที่สอบได้ (0 = ไม่จำกัด)</Label>
                    <Input
                      type='number'
                      value={displayData.maxAttempts}
                      onChange={(e) => handleSettingsChange('maxAttempts', Number(e.target.value))}
                    />
                  </div>
                  <div className='space-y-3'>
                    <Label>การสุ่มโจทย์</Label>
                    <div className='flex items-center gap-3 rounded-md border p-2.5'>
                      <Switch
                        checked={displayData.shuffleQuestions}
                        onCheckedChange={(checked) =>
                          handleSettingsChange('shuffleQuestions', checked)
                        }
                      />
                      <span className='text-sm text-slate-600'>
                        {displayData.shuffleQuestions ? 'สุ่มลำดับทุกครั้ง' : 'เรียงตามลำดับปกติ'}
                      </span>
                    </div>
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
