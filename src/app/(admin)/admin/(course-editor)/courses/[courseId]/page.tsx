// page.tsx
'use client'

import Loading from '@/components/layout/common/GlobalLoading'
import CorseEditorHeader from '@/components/layout/course-editor/course-editor-header'
import CourseSidebar from '@/components/layout/course-editor/course-editor-sidebar'
import LessonForm from '@/components/layout/course-editor/lesson-form'
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
import { getFullCourseDataAction, saveCourseStructureAction } from '@/lib/sanity/course-actions'
import { use, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export default function CourseEditorPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params)
  const courseId = resolvedParams.courseId

  // --- States ---
  const [courseData, setCourseData] = useState<any>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [currentView, setCurrentView] = useState<'content' | 'settings'>('content')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublished, setIsPublished] = useState(courseData?.isPublished || false)

  const [selectedLessonKey, setSelectedLessonKey] = useState<string | null>(null)

  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)

  // --- Draft States ---
  const isDraftProcessed = useRef(false)
  const STORAGE_KEY = `draft-course-${courseId}`

  // --- Initialize Data ---
  useEffect(() => {
    async function initData() {
      const data = await getFullCourseDataAction(courseId)
      if (data) {
        setMetadata({
          categories: data.allCategories,
          instructors: data.allInstructors,
          exams: data.allExams,
        })
        setIsPublished(data.status === 'published')

        // ตรวจสอบ Draft ใน LocalStorage
        const savedDraft = localStorage.getItem(STORAGE_KEY)
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft)
            setCourseData({ ...data, ...parsed })
            setIsDirty(true)
            toast.info('กู้คืนข้อมูลฉบับร่างล่าสุดให้แล้ว')
          } catch (e) {
            setCourseData(data)
          }
        } else {
          setCourseData(data)
        }

        setTimeout(() => {
          isDraftProcessed.current = true
        }, 500)
      }
    }
    initData()
  }, [courseId])

  // Fuction สำหรับบันทึกร่างอัตโนมัติลง LocalStorage
  useEffect(() => {
    if (isDirty && courseData && isDraftProcessed.current) {
      const draftData = {
        modules: courseData.modules,
        resources: courseData.resources,
        title: courseData.title,
        isPublished: isPublished,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData))
      setLastSavedTime(new Date())
    }
  }, [courseData, isDirty, STORAGE_KEY])

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

  // Function สำหรับทิ้งร่างที่แก้ไขค้างไว้
  const handleDiscardDraft = async () => {
    setIsDiscardDialogOpen(false)
    const toastId = toast.loading('กำลังย้อนกลับข้อมูล...')

    const data = await getFullCourseDataAction(courseId)
    if (data) {
      setCourseData(data)
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
      const result = await saveCourseStructureAction(
        courseId,
        courseData.modules || [],
        isPublished ? 'published' : 'draft',
        courseData.resources || [],
      )
      if (result.success) {
        toast.success('บันทึกข้อมูลและอัปเดตเนื้อหาบทเรียนเรียบร้อย!', { id: toastId })
        localStorage.removeItem(STORAGE_KEY)
        setIsDirty(false)

        // Refresh ข้อมูลหลังบันทึก
        // const refreshed = await getFullCourseDataAction(courseId)
        // if (refreshed) setCourseData(refreshed.course)
      } else {
        throw new Error(result.error)
      }
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
    <div className='flex h-screen flex-col'>
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
      />

      {/* --- Main Content --- */}
      <main className='flex-1 overflow-hidden'>
        {currentView === 'content' ? (
          <div className='flex h-full w-full'>
            <aside className='w-80 flex-shrink-0 border-r bg-slate-50/50'>
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
            <section className='flex-1 overflow-y-auto bg-white p-8'>
              {selectedLesson ? (
                <LessonForm
                  key={selectedLesson._key}
                  lesson={selectedLesson}
                  //exams={metadata?.exams || []}
                  onUpdate={(newData) => {
                    // Logic อัปเดตเฉพาะบทเรียนในก้อน Modules
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
              ) : (
                <div className='flex h-full items-center justify-center text-slate-400'>
                  เลือกบทเรียนจากแถบด้านซ้ายเพื่อเริ่มแก้ไข
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className='h-full w-full overflow-y-auto bg-slate-50 p-8'>
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
        <AlertDialogContent className='font-prompt'>
          {' '}
          {/* ใส่ font-prompt ให้เข้าชุดกัน */}
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
          <AlertDialogFooter className='mt-4'>
            <AlertDialogCancel className='rounded-lg'>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardDraft}
              className='rounded-lg bg-red-600 text-white hover:bg-red-700'
            >
              ยืนยันการทิ้งฉบับร่าง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
