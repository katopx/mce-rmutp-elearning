'use client'

import imageCompression from 'browser-image-compression'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Dropzone, DropZoneArea, DropzoneTrigger, useDropzone } from '@/components/ui/dropzone'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '@/components/ui/multi-select'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { checkSlugAction, updateCourseAction } from '@/lib/sanity/course-actions'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import {
  BookOpen,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  UploadCloud,
  Users,
  XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

// Interface Props
interface CourseSettingsProps {
  courseId: string
  initialData: any
  metadata: {
    categories: any[]
    instructors: any[]
  }
  onSuccess: (updatedData: any) => void
}

export default function CourseSettingsForm({
  courseId,
  initialData,
  metadata,
  onSuccess,
}: CourseSettingsProps) {
  const router = useRouter()

  // --- States ---
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || '')
  const [totalDuration, setTotalDuration] = useState(initialData?.totalDuration || '')
  const [objectives, setObjectives] = useState<string[]>(initialData?.objectives || [''])

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(initialData?.image || null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const isEditingImage = useRef(false)

  // Sync Initial Data
  useEffect(() => {
    setTitle(initialData?.title || '')
    setSlug(initialData?.slug || '')
    setShortDescription(initialData?.shortDescription || '')
    setDescription(initialData?.description || '')
    setDifficulty(initialData?.difficulty || '')
    setTotalDuration(initialData?.totalDuration || '')
    setObjectives(initialData?.objectives || [''])

    if (!isEditingImage.current) {
      setCurrentImageUrl(initialData?.image || null)
      setImageFile(null)
    }

    setSelectedCategories(initialData?.categoryIds || [])
    setSelectedCoInstructors(initialData?.coInstructorIds || [])
  }, [initialData])

  // Categories & Instructors
  const [categories, setCategories] = useState(metadata.categories || [])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.categoryIds || [],
  )
  const instructorId = initialData?.instructorId
  const [selectedCoInstructors, setSelectedCoInstructors] = useState<string[]>(
    initialData?.coInstructorIds || [],
  )

  // UI States
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressingImage, setIsCompressingImage] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryData, setNewCategoryData] = useState({
    title: '',
    description: '',
    color: '#3b82f6',
    icon: 'Tag',
  })
  const [pendingNewCategories, setPendingNewCategories] = useState<any[]>([])

  // Dirty Check
  const isDirty = useMemo(() => {
    const hasChanged =
      title !== initialData?.title ||
      slug !== initialData?.slug ||
      shortDescription !== (initialData?.shortDescription || '') ||
      description !== (initialData?.description || '') ||
      difficulty !== initialData?.difficulty ||
      totalDuration !== initialData?.totalDuration ||
      JSON.stringify(objectives) !== JSON.stringify(initialData?.objectives || []) ||
      JSON.stringify(selectedCategories) !== JSON.stringify(initialData?.categoryIds || []) ||
      JSON.stringify(selectedCoInstructors) !==
        JSON.stringify(initialData?.coInstructorIds || []) ||
      imageFile !== null ||
      (currentImageUrl === null && initialData?.image !== null)

    return hasChanged
  }, [
    title,
    slug,
    shortDescription,
    description,
    difficulty,
    totalDuration,
    objectives,
    selectedCategories,
    selectedCoInstructors,
    imageFile,
    currentImageUrl,
    initialData,
  ])

  // --- Handlers ---
  const handleSlugChange = (val: string) => {
    setTitle(val)
    const formatted = val
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙\s-]/gi, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-|-$/g, '')
    setSlug(formatted)
    setSlugAvailable(null)
  }
  const handleManualSlugChange = (val: string) => {
    const formatted = val
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙\s-]/gi, '')
      .replace(/\s/g, '-')
      .replace(/-+/g, '-')
    setSlug(formatted)
    setSlugAvailable(formatted === initialData?.slug ? true : null)
  }
  const handleCheckSlug = async () => {
    if (!slug.trim() || slug === initialData?.slug) return
    setIsCheckingSlug(true)
    const result = await checkSlugAction(slug, courseId)
    setSlugAvailable(result.isAvailable)
    setIsCheckingSlug(false)
    result.isAvailable ? toast.success('Slug นี้ใช้งานได้') : toast.error('Slug นี้ถูกใช้งานแล้ว')
  }
  const addObjective = () => setObjectives([...objectives, ''])
  const removeObjective = (index: number) => setObjectives(objectives.filter((_, i) => i !== index))
  const updateObjective = (index: number, val: string) => {
    const newObj = [...objectives]
    newObj[index] = val
    setObjectives(newObj)
  }
  const handleAddCategory = () => {
    if (!newCategoryData.title.trim()) return toast.error('กรุณาระบุชื่อหมวดหมู่')
    const tempId = `new-${Date.now()}`
    const newCatObj = {
      ...newCategoryData,
      tempId,
      title: newCategoryData.title,
      description: newCategoryData.description,
      color: newCategoryData.color,
      icon: newCategoryData.icon,
    }
    setCategories((prev) => [...prev, { value: tempId, label: newCategoryData.title }])
    setSelectedCategories((prev) => [...prev, tempId])
    setPendingNewCategories((prev) => [...prev, newCatObj])
    setNewCategoryData({ title: '', description: '', color: '#3b82f6', icon: 'Tag' })
    setIsCategoryModalOpen(false)
    toast.success(`เพิ่มหมวดหมู่ใหม่ "${newCatObj.title}" แล้ว`)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('กรุณากรอกชื่อหลักสูตร')
    if (!slug.trim()) return toast.error('กรุณากรอก Slug')
    if (slug !== initialData?.slug && slugAvailable === false)
      return toast.error('Slug ซ้ำ กรุณาเปลี่ยนใหม่')
    if (!shortDescription.trim()) return toast.error('กรุณากรอกคำอธิบายหลักสูตร (ฉบับย่อ)')
    if (selectedCategories.length === 0) return toast.error('กรุณาเลือกอย่างน้อย 1 หมวดหมู่')
    if (!difficulty) return toast.error('กรุณาเลือกระดับความยากของหลักสูตร')
    if (!currentImageUrl && !imageFile) return toast.error('กรุณาอัปโหลดภาพหน้าปกหลักสูตร')

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('slug', slug)
      formData.append('shortDescription', shortDescription)
      formData.append('description', description)
      formData.append('difficulty', difficulty)
      formData.append('totalDuration', totalDuration)
      formData.append('objectives', JSON.stringify(objectives.filter((o) => o.trim() !== '')))
      formData.append('instructorId', instructorId)
      formData.append('coInstructorIds', JSON.stringify(selectedCoInstructors))
      const existingCatIds = selectedCategories.filter((id) => !id.startsWith('new-'))
      formData.append('categoryIds', JSON.stringify(existingCatIds))
      const newCats = pendingNewCategories.filter((cat) => selectedCategories.includes(cat.tempId))
      formData.append('newCategories', JSON.stringify(newCats))
      if (imageFile) formData.append('image', imageFile)

      const result = await updateCourseAction(courseId, formData)

      if (result.success) {
        toast.success('บันทึกข้อมูลเรียบร้อย!')
        isEditingImage.current = false
        const updatedData = {
          title,
          slug,
          shortDescription,
          description,
          difficulty,
          totalDuration,
          objectives,
          categoryIds: selectedCategories,
          coInstructorIds: selectedCoInstructors,
          image: imageFile ? URL.createObjectURL(imageFile) : currentImageUrl,
        }
        onSuccess(updatedData)
        setImageFile(null)
        router.refresh()
      } else {
        toast.error('บันทึกไม่สำเร็จ', { description: result.error })
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Dropzone Logic ---
  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      if (isSubmitting) return { status: 'error', error: 'กำลังบันทึกข้อมูล' }
      setIsCompressingImage(true)
      isEditingImage.current = true
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp',
        }
        let compressedFile = file
        try {
          compressedFile = await imageCompression(file, options)
        } catch (error) {
          console.warn('Compression failed, using original file', error)
        }
        const preview = URL.createObjectURL(compressedFile)
        setImageFile(compressedFile)
        setCurrentImageUrl(preview)
        return { status: 'success', result: preview }
      } catch (error) {
        toast.error('เกิดข้อผิดพลาดในการประมวลผลไฟล์')
        return { status: 'error', error: 'File error' }
      } finally {
        setIsCompressingImage(false)
      }
    },
    validation: {
      accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
      maxSize: 5 * 1024 * 1024,
      maxFiles: 1,
    },
  })

  const handleRevertImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isSubmitting) return
    setImageFile(null)
    setCurrentImageUrl(initialData?.image || null)
    isEditingImage.current = false
    toast.info('ใช้รูปภาพเดิมแล้ว')
  }

  const IconRenderer = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (Icons as any)[name] || Icons.HelpCircle
    return <IconComponent className={className} />
  }

  const SUGGESTED_ICONS = [
    'Tag',
    'Cpu',
    'Zap',
    'Book',
    'Settings',
    'Monitor',
    'Database',
    'Shield',
    'Globe',
    'Layout',
  ]

  // --- RENDER ---
  return (
    <div className='mx-auto w-full max-w-3xl px-0 py-0 pb-20 leading-normal md:py-6'>
      {/* Header Section */}
      <div className='mb-6 hidden items-center justify-between md:flex'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>ตั้งค่าหลักสูตร</h1>
          <p className='text-muted-foreground text-sm'>
            จัดการข้อมูลพื้นฐาน รายละเอียด และผู้สอนของหลักสูตร
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !isDirty}
          className='bg-blue-600 px-6 hover:bg-blue-700'
        >
          {isSubmitting ? (
            <Loader2 className='mr-2 size-4 animate-spin' />
          ) : (
            <Save className='mr-2 size-4' />
          )}
          บันทึกการเปลี่ยนแปลง
        </Button>
      </div>

      <Tabs defaultValue='general' className='w-full'>
        {/* Sticky Tabs Header */}
        <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 w-full backdrop-blur md:static md:bg-transparent'>
          <TabsList className='grid h-12 w-full grid-cols-3 rounded-none md:w-auto md:rounded-lg md:border'>
            <TabsTrigger value='general' className='flex items-center gap-2 text-xs md:text-sm'>
              <LayoutDashboard className='size-4' />
              <span className='md:inline'>ข้อมูลทั่วไป</span>
            </TabsTrigger>
            <TabsTrigger value='content' className='flex items-center gap-2 text-xs md:text-sm'>
              <FileText className='size-4' />
              <span className='md:inline'>รายละเอียด</span>
            </TabsTrigger>
            <TabsTrigger value='instructors' className='flex items-center gap-2 text-xs md:text-sm'>
              <Users className='size-4' />
              <span className='md:inline'>ผู้สอน</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className='mt-6 px-4 md:px-0'>
          {/* TAB 1: GENERAL */}
          <TabsContent value='general' className='mt-0 space-y-6'>
            {/* 1. Basic Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>ข้อมูลพื้นฐาน</CardTitle>
                <CardDescription>รายละเอียดหลักของหลักสูตร</CardDescription>
              </CardHeader>
              <CardContent className='space-y-5'>
                <div className='space-y-2'>
                  <Label>
                    ชื่อหลักสูตร <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    value={title}
                    disabled={isSubmitting}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder='ใส่ชื่อหลักสูตร (ภาษาอังกฤษหรือไทย)'
                    className='h-10'
                  />
                </div>

                <div className='space-y-2'>
                  <div className='flex flex-wrap items-center gap-1.5 text-xs'>
                    <span className='font-medium uppercase'>URL:</span>
                    <span className='text-muted-foreground truncate'>
                      .../courses/<span className='text-foreground font-medium'>{slug}</span>
                    </span>
                  </div>
                  <div className='flex gap-2'>
                    <Input
                      value={slug}
                      disabled={isSubmitting}
                      onChange={(e) => handleManualSlugChange(e.target.value)}
                      className={cn(
                        'h-10',
                        slugAvailable === true ? 'border-green-500 bg-green-50/10' : '',
                      )}
                    />
                    <Button
                      variant='outline'
                      onClick={handleCheckSlug}
                      disabled={isCheckingSlug || !slug || slug === initialData?.slug}
                      className={
                        slugAvailable === true ? 'border-green-200 bg-green-50 text-green-600' : ''
                      }
                    >
                      {isCheckingSlug ? (
                        <Loader2 className='size-4 animate-spin' />
                      ) : slugAvailable === true ? (
                        <>
                          <CheckCircle2 className='mr-1.5 size-4' />
                          <span className='hidden sm:inline'>ใช้งานได้</span>
                        </>
                      ) : (
                        <>
                          <Search className='mr-1.5 size-4' />
                          <span className='hidden sm:inline'>ตรวจสอบ</span>
                          <span className='sm:hidden'>เช็ค</span>
                        </>
                      )}
                    </Button>
                  </div>
                  {slugAvailable === false && (
                    <p className='text-xs text-red-500'>Slug นี้ถูกใช้งานแล้วกรุณาเปลี่ยนใหม่</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 2. Category & Level Card */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>การจัดหมวดหมู่และระดับ</CardTitle>
              </CardHeader>
              <CardContent className='space-y-5'>
                <div className='space-y-2'>
                  <Label>
                    หมวดหมู่ <span className='text-red-500'>*</span>
                  </Label>
                  <div className='flex gap-2'>
                    <div className='flex-1'>
                      <MultiSelect
                        values={selectedCategories}
                        onValuesChange={setSelectedCategories}
                        disabled={isSubmitting}
                      >
                        <MultiSelectTrigger className='min-h-[2.75rem] w-full'>
                          <MultiSelectValue placeholder='เลือกหมวดหมู่' />
                        </MultiSelectTrigger>
                        <MultiSelectContent>
                          <MultiSelectGroup>
                            {categories.map((cat) => (
                              <MultiSelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </MultiSelectItem>
                            ))}
                          </MultiSelectGroup>
                        </MultiSelectContent>
                      </MultiSelect>
                    </div>
                    {/* Add Category Dialog */}
                    <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant='outline' size='icon' className='h-11 w-11 shrink-0'>
                          <Plus className='size-5' />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='sm:max-w-[425px]'>
                        <DialogHeader>
                          <DialogTitle>สร้างหมวดหมู่ใหม่</DialogTitle>
                          <DialogDescription>
                            ระบุข้อมูลหมวดหมู่เพื่อใช้จำแนกหลักสูตร
                          </DialogDescription>
                        </DialogHeader>
                        <div className='grid gap-4 py-4'>
                          <div className='space-y-2'>
                            <Label>ชื่อหมวดหมู่</Label>
                            <Input
                              placeholder='เช่น Automation'
                              value={newCategoryData.title}
                              onChange={(e) =>
                                setNewCategoryData({ ...newCategoryData, title: e.target.value })
                              }
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label>สีประจำหมวดหมู่</Label>
                            <div className='flex items-center gap-3'>
                              <Input
                                type='color'
                                className='h-10 w-20 p-1'
                                value={newCategoryData.color}
                                onChange={(e) =>
                                  setNewCategoryData({
                                    ...newCategoryData,
                                    color: e.target.value,
                                  })
                                }
                              />
                              <span className='text-sm uppercase'>{newCategoryData.color}</span>
                            </div>
                          </div>
                          <div className='space-y-2'>
                            <Label>ไอคอน</Label>
                            <div className='flex flex-wrap gap-2'>
                              {SUGGESTED_ICONS.map((iconName) => (
                                <button
                                  key={iconName}
                                  type='button'
                                  onClick={() =>
                                    setNewCategoryData({ ...newCategoryData, icon: iconName })
                                  }
                                  className={cn(
                                    'flex h-9 w-9 items-center justify-center rounded-md border transition-all',
                                    newCategoryData.icon === iconName
                                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                                      : 'bg-background hover:bg-slate-50',
                                  )}
                                >
                                  <IconRenderer name={iconName} className='size-4' />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handleAddCategory}
                            className='w-full bg-blue-600 hover:bg-blue-700'
                          >
                            บันทึก
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>
                    ระดับความยาก <span className='text-red-500'>*</span>
                  </Label>
                  <Select value={difficulty} onValueChange={setDifficulty} disabled={isSubmitting}>
                    <SelectTrigger className='h-11'>
                      <SelectValue placeholder='เลือกระดับ' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='basic'>ระดับพื้นฐาน</SelectItem>
                      <SelectItem value='intermediate'>ระดับปานกลาง</SelectItem>
                      <SelectItem value='advanced'>ระดับสูง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>
                    คำอธิบายย่อ (แสดงใน การ์ดหน้าแรก) <span className='text-red-500'>*</span>
                  </Label>
                  <Textarea
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    className='min-h-[100px] resize-none'
                    placeholder='อธิบายสั้นๆ เกี่ยวกับหลักสูตร จะแสดงในการ์ดหน้าแรก'
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>ภาพหน้าปก</CardTitle>
                <CardDescription>
                  ภาพที่จะแสดงบนการ์ดหลักสูตร (อัตราส่วน 16:9)
                  <span className='text-red-500'> *</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dropzone {...dropzone}>
                  <DropZoneArea
                    className={cn(
                      'group relative aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200',
                      currentImageUrl
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30',
                      (isSubmitting || isCompressingImage) && 'cursor-wait opacity-80',
                    )}
                  >
                    <DropzoneTrigger className='h-full w-full cursor-pointer outline-none'>
                      {currentImageUrl ? (
                        <div className='relative h-full w-full overflow-hidden'>
                          <img
                            key={currentImageUrl}
                            src={currentImageUrl}
                            alt='Course Cover'
                            className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                          />
                          <div
                            className={cn(
                              'absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 transition-all duration-300',
                              isCompressingImage
                                ? 'bg-white/80 opacity-100'
                                : 'bg-black/60 opacity-0 backdrop-blur-[1px] group-hover:opacity-100',
                            )}
                          >
                            {isCompressingImage ? (
                              <>
                                <Loader2 className='mb-2 h-8 w-8 animate-spin text-blue-600' />
                                <span className='text-sm font-medium text-blue-600'>
                                  กำลังประมวลผล...
                                </span>
                              </>
                            ) : (
                              <>
                                <UploadCloud className='mb-1 h-8 w-8 text-white' />
                                <span className='text-sm font-semibold text-white'>
                                  เปลี่ยนรูปภาพ
                                </span>
                                {initialData?.image && currentImageUrl !== initialData.image && (
                                  <div onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      type='button'
                                      variant='secondary'
                                      size='sm'
                                      onClick={handleRevertImage}
                                      className='pointer-events-auto mt-3 h-8 gap-2 border-0 bg-white/20 text-white backdrop-blur-md hover:bg-white hover:text-slate-900'
                                    >
                                      <Icons.RotateCcw className='h-3.5 w-3.5' />
                                      ใช้รูปภาพเดิม
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className='flex h-full flex-col items-center justify-center text-center'>
                          {isCompressingImage ? (
                            <Loader2 className='mb-3 h-10 w-10 animate-spin text-blue-600' />
                          ) : (
                            <UploadCloud className='mb-3 h-10 w-10 text-slate-300 group-hover:text-blue-500' />
                          )}
                          <p className='text-sm font-medium text-slate-600'>คลิกหรือลากไฟล์มาวาง</p>
                        </div>
                      )}
                    </DropzoneTrigger>
                  </DropZoneArea>
                </Dropzone>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CONTENT */}
          <TabsContent value='content' className='mt-0 space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <BookOpen className='size-5 text-blue-600' /> รายละเอียดหลักสูตร
                </CardTitle>
                <CardDescription>ข้อมูลเชิงลึกที่จะแสดงในหน้ารายละเอียดหลักสูตร</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <Label>คำอธิบายหลักสูตร (ฉบับเต็ม)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className='min-h-[200px] resize-none'
                    disabled={isSubmitting}
                  />
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <Label className='font-medium'>วัตถุประสงค์</Label>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={addObjective}
                      className='text-blue-600 hover:text-blue-700'
                    >
                      <Plus className='mr-1 size-3' /> เพิ่มข้อ
                    </Button>
                  </div>
                  <div className='space-y-2'>
                    {objectives.map((obj, index) => (
                      <div key={index} className='flex gap-2'>
                        <div className='flex h-10 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500'>
                          {index + 1}
                        </div>
                        <Input
                          value={obj}
                          onChange={(e) => updateObjective(index, e.target.value)}
                          placeholder='ระบุวัตถุประสงค์'
                          disabled={isSubmitting}
                        />
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => removeObjective(index)}
                          disabled={objectives.length === 1 || isSubmitting}
                          className='text-slate-400 hover:text-red-500'
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>ระยะเวลาเรียนรวมของหลักสูตร</Label>
                  <div className='relative'>
                    <Input
                      type='time'
                      value={totalDuration}
                      onChange={(e) => setTotalDuration(e.target.value)}
                      className='pl-10'
                    />
                    <Icons.Clock className='absolute top-3 left-3 size-4 text-slate-400' />
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    ระบุเป็น ชั่วโมง:นาที (เช่น 02:30) ถ้าไม่ระบุจะไม่กำหนดระยะเวลา
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: INSTRUCTORS */}
          <TabsContent value='instructors' className='mt-0 space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <Users className='size-5 text-blue-600' />
                  รายการผู้สอน
                </CardTitle>
                <CardDescription>จัดการผู้ที่มีสิทธิ์จัดการเนื้อหาหลักสูตรนี้</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-2'>
                  <Label className='text-slate-500'>ผู้สอนหลัก</Label>
                  <div className='bg-muted/30 flex items-center gap-3 rounded-lg border p-3'>
                    <div className='flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-700'>
                      <Icons.User className='size-5' />
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium'>
                        {metadata.instructors.find((i) => i.value === instructorId)?.label ||
                          'ไม่พบข้อมูล'}
                      </p>
                      <p className='text-muted-foreground text-xs'>เจ้าของหลักสูตร</p>
                    </div>
                    <Icons.Lock className='size-4 text-slate-400' />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>ผู้สอนร่วม</Label>
                  <MultiSelect
                    values={selectedCoInstructors}
                    onValuesChange={setSelectedCoInstructors}
                    disabled={isSubmitting}
                  >
                    <MultiSelectTrigger className='min-h-[2.75rem] w-full'>
                      <MultiSelectValue placeholder='เลือกผู้สอนร่วม...' />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      <MultiSelectGroup>
                        {metadata.instructors
                          .filter((i) => i.value !== initialData?.instructorId)
                          .map((i) => (
                            <MultiSelectItem key={i.value} value={i.value}>
                              {i.label}
                            </MultiSelectItem>
                          ))}
                      </MultiSelectGroup>
                    </MultiSelectContent>
                  </MultiSelect>
                  <p className='text-muted-foreground text-xs'>
                    ผู้สอนร่วมจะสามารถแก้ไขเนื้อหาหลักสูตรได้ แต่ลบหลักสูตรไม่ได้
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Sticky Mobile Footer Action */}
      <div className='bg-background/80 fixed right-0 bottom-0 left-0 z-50 border-t p-4 backdrop-blur-md md:hidden'>
        <Button
          size='lg'
          onClick={handleSubmit}
          disabled={isSubmitting || !isDirty}
          className='w-full bg-blue-600 shadow-lg hover:bg-blue-700'
        >
          {isSubmitting ? (
            <Loader2 className='mr-2 size-4 animate-spin' />
          ) : (
            <Save className='mr-2 size-4' />
          )}
          บันทึกการเปลี่ยนแปลง
        </Button>
      </div>
    </div>
  )
}
