// page.tsx
'use client'

import Loading from '@/components/layout/common/GlobalLoading'
import CorseEditorHeader from '@/components/layout/course-editor/course-editor-header'
import CourseSidebar from '@/components/layout/course-editor/course-editor-sidebar'
import LessonForm from '@/components/layout/course-editor/lesson-form'
import AssessmentManager from '@/components/layout/course-editor/AssessmentManager'
import CourseSettingsForm from '@/components/layout/course-editor/settings-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getFullCourseDataAction, saveCourseStructureAction } from '@/lib/sanity/course-actions'
import { updateExamDataAction } from '@/lib/sanity/exam-actions'
import { use, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function CourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const courseId = resolvedParams.courseId

  // --- States ---
  const [courseData, setCourseData] = useState<any>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [currentView, setCurrentView] = useState<'content' | 'assessment' | 'settings'>('content')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublished, setIsPublished] = useState(courseData?.isPublished || false)

  const [pendingExamData, setPendingExamData] = useState<any>(null)

  const [selectedLessonKey, setSelectedLessonKey] = useState<string | null>(null)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)

  // --- Draft States ---
  const isDraftProcessed = useRef(false)
  const STORAGE_KEY = `draft-course-${courseId}`

  // Fetch Data Function
  const fetchCourseData = useCallback(async () => {
    const data = await getFullCourseDataAction(courseId)
    if (data) {
      setMetadata({
        categories: data.allCategories,
        instructors: data.allInstructors,
        exams: data.allExams,
      })
      setIsPublished(data.status === 'published')
    }
    return data
  }, [courseId])

  // --- Initialize Data ---
  useEffect(() => {
    let isMounted = true
    async function init() {
      const serverData = await fetchCourseData()
      if (serverData && isMounted) {
        let finalData = { ...serverData }
        let hasDraft = false
        if (!isDraftProcessed.current) {
          const savedDraft = localStorage.getItem(STORAGE_KEY)
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft)
              // รวมข้อมูลแบบร่าง กับข้อมูลจาก Server
              finalData = { ...serverData, ...parsed }

              // กู้คืนข้อมูลข้อสอบที่แก้ไขค้างไว้ (ถ้ามี)
              if (parsed.pendingExamData) {
                setPendingExamData(parsed.pendingExamData)
              }

              hasDraft = true
              toast.info('กู้คืนข้อมูลล่าสุดแล้ว')
            } catch (e) {
              console.error('Error parsing draft', e)
            }
          }
          isDraftProcessed.current = true
        }
        setCourseData(finalData)
        if (hasDraft) {
          setIsDirty(true)
        }
      }
    }
    init()
    return () => {
      isMounted = false
    }
  }, [fetchCourseData, STORAGE_KEY])

  // Fuction สำหรับบันทึกร่างอัตโนมัติลง LocalStorage
  useEffect(() => {
    if (isDirty && courseData && isDraftProcessed.current) {
      const draftData = {
        modules: courseData.modules,
        resources: courseData.resources,
        title: courseData.title,
        isPublished: isPublished,
        pendingExamData: pendingExamData,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData))
      setLastSavedTime(new Date())
    }
  }, [courseData, isDirty, STORAGE_KEY, isPublished, pendingExamData])

  // Fuction ป้องกันการปิดหน้าเว็บโดยไม่ได้ตั้งใจ
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // 1. รับค่า Exam ที่แก้ไขจาก AssessmentManager (ยังไม่ Save ลง DB)
  const handleExamUpdate = (newData: any) => {
    setPendingExamData(newData)
    setIsDirty(true) // แจ้งเตือน Header ว่ามีของต้อง Save
  }

  // Function สำหรับทิ้งร่างที่แก้ไขค้างไว้
  const handleDiscardDraft = async () => {
    setIsDiscardDialogOpen(false)
    const toastId = toast.loading('กำลังย้อนกลับข้อมูล...')

    const data = await fetchCourseData()
    if (data) {
      setCourseData(data)
      setPendingExamData(null)
      setIsDirty(false)
      localStorage.removeItem(STORAGE_KEY)
      toast.success('ล้างฉบับร่างและย้อนกลับข้อมูลปัจจุบันแล้ว', { id: toastId })
    } else {
      toast.error('ไม่สามารถดึงข้อมูลใหม่ได้', { id: toastId })
    }
  }

  // ฟังก์ชันสำหรับ Toggle Publish
  const handleTogglePublish = (status: boolean) => {
    if (isPublished === status) return
    setIsPublished(status)
    setIsDirty(true)
  }

  // Fuctions อัปเดตข้อมูลหลักส่วนกลาง
  const handleUpdateGlobal = (updatedFields: any) => {
    setCourseData((prev: any) => ({ ...prev, ...updatedFields }))
  }

  // Function สำหรับบันทึกข้อมูลทั้งหมด
  const handleSaveAll = async () => {
    if (!courseData) return
    setIsSaving(true)
    const toastId = toast.loading('กำลังบันทึกข้อมูลทั้งหมดลงระบบ...')
    try {
      // Step A: บันทึก Course Structure (Modules, Resources, Status)
      const courseResult = await saveCourseStructureAction(
        courseId,
        courseData.modules || [],
        isPublished ? 'published' : 'draft',
        courseData.resources || [],
        courseData.enableAssessment || false,
      )

      if (!courseResult.success) {
        throw new Error(courseResult.error || 'บันทึกโครงสร้างหลักสูตรไม่สำเร็จ')
      }

      // Step B: บันทึก Exam Data (ถ้ามีการแก้ไข และมีข้อสอบอยู่จริง)
      if (pendingExamData && courseData.examRef?._ref) {
        const examId = courseData.examRef._ref
        const examResult = await updateExamDataAction(examId, pendingExamData)

        if (!examResult.success) {
          throw new Error(examResult.error || 'บันทึกข้อมูลข้อสอบไม่สำเร็จ')
        }
      }

      localStorage.removeItem(STORAGE_KEY)
      setIsDirty(false)

      // โหลดข้อมูลล่าสุดจาก Server อีกครั้ง
      const freshData = await fetchCourseData()
      if (freshData) {
        setCourseData(freshData)
      }
      setPendingExamData(null)
      toast.success('บันทึกข้อมูลทั้งหมดเรียบร้อย!', { id: toastId })
    } catch (error: any) {
      toast.error(error.message || 'เกิดข้อผิดพลาดในการบันทึก', { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  if (!courseData) return <Loading />

  const selectedLesson = courseData.modules
    ?.flatMap((m: any) => m.lessons || [])
    .find((l: any) => l?._key === selectedLessonKey)

  return (
    <div className='flex h-screen flex-col overflow-hidden'>
      {/* --- Header --- */}
      <CorseEditorHeader
        courseTitle={courseData.title}
        currentView={currentView}
        onSwitchView={setCurrentView}
        isDirty={isDirty}
        onSave={handleSaveAll}
        onDiscard={() => setIsDiscardDialogOpen(true)}
        lastSavedTime={lastSavedTime}
        isPublished={isPublished}
        onTogglePublish={handleTogglePublish}
        isSaving={isSaving}
      />

      {/* --- Main Content --- */}
      <main className='relative flex-1 overflow-hidden'>
        {currentView === 'content' && (
          <div className='flex h-full w-full'>
            {/* Sidebar: 
                - Mobile: ซ่อนถ้ามีการเลือก Lesson (selectedLessonKey มีค่า)
                - Desktop: แสดงตลอด (w-80) 
            */}
            <aside
              className={`h-full flex-shrink-0 border-r bg-slate-50/50 transition-all ${selectedLessonKey ? 'hidden md:block' : 'w-full md:w-80'} md:w-80`}
            >
              <CourseSidebar
                courseId={courseId}
                modules={courseData.modules || []}
                setModules={(newModules) => {
                  handleUpdateGlobal({ modules: newModules })
                  setIsDirty(true)
                }}
                resources={courseData.resources || []}
                setResources={(newResources) => {
                  handleUpdateGlobal({ resources: newResources })
                  setIsDirty(true)
                }}
                selectedLessonKey={selectedLessonKey}
                onSelectLesson={(lesson) => {
                  setSelectedLessonKey(lesson._key)
                  setCurrentView('content')
                }}
                setIsDirty={setIsDirty}
              />
            </aside>

            {/* Editor Area:
                - Mobile: ซ่อนถ้ายังไม่เลือก Lesson, ถ้าเลือกแล้วให้เต็มจอ (w-full)
                - Desktop: flex-1 (กินพื้นที่ที่เหลือ)
            */}
            <section
              className={`h-full overflow-y-auto bg-white ${selectedLessonKey ? 'block w-full' : 'hidden md:block'} md:flex-1`}
            >
              {selectedLesson ? (
                <div className='flex h-full flex-col'>
                  {/* Mobile Back Button: แสดงเฉพาะ Mobile เมื่ออยู่ในหน้า Editor */}
                  <div className='sticky top-0 z-10 flex items-center gap-2 border-b bg-white p-2 md:hidden'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setSelectedLessonKey(null)}
                      className='gap-1 text-slate-600'
                    >
                      <ArrowLeft className='h-4 w-4' />
                      กลับไปหน้ารายการ
                    </Button>
                    <span className='max-w-[200px] truncate text-sm font-medium'>
                      {selectedLesson.title || 'Untitled Lesson'}
                    </span>
                  </div>

                  <div className='flex-1 p-4 md:p-8'>
                    <LessonForm
                      courseId={courseId}
                      key={selectedLesson._key}
                      lesson={selectedLesson}
                      onUpdate={(newData) => {
                        const updatedModules = courseData.modules.map((mod: any) => ({
                          ...mod,
                          lessons: mod.lessons?.map((les: any) =>
                            les._key === selectedLesson._key ? { ...les, ...newData } : les,
                          ),
                        }))
                        handleUpdateGlobal({ modules: updatedModules })
                        setIsDirty(true)
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className='flex h-full items-center justify-center p-4 text-center text-slate-400'>
                  <div className='flex flex-col items-center gap-2'>
                    {/* Icon or Text */}
                    <span>เลือกบทเรียนจากแถบด้านซ้ายเพื่อเริ่มแก้ไข</span>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {currentView === 'assessment' && (
          <div className='h-full w-full overflow-y-auto bg-slate-50 p-4 md:p-8'>
            <div className='mx-auto max-w-4xl'>
              <AssessmentManager
                courseId={courseId}
                courseTitle={courseData.title}
                examId={courseData?.examRef?._ref || null}
                pendingData={pendingExamData}
                onUpdate={handleExamUpdate}
                isEnabled={courseData?.enableAssessment || false}
                onToggleEnable={(checked) => {
                  handleUpdateGlobal({ enableAssessment: checked })
                  setIsDirty(true)
                }}
                onRefresh={async () => {
                  // ดึงข้อมูลข้อสอบล่าสุดจาก Server
                  router.refresh()
                  const newData = await fetchCourseData()
                  if (newData) {
                    setCourseData((prev: any) => ({
                      ...prev,
                      examRef: newData.examRef,
                      enableAssessment: newData.enableAssessment,
                    }))
                    // เคลียร์ข้อมูลข้อสอบที่แก้ไขค้างไว้เพราะดึงจาก Server ใหม่แล้ว
                    setPendingExamData(null)
                  }
                }}
              />
            </div>
          </div>
        )}

        {currentView === 'settings' && (
          <div className='h-full w-full overflow-y-auto bg-slate-50 p-4 md:p-8'>
            <div className='mx-auto max-w-4xl'>
              <CourseSettingsForm
                courseId={courseId}
                initialData={courseData}
                metadata={metadata}
                onSuccess={(updatedFields) => {
                  handleUpdateGlobal(updatedFields)
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* --- AlertDialog: Confirm Discard Draft --- */}
      <AlertDialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <AlertDialogContent className='font-prompt max-w-[90vw] rounded-lg md:max-w-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-xl font-bold text-red-600'>
              ยืนยันการล้างฉบับร่าง?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-[15px] leading-relaxed'>
              คุณกำลังจะละทิ้งการแก้ไขทั้งหมดที่ยังไม่ได้บันทึก
              ข้อมูลจะถูกย้อนกลับไปเป็นเวอร์ชันล่าสุดที่มีอยู่ในระบบ (Server)
              การกระทำนี้ไม่สามารถย้อนคืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='mt-4 flex-col gap-2 md:flex-row'>
            <AlertDialogCancel className='mt-2 w-full rounded-lg md:mt-0 md:w-auto'>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardDraft}
              className='w-full rounded-lg bg-red-600 text-white hover:bg-red-700 md:w-auto'
            >
              ยืนยันการทิ้งฉบับร่าง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
