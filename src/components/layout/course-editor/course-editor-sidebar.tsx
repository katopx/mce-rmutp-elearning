'use client'

import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ALL_RESOURCE_TYPES, getFileIcon } from '@/constants/course'
import { cn } from '@/lib/utils'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Edit,
  ExternalLink,
  File,
  FileText,
  GripVertical,
  HelpCircle,
  MoreVertical,
  PenTool,
  Plus,
  Trash2,
  Video,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SidebarProps {
  courseId: string
  modules: any[]
  setModules: (modules: any[]) => void
  resources?: any[]
  setResources?: (resources: any[]) => void
  selectedLessonKey: string | null
  onSelectLesson: (lesson: any) => void
  setIsDirty: (dirty: boolean) => void
  activeTab?: string
  setActiveTab?: (tab: string) => void
}

// --- Sortable Components (Module & Lesson) ---
function SortableModule({
  module,
  index,
  children,
  onOpenMenu,
  onDelete,
  onRename,
  isExpanded,
  onToggle,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module._key,
    data: { type: 'module', module },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    pointerEvents: isDragging ? ('none' as const) : ('auto' as const),
    zIndex: isDragging ? 999 : 1,
    position: 'relative' as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('mb-2', isDragging && 'relative z-50 opacity-50')}
    >
      <AccordionItem
        value={module._key}
        className='overflow-hidden rounded-lg border-none bg-white shadow-sm'
      >
        <div className='group flex items-center justify-between px-1 py-1 transition-colors hover:bg-slate-50'>
          <div className='flex min-w-0 flex-1 items-center'>
            {/* เฉพาะส่วนนี้ที่ใช้ลาก (Drag Handle) */}
            <div
              {...attributes}
              {...listeners}
              className='cursor-grab p-2 text-slate-300 hover:text-slate-500 active:cursor-grabbing'
              onPointerDown={(e) => {
                const target = e.target as HTMLElement
                if (target.closest('.cursor-grab')) {
                  e.stopPropagation()
                }
                listeners?.onPointerDown(e)
              }}
            >
              <GripVertical className='h-4 w-4' />
            </div>

            {/* ส่วนนี้ใช้คลิกเพื่อ กาง-ขยาย (Trigger) */}
            <div
              className='flex-1 cursor-pointer py-2 text-sm font-medium select-none'
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
            >
              บทที่ {index + 1}: {module.title}
            </div>
          </div>

          <div className='flex items-center'>
            <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 text-slate-400 hover:text-blue-600'
              onClick={(e) => {
                e.stopPropagation()
                onOpenMenu(module._key)
              }}
              title='เพิ่มบทเรียน'
            >
              <Plus className='h-4 w-4' />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='h-7 w-7 text-slate-400'>
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  className='cursor-pointer text-sm'
                  onClick={() => onRename(module._key, module.title)}
                >
                  <Edit className='mr-2 h-4 w-4' /> เปลี่ยนชื่อบทเรียน
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className='cursor-pointer text-sm text-red-600 focus:bg-red-50 focus:!text-red-600'
                  onClick={() => onDelete(module._key, module.title)}
                >
                  <Trash2 className='mr-2 h-4 w-4 text-red-600' /> ลบบทเรียน
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <AccordionContent className='border-t border-slate-100 bg-slate-50/50 pt-0 pb-0'>
          {children}
        </AccordionContent>
      </AccordionItem>
    </div>
  )
}

function SortableLesson({ lesson, selectedLessonKey, onSelect, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson._key,
    data: { type: 'lesson', lesson },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center pr-2 transition-colors',
        selectedLessonKey === lesson._key ? 'bg-primary/10' : 'hover:bg-slate-100',
        isDragging && 'bg-slate-100 opacity-50',
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'cursor-grab p-2 pl-3 transition-opacity hover:text-slate-500',
          selectedLessonKey === lesson._key
            ? 'text-primary/70 opacity-100'
            : 'text-slate-300 opacity-0 group-hover:opacity-100',
        )}
      >
        <GripVertical className='h-3.5 w-3.5' />
      </div>
      <button
        onClick={() => onSelect(lesson)}
        className={cn(
          'flex flex-1 items-center py-2.5 pl-1 text-left text-sm outline-none',
          selectedLessonKey === lesson._key ? 'text-primary font-medium' : 'text-slate-600',
        )}
      >
        <span
          className={cn(
            'mr-2.5',
            selectedLessonKey === lesson._key ? 'text-blue-500' : 'text-slate-400',
          )}
        >
          {lesson.lessonType === 'video' && <Video className='h-4 w-4' />}
          {lesson.lessonType === 'article' && <FileText className='h-4 w-4' />}
          {lesson.lessonType === 'quiz' && <HelpCircle className='h-4 w-4' />}
          {lesson.lessonType === 'exercise' && <PenTool className='h-4 w-4' />}
        </span>
        <span>
          {lesson.title}{' '}
          {lesson.isNew && (
            <span className='ml-2 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-normal text-green-600'>
              ใหม่
            </span>
          )}
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 text-slate-400 opacity-0 group-hover:opacity-100'
          >
            <MoreVertical className='h-3.5 w-3.5' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            className='cursor-pointer text-sm text-red-600 focus:bg-red-50 focus:!text-red-600'
            onClick={(e) => {
              e.stopPropagation()
              onDelete(lesson._key, lesson.title)
            }}
          >
            <Trash2 className='mr-2 h-4 w-4 text-red-600' /> ลบบทเรียน
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function SortableResource({ resource, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: resource._key,
    data: { type: 'resource', resource },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative mb-2 flex items-center rounded-lg border bg-white p-2 shadow-sm transition-all hover:border-blue-200',
        isDragging && 'z-50 opacity-50',
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className='cursor-grab pr-2 text-slate-300 hover:text-slate-500'
      >
        <GripVertical className='h-4 w-4' />
      </div>

      {/* แสดง Icon ตามประเภทที่บันทึกไว้ */}
      <div className='mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-1.5'>
        <img
          src={getFileIcon(resource.fileType || resource.type).icon}
          alt={getFileIcon(resource.type).label}
          className='h-full w-full object-contain'
        />
      </div>

      <div className='flex-1 overflow-hidden'>
        <p className='truncate text-sm font-medium text-slate-700'>{resource.title}</p>
        <p className='flex items-center gap-1 text-[10px] text-slate-400'>{resource.fileUrl}</p>
      </div>

      <div className='flex items-center'>
        <a href={resource.fileUrl} target='_blank' rel='noreferrer'>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 bg-transparent text-slate-400 hover:bg-transparent hover:text-blue-600'
          >
            <ExternalLink className='h-4 w-4' />
          </Button>
        </a>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 bg-transparent text-slate-400 hover:bg-transparent hover:text-red-600'
          onClick={() => onDelete(resource._key, resource.title)}
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}

// --- MAIN COMPONENT ---
export default function CourseEditorSidebar({
  courseId,
  modules,
  setModules,
  resources,
  setResources,
  selectedLessonKey,
  onSelectLesson,
  setIsDirty,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
}: SidebarProps) {
  const [localActiveTab, setLocalActiveTab] = useState('content')
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab
  const safeResources = resources || []

  // UI States
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false)
  const [isRenameModuleOpen, setIsRenameModuleOpen] = useState(false)
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false)
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false)

  // Shared Delete Dialog State
  const [deleteConfig, setDeleteConfig] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
  } | null>(null)

  // Form Data
  const [newAssessmentName, setNewAssessmentName] = useState('')
  const [newModuleName, setNewModuleName] = useState('')
  const [renameModuleData, setRenameModuleData] = useState({ key: '', title: '' })
  const [newResourceData, setNewResourceData] = useState({ title: '', url: '', type: 'Unknown' })
  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)

  // เริ่มต้นให้กาง Module แรก และเลือกบทเรียนแรก
  useEffect(() => {
    setIsMounted(true)
    if (modules.length > 0) {
      setExpandedItems([modules[0]._key])
      if (!selectedLessonKey && modules[0].lessons?.length > 0) {
        onSelectLesson(modules[0].lessons[0])
      }
    }
  }, [courseId])

  useEffect(() => {
    if (modules && modules.length > 0) {
      const allKeys = modules.map((m) => m._key)
      const missingKeys = allKeys.filter((key) => !expandedItems.includes(key))
      if (missingKeys.length > 0) {
        setExpandedItems((prev) => [...prev, ...missingKeys])
      }
    }
  }, [modules])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const generateTempId = () => `temp-${Date.now()}`

  // --- Handlers: Assessment ---
  const handleAddAssessment = () => {
    if (!newAssessmentName.trim()) return
    toast.success(`เพิ่มแบบทดสอบแล้ว "${newAssessmentName}" แล้ว`)
  }

  // --- Handlers: Modules & Lessons ---
  const handleAddModule = () => {
    if (!newModuleName.trim()) return
    const newModule = { _key: generateTempId(), title: newModuleName, lessons: [] }
    setModules([...modules, newModule])
    setExpandedItems((prev) => [...prev, newModule._key])
    setNewModuleName('')
    setIsAddModuleOpen(false)
    setIsDirty(true)
    toast.success(`เพิ่มส่วน "${newModuleName}" แล้ว`)
  }

  const handleRenameModule = () => {
    if (!renameModuleData.title.trim()) return
    setModules(
      modules.map((m) =>
        m._key === renameModuleData.key ? { ...m, title: renameModuleData.title } : m,
      ),
    )
    setIsRenameModuleOpen(false)
    setIsDirty(true)
    toast.success('อัปเดตชื่อส่วนเรียบร้อยแล้ว')
  }

  const triggerDeleteModule = (moduleKey: string, title: string) => {
    setDeleteConfig({
      isOpen: true,
      title: 'ยืนยันการลบส่วนเนื้อหา?',
      description: `คุณกำลังจะลบส่วน "${title}" การลบส่วนนี้จะทำให้บทเรียนทั้งหมดภายในส่วนนี้ถูกลบออกถาวรและไม่สามารถกู้คืนได้`,
      onConfirm: () => {
        setModules(modules.filter((m) => m._key !== moduleKey))
        setIsDirty(true)
        setDeleteConfig(null)
        toast.error(`ลบส่วน "${title}" เรียบร้อยแล้ว`)
      },
    })
  }

  const handleCreateLesson = (type: string, baseTitle: string) => {
    if (!activeModuleKey) return

    setIsAddLessonOpen(false)

    const currentModule = modules.find((m) => m._key === activeModuleKey)
    if (!currentModule) return

    const existingCount =
      currentModule.lessons?.filter((l: any) => l.lessonType === type).length || 0
    const nextNumber = existingCount + 1
    const newTitle = `${baseTitle} ${nextNumber}`

    const newLesson: any = {
      _key: generateTempId(),
      title: newTitle,
      lessonType: type,
      isFree: false,
      isNew: true,
    }

    setModules(
      modules.map((mod) => {
        if (mod._key === activeModuleKey)
          return { ...mod, lessons: [...(mod.lessons || []), newLesson] }
        return mod
      }),
    )
    if (!expandedItems.includes(activeModuleKey)) setExpandedItems((p) => [...p, activeModuleKey])
    onSelectLesson(newLesson)
    setIsDirty(true)
    toast.success(`สร้าง "${newLesson.title}" แล้ว`)
  }

  const triggerDeleteLesson = (moduleKey: string, lessonKey: string, title: string) => {
    setDeleteConfig({
      isOpen: true,
      title: 'ยืนยันการลบบทเรียน?',
      description: `คุณต้องการลบบทเรียน "${title}" ใช่หรือไม่? ข้อมูลเนื้อหาภายในบทเรียนนี้จะหายไปถาวร`,
      onConfirm: () => {
        setModules(
          modules.map((mod) => {
            if (mod._key === moduleKey)
              return { ...mod, lessons: mod.lessons.filter((l: any) => l._key !== lessonKey) }
            return mod
          }),
        )
        setIsDirty(true)
        setDeleteConfig(null)
        toast.error(`ลบบทเรียน "${title}" แล้ว`)
      },
    })
  }

  // --- Handlers: Resources ---
  const handleAddResource = () => {
    if (!newResourceData.title.trim() || !newResourceData.url.trim())
      return toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
    if (setResources) {
      const newResource = {
        _key: crypto.randomUUID(),
        title: newResourceData.title,
        fileUrl: newResourceData.url,
        fileType: newResourceData.type,
      }
      setResources([...(resources || []), newResource])
      setNewResourceData({ title: '', url: '', type: 'link' })
      setIsAddResourceOpen(false)
      setIsDirty(true)
      toast.success('เพิ่มเอกสารประกอบแล้ว')
    } else {
      toast.error('ไม่สามารถบันทึกได้')
    }
  }

  const triggerDeleteResource = (key: string, title: string) => {
    setDeleteConfig({
      isOpen: true,
      title: 'ยืนยันการลบไฟล์?',
      description: `คุณต้องการลบไฟล์ "${title}" ออกจากหลักสูตรใช่หรือไม่?`,
      onConfirm: () => {
        if (setResources) setResources(safeResources.filter((r: any) => r._key !== key))
        setIsDirty(true)
        setDeleteConfig(null)
        toast.error(`ลบไฟล์ "${title}" แล้ว`)
      },
    })
  }

  // --- Drag & Drop Logic ---
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setIsDirty(true)

    // 1. สำหรับลาก Module
    if (active.data.current?.type === 'module') {
      const oldIdx = modules.findIndex((m) => m._key === active.id)
      const newIdx = modules.findIndex((m) => m._key === over.id)
      setModules(arrayMove(modules, oldIdx, newIdx))

      // 2. สำหรับลาก Lesson
    } else if (active.data.current?.type === 'lesson') {
      const activeId = active.id as string
      const overId = over.id as string
      let sourceModIdx = -1,
        destModIdx = -1,
        lessonToMove: any = null

      modules.forEach((mod, idx) => {
        const found = mod.lessons?.find((l: any) => l._key === activeId)
        if (found) {
          sourceModIdx = idx
          lessonToMove = found
        }
        if (mod._key === overId || mod.lessons?.some((l: any) => l._key === overId)) {
          destModIdx = idx
        }
      })

      if (sourceModIdx !== -1 && destModIdx !== -1) {
        const newModules = [...modules]
        newModules[sourceModIdx].lessons = newModules[sourceModIdx].lessons.filter(
          (l: any) => l._key !== activeId,
        )
        const destLessons = [...(newModules[destModIdx].lessons || [])]
        const overIdx = destLessons.findIndex((l) => l._key === overId)
        destLessons.splice(overIdx >= 0 ? overIdx : destLessons.length, 0, lessonToMove)
        newModules[destModIdx].lessons = destLessons
        setModules(newModules)
      }
    }

    // 3. สำหรับลาก Resource
    else if (active.data.current?.type === 'resource' && setResources && resources) {
      const oldIdx = resources.findIndex((r: any) => r._key === active.id)
      const newIdx = resources.findIndex((r: any) => r._key === over.id)

      if (oldIdx !== -1 && newIdx !== -1) {
        setResources(arrayMove(resources, oldIdx, newIdx))
      }
    }
  }

  if (!isMounted) return null

  return (
    <div className='flex h-full flex-col'>
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setLocalActiveTab(v)
          propSetActiveTab?.(v)
        }}
        className='flex h-full flex-col'
      >
        <div className='border-b bg-white px-4 pt-4'>
          <TabsList className='grid h-12 w-full grid-cols-2 rounded-none border-b bg-slate-50/50 p-0 group-data-[collapsible=icon]:hidden'>
            <TabsTrigger
              value='content'
              className='hover:text-primary hover:border-b-primary data-[state=active]:text-primary data-[state=active]:border-b-primary cursor-pointer rounded-none transition-all duration-300 ease-in-out'
            >
              เนื้อหาบทเรียน
            </TabsTrigger>

            <TabsTrigger
              value='resources'
              className='hover:text-primary hover:border-b-primary data-[state=active]:text-primary data-[state=active]:border-b-primary cursor-pointer rounded-none transition-all duration-300 ease-in-out'
            >
              เอกสารประกอบ
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ================= TAB: CONTENT ================= */}
        <TabsContent
          value='content'
          className='mt-0 flex flex-1 flex-col overflow-hidden data-[state=active]:flex'
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className='flex items-center justify-between px-4 py-3'>
              <h2 className='text-sm'>โครงสร้างหลักสูตร</h2>
            </div>

            <div className='scrollbar-thin flex-1 overflow-y-auto p-3'>
              <Accordion
                type='multiple'
                value={expandedItems}
                onValueChange={setExpandedItems}
                className='space-y-3'
              >
                <SortableContext
                  items={modules.map((m) => m._key)}
                  strategy={verticalListSortingStrategy}
                >
                  {modules.map((module: any, index: number) => (
                    <SortableModule
                      key={module._key}
                      module={module}
                      index={index}
                      onToggle={() =>
                        setExpandedItems((prev) =>
                          prev.includes(module._key)
                            ? prev.filter((k) => k !== module._key)
                            : [...prev, module._key],
                        )
                      }
                      onRename={(k: any, t: any) => {
                        setRenameModuleData({ key: k, title: t })
                        setIsRenameModuleOpen(true)
                      }}
                      onDelete={(key: any, title: any) => triggerDeleteModule(key, title)}
                      onOpenMenu={(k: any) => {
                        setActiveModuleKey(k)
                        setIsAddLessonOpen(true)
                      }}
                    >
                      <SortableContext
                        items={module.lessons?.map((l: any) => l._key) || []}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className='space-y-0.5'>
                          {module.lessons?.map((lesson: any) => {
                            return (
                              <SortableLesson
                                key={lesson._key}
                                lesson={lesson}
                                selectedLessonKey={selectedLessonKey}
                                onSelect={onSelectLesson}
                                onDelete={(lid: any, ltitle: any) =>
                                  triggerDeleteLesson(module._key, lid, ltitle)
                                }
                              />
                            )
                          })}
                        </div>
                      </SortableContext>
                      {(!module.lessons || module.lessons.length === 0) && (
                        <div className='border-t border-dashed p-6 text-center'>
                          <p className='mb-3 text-xs text-slate-400 italic'>
                            ยังไม่มีหัวข้อในบทเรียนนี้
                          </p>
                        </div>
                      )}
                    </SortableModule>
                  ))}
                </SortableContext>
              </Accordion>
              <Button
                variant='outline'
                className='mt-4 h-12 w-full border-2'
                onClick={() => setIsAddModuleOpen(true)}
              >
                <Plus className='h-4 w-4' /> เพิ่มบทเรียน
              </Button>
            </div>
          </DndContext>
        </TabsContent>

        {/* ================= TAB: RESOURCES ================= */}
        <TabsContent
          value='resources'
          className='mt-0 flex flex-1 flex-col overflow-hidden data-[state=active]:flex'
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className='flex items-center justify-between px-4 py-3'>
              <h2 className='text-sm'>เอกสารประกอบหลักสูตร</h2>
            </div>
            <div className='scrollbar-thin flex-1 overflow-y-auto p-3'>
              {safeResources.length > 0 ? (
                <SortableContext
                  items={safeResources.map((r: any) => r._key)}
                  strategy={verticalListSortingStrategy}
                >
                  {safeResources.map((resource: any) => (
                    <SortableResource
                      key={resource._key}
                      resource={resource}
                      onDelete={(key: any, title: any) => triggerDeleteResource(key, title)}
                    />
                  ))}
                </SortableContext>
              ) : (
                <div className='flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-slate-50/50 px-4 py-12 text-slate-400'>
                  <File className='mb-2 h-8 w-8 opacity-20' />
                  <p className='text-xs'>ยังไม่มีเอกสารประกอบหลักสูตร</p>
                </div>
              )}
              <Button
                variant='outline'
                className='mt-4 h-12 w-full border-2'
                onClick={() => setIsAddResourceOpen(true)}
              >
                <Plus className='mr-2 h-4 w-4' /> เพิ่มเอกสาร / ลิงก์ใหม่
              </Button>
            </div>
          </DndContext>
        </TabsContent>
      </Tabs>

      {/* --- Dialog: Add Module --- */}
      <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-2xl font-medium'>เพิ่มบทเรียนใหม่</DialogTitle>
            <DialogDescription className='font-normal'>
              ระบุชื่อบทเรียนเพื่อสร้างส่วนเนื้อหาใหม่ในหลักสูตรของคุณ
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label>ชื่อบทเรียน</Label>
              <Input
                value={newModuleName}
                onChange={(e) => setNewModuleName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline-muted' onClick={() => setIsAddModuleOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAddModule} className='bg-blue-600 hover:bg-blue-700'>
              สร้างบทเรียนใหม่
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Dialog: Rename Module --- */}
      <Dialog open={isRenameModuleOpen} onOpenChange={setIsRenameModuleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-2xl font-medium'>แก้ไขชื่อบทเรียน</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <Input
              value={renameModuleData.title}
              onChange={(e) => setRenameModuleData((p) => ({ ...p, title: e.target.value }))}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant='outline-muted' onClick={() => setIsRenameModuleOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleRenameModule}>บันทึกการแก้ไข</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Dialog: Add Lesson --- */}
      <Dialog open={isAddLessonOpen} onOpenChange={setIsAddLessonOpen}>
        <DialogContent className='sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-medium'>เลือกประเภทบทเรียน</DialogTitle>
            <DialogDescription className='font-normal'>
              รูปแบบเนื้อหาที่คุณเลือกจะกำหนดเครื่องมือในการสร้างบทเรียนของคุณ
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-6 py-4'>
            <div className='space-y-3'>
              <h3 className='text-sm font-medium'>รูปแบบการเรียนรู้</h3>
              <div className='grid grid-cols-2 gap-4'>
                <button
                  onClick={() => handleCreateLesson('article', 'บทเรียนเนื้อหา')}
                  className='border-muted group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 transition-all hover:border-blue-500 hover:bg-blue-50'
                >
                  <FileText className='mb-3 h-8 w-8 text-slate-400 group-hover:text-blue-500' />
                  <span className='text-sm font-normal text-slate-700 group-hover:text-blue-700'>
                    บทเรียนเนื้อหา
                  </span>
                </button>
                <button
                  onClick={() => handleCreateLesson('video', 'บทเรียนวิดีโอ')}
                  className='border-muted group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 transition-all hover:border-blue-500 hover:bg-blue-50'
                >
                  <Video className='mb-3 h-8 w-8 text-slate-400 group-hover:text-blue-500' />
                  <span className='text-sm font-normal text-slate-700 group-hover:text-blue-700'>
                    บทเรียนวิดีโอ
                  </span>
                </button>
              </div>
            </div>
            <div className='space-y-3'>
              <h3 className='text-sm font-medium'>แบบฝึกหัด</h3>
              <div className='grid grid-cols-2 gap-4'>
                <button
                  onClick={() => handleCreateLesson('exercise', 'แบบฝึกหัด')}
                  className='border-muted group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 transition-all hover:border-blue-500 hover:bg-blue-50'
                >
                  <PenTool className='mb-3 h-8 w-8 text-slate-400 group-hover:text-blue-500' />
                  <span className='text-sm font-normal text-slate-700 group-hover:text-blue-700'>
                    แบบฝึกหัด
                  </span>
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- Shared AlertDialog for Deletion --- */}
      <AlertDialog open={!!deleteConfig?.isOpen} onOpenChange={(v) => !v && setDeleteConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='font-bold text-red-600'>
              {deleteConfig?.title}
            </AlertDialogTitle>
            <AlertDialogDescription className='leading-relaxed'>
              {deleteConfig?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='rounded-lg'>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteConfig?.onConfirm}
              className='rounded-lg bg-red-600 hover:bg-red-700'
            >
              ยืนยันการลบทิ้ง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- Dialog: Add Resource --- */}
      <Dialog open={isAddResourceOpen} onOpenChange={setIsAddResourceOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-medium'>เพิ่มเอกสารประกอบ</DialogTitle>
            <DialogDescription className='font-normal'>
              เลือกประเภทไฟล์และระบุลิงก์สำหรับการดาวน์โหลด
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {/* ส่วนเลือกประเภทด้วย Select */}
            <div className='space-y-2'>
              <Label>ประเภทไฟล์</Label>
              <Select
                value={newResourceData.type}
                onValueChange={(value) => setNewResourceData((p) => ({ ...p, type: value }))}
              >
                <SelectTrigger className='h-12 w-full'>
                  <SelectValue placeholder='เลือกประเภทไฟล์' />
                </SelectTrigger>
                <SelectContent>
                  {ALL_RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id} className='cursor-pointer'>
                      <div className='flex items-center gap-3'>
                        <img src={type.icon} alt={type.label} className='h-5 w-5 object-contain' />
                        <span className='font-normal text-slate-700'>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>ชื่อไฟล์</Label>
              <Input
                value={newResourceData.title}
                onChange={(e) => setNewResourceData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className='space-y-2'>
              <Label>ลิงก์ URL</Label>
              <Input
                value={newResourceData.url}
                onChange={(e) => setNewResourceData((p) => ({ ...p, url: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline-muted' onClick={() => setIsAddResourceOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleAddResource}
              className='bg-blue-600 hover:bg-blue-700'
              disabled={!newResourceData.title || !newResourceData.url}
            >
              เพิ่มเอกสาร
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
