'use client'
import imageCompression from 'browser-image-compression'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { checkSlugAction, updateCourseAction } from '@/lib/sanity/course-actions'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import {
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
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

  // --- States (ตั้งค่าเริ่มต้นจาก Props ทันที) ---
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || '')
  const [totalDuration, setTotalDuration] = useState(initialData?.totalDuration || '')
  const [objectives, setObjectives] = useState<string[]>(initialData?.objectives || [''])

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(initialData?.image || null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  // หมวดหมู่ (ใช้ฟิลด์ categoryIds ที่ Page ส่งมา)
  const [categories, setCategories] = useState(metadata.categories || [])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.categoryIds || [],
  )

  // ผู้สอน (แยก instructorId หลัก และ coInstructorIds)
  const instructorId = initialData?.instructorId // ผู้สอนหลัก (Lock ไว้)
  const [selectedCoInstructors, setSelectedCoInstructors] = useState<string[]>(
    initialData?.coInstructorIds || [],
  )

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

  // --- Logic: Dirty Check (เช็คว่ามีการเปลี่ยนแปลงหรือไม่) ---
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
      imageFile !== null

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
    toast.success(`เพิ่มหมวดหมู่ใหม่ "${newCatObj.title}" ในรายการชั่วคราวแล้ว`)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !slug.trim()) return toast.error('กรุณากรอกชื่อหลักสูตร')
    if (!slug.trim()) return toast.error('กรุณากรอก Slug')
    if (slug !== initialData?.slug && slugAvailable !== true)
      return toast.error('กรุณาตรวจสอบ Slug')
    if (!shortDescription.trim()) return toast.error('กรุณากรอกคำอธิบายหลักสูตร')
    if (!description.trim()) return toast.error('กรุณากรอกคำอธิบายหลักสูตร')
    if (!objectives.some((o) => o.trim() !== ''))
      return toast.error('กรุณาระบุวัตถุประสงค์อย่างน้อย 1 ข้อ')
    if (selectedCategories.length === 0) return toast.error('กรุณาเลือกอย่างน้อย 1 หมวดหมู่')
    if (!difficulty) return toast.error('กรุณาเลือกระดับความยากของหลักสูตร')
    if (!currentImageUrl && !imageFile) return toast.error('กรุณาอัปโหลดรูปภาพหน้าปกหลักสูตร')

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
        toast.success('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว!')
        // แจ้งแม่ให้อัปเดต UI ส่วนอื่นๆ (Header/Sidebar)
        onSuccess({
          title,
          slug,
          shortDescription,
          description,
          difficulty,
          totalDuration,
          objectives,
          categoryIds: selectedCategories,
          instructorId,
          coInstructorIds: selectedCoInstructors,
          image: currentImageUrl,
        })
        setImageFile(null)
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
      // ✅ ป้องกันการ Upload ขณะบันทึก
      if (isSubmitting) return { status: 'error', error: 'กำลังบันทึกข้อมูล กรุณารอสักครู่' }

      setIsCompressingImage(true) // เริ่มบีบอัด

      try {
        // ตั้งค่าการบีบอัด
        const options = {
          maxSizeMB: 0.9,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp',
        }
        // บีบอัด
        const compressedFile = await imageCompression(file, options)

        // สร้าง Preview และ Set State
        const preview = URL.createObjectURL(compressedFile)
        setImageFile(compressedFile)
        setCurrentImageUrl(preview)

        return { status: 'success', result: preview }
      } catch (error) {
        console.error('Compression Failed:', error)
        return { status: 'error', error: 'ไม่สามารถบีบอัดรูปภาพได้' }
      } finally {
        setIsCompressingImage(false) // จบบีบอัด
      }
    },
    validation: {
      accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
      maxSize: 5 * 1024 * 1024, // รับไฟล์ใหญ่ได้ (เพราะจะบีบอัด)
      maxFiles: 1,
    },
  })

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isSubmitting) return

    setImageFile(null)
    setCurrentImageUrl(null)
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

  return (
    <div className='mx-auto max-w-2xl px-4 py-8 leading-normal'>
      <div className='bg-card overflow-hidden rounded-xl border shadow-sm'>
        <header className='bg-muted/30 border-b p-6'>
          <h1 className='text-foreground text-xl font-semibold'>รายละเอียดหลักสูตร</h1>
          <p className='text-muted-foreground text-sm'>แก้ไขข้อมูลพื้นฐานของหลักสูตร</p>
        </header>

        <div className='space-y-6 p-6'>
          {/* ชื่อหลักสูตร */}
          <div className='space-y-2'>
            <Label className='font-medium'>ชื่อหลักสูตร</Label>
            <Input
              value={title}
              disabled={isSubmitting}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder='ใส่ชื่อหลักสูตร (ภาษาอังกฤษหรือไทย)'
            />
          </div>

          {/* URL Slug */}
          <div className='space-y-2'>
            <div className='flex items-center gap-1.5 text-xs'>
              <span className='font-medium uppercase'>URL:</span>
              <span>
                .../courses/<span>{slug || 'your-slug'}</span>
              </span>
              {slugAvailable === true && (
                <span className='flex items-center text-green-600'>
                  <CheckCircle2 className='mr-1 h-3 w-3' /> สามารถใช้งานได้
                </span>
              )}
              {slugAvailable === false && (
                <span className='flex items-center text-red-600'>
                  <XCircle className='mr-1 h-3 w-3' /> ซ้ำ! ไม่สามารถใช้งานได้
                </span>
              )}
            </div>
            <div className='flex gap-2'>
              <Input
                placeholder='ใส่ชื่อ slug'
                value={slug}
                disabled={isSubmitting}
                onChange={(e) => handleManualSlugChange(e.target.value)}
                className={slugAvailable === true ? 'border-green-500 bg-green-50/10' : ''}
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
                    <CheckCircle2 className='mr-1.5 size-4' /> ใช้งานได้
                  </>
                ) : (
                  <>
                    <Search className='mr-1.5 size-4' /> ตรวจสอบ
                  </>
                )}
              </Button>
            </div>
            {slugAvailable === false && (
              <p className='text-xs text-red-500'>
                Slug นี้ถูกใช้งานแล้วกรุณาเปลี่ยนชื่อ Slug ใหม่
              </p>
            )}
          </div>

          {/* คำอธิบาย */}
          <div className='space-y-4'>
            {/* คำอธิบายหลักสูตร (ฉบับย่อ) */}
            <div className='space-y-2'>
              <Label className='font-medium'>คำอธิบายหลักสูตร (ฉบับย่อ)</Label>
              <Textarea
                placeholder='อธิบายรายละเอียดเกี่ยวกับหลักสูตรนี้สั้นๆ เพื่อดึงดูดความสนใจจากผู้เรียน'
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className='min-h-[100px] resize-none'
                disabled={isSubmitting}
              />
            </div>
            <div className='space-y-2'>
              <Label className='font-medium'>คำอธิบายเต็ม</Label>
              <Textarea
                placeholder='แสดงในหน้ารายละเอียดหลักสูตร'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='min-h-[120px]'
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* วัตถุประสงค์ */}
          <div className='space-y-3'>
            <Label className='font-medium'>วัตถุประสงค์</Label>
            {objectives.map((obj, index) => (
              <div key={index} className='flex gap-2'>
                <Input
                  value={obj}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  placeholder={`ข้อที่ ${index + 1}`}
                  disabled={isSubmitting}
                />
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => removeObjective(index)}
                  disabled={objectives.length === 1 || isSubmitting}
                >
                  <Trash2 className='size-4 text-red-500' />
                </Button>
              </div>
            ))}
            <Button
              variant='outline'
              size='sm'
              onClick={addObjective}
              disabled={isSubmitting}
              className='w-full'
            >
              <Plus className='mr-2 size-4' /> เพิ่มวัตถุประสงค์
            </Button>
          </div>

          {/* ผู้สอน */}
          <div className='grid w-full grid-cols-2 gap-4'>
            {/* ผู้สอนหลัก */}
            <div className='col-span-1 space-y-2'>
              <Label className='text-slate-500'>ผู้สอนหลัก</Label>
              <div className='relative'>
                <Input
                  value={
                    metadata.instructors.find((i) => i.value === instructorId)?.label ||
                    'ไม่พบข้อมูล'
                  }
                  disabled
                  className='bg-slate-50'
                />
                <Icons.Lock className='absolute top-2.5 right-3 h-4 w-4 text-slate-400' />
              </div>
              <p className='text-[10px] text-slate-400 italic'>* ผู้สร้างหลักสูตร</p>
            </div>

            {/* ผู้สอนร่วม */}
            <div className='col-span-1 space-y-2'>
              <Label>ผู้สอนร่วม</Label>
              <MultiSelect
                values={selectedCoInstructors}
                onValuesChange={setSelectedCoInstructors}
                disabled={isSubmitting}
              >
                <MultiSelectTrigger className='w-full'>
                  <MultiSelectValue placeholder='เลือกผู้สอนร่วม' />
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
            </div>
          </div>

          {/* เวลาเรียน */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>ระยะเวลาในการเรียนหลักสูตร</Label>
            <Input
              className='bg-background cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
              type='time'
              value={totalDuration}
              disabled={isSubmitting}
              onChange={(e) => setTotalDuration(e.target.value)}
              placeholder='ปล่อยว่างหากไม่กำหนด'
            />
          </div>

          {/* หมวดหมู่ */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>
              หมวดหมู่ <span className='text-red-500'>*</span>
            </Label>
            <div className='flex items-center gap-2'>
              <div className='flex-1'>
                <MultiSelect
                  values={selectedCategories}
                  onValuesChange={setSelectedCategories}
                  disabled={isSubmitting}
                >
                  <MultiSelectTrigger className='min-h-[2.5rem] w-full'>
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
              {/* ปุ่มเพิ่มหมวดหมู่*/}
              <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    disabled={isSubmitting}
                    className='h-10 w-10 transition-colors hover:text-white'
                  >
                    <Plus className='size-4' />
                  </Button>
                </DialogTrigger>
                <DialogContent className='rounded-2xl sm:max-w-[425px]'>
                  <DialogHeader>
                    <DialogTitle className='text-xl leading-normal font-semibold'>
                      สร้างหมวดหมู่ใหม่
                    </DialogTitle>
                    <DialogDescription className='leading-normal'>
                      ระบุข้อมูลหมวดหมู่ให้ครบถ้วนเพื่อใช้ในการจำแนกหลักสูตร
                    </DialogDescription>
                  </DialogHeader>

                  <div className='grid gap-4 py-4'>
                    {/* ชื่อหมวดหมู่ */}
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium'>ชื่อหมวดหมู่</Label>
                      <Input
                        placeholder='เช่น Automation, PLC'
                        value={newCategoryData.title}
                        onChange={(e) =>
                          setNewCategoryData({ ...newCategoryData, title: e.target.value })
                        }
                      />
                    </div>

                    {/* คำอธิบายหมวดหมู่ */}
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium'>คำอธิบาย (ไม่บังคับ)</Label>
                      <Textarea
                        placeholder='อธิบายสั้นๆ เกี่ยวกับหมวดหมู่...'
                        className='resize-none'
                        value={newCategoryData.description}
                        onChange={(e) =>
                          setNewCategoryData({ ...newCategoryData, description: e.target.value })
                        }
                      />
                    </div>

                    {/* เลือกสีประจำหมวดหมู่ */}
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium'>สีประจำหมวดหมู่</Label>
                      <div className='flex items-center gap-3'>
                        <Input
                          type='color'
                          className='h-10 w-20 cursor-pointer p-1'
                          value={newCategoryData.color}
                          onChange={(e) =>
                            setNewCategoryData({ ...newCategoryData, color: e.target.value })
                          }
                        />
                        <span className='text-muted-foreground font-mono text-sm uppercase'>
                          {newCategoryData.color}
                        </span>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <Label className='text-sm font-medium'>ไอคอนหมวดหมู่</Label>

                      {/* ส่วนแสดง Preview และ Input พิมพ์ชื่อ */}
                      <div className='bg-muted/20 flex items-center gap-4 rounded-lg border p-3'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-md border bg-white shadow-sm'>
                          <IconRenderer
                            name={newCategoryData.icon}
                            className='size-6 text-blue-600'
                          />
                        </div>
                        <div className='flex-1'>
                          <Input
                            placeholder='พิมพ์ชื่อไอคอน (เช่น Zap, Cpu)'
                            value={newCategoryData.icon}
                            onChange={(e) =>
                              setNewCategoryData({ ...newCategoryData, icon: e.target.value })
                            }
                            className='h-9'
                          />
                          <a
                            href='https://lucide.dev'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-muted-foreground mt-1 text-[10px]'
                          >
                            ดูชื่อไอคอนได้ที่ lucide.dev
                          </a>
                        </div>
                      </div>

                      {/* ส่วนไอคอนแนะนำ */}
                      <div className='flex flex-wrap gap-2'>
                        {SUGGESTED_ICONS.map((iconName) => (
                          <button
                            key={iconName}
                            type='button'
                            onClick={() =>
                              setNewCategoryData({ ...newCategoryData, icon: iconName })
                            }
                            className={`flex h-8 w-8 items-center justify-center rounded-md border transition-all hover:scale-110 ${
                              newCategoryData.icon === iconName
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'bg-background'
                            }`}
                          >
                            <IconRenderer name={iconName} className='size-4' />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setIsCategoryModalOpen(false)}
                      className='rounded-xl'
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      onClick={handleAddCategory}
                      disabled={isSubmitting}
                      className='rounded-xl bg-blue-600 px-6 hover:bg-blue-700'
                    >
                      {isSubmitting ? (
                        <Loader2 className='mr-2 size-4 animate-spin' />
                      ) : (
                        <Save className='mr-2 size-4' />
                      )}
                      บันทึกหมวดหมู่
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* ระดับความยาก */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>
              ระดับ <span className='text-red-500'>*</span>
            </Label>
            <Select value={difficulty} onValueChange={setDifficulty} disabled={isSubmitting}>
              <SelectTrigger className='w-full cursor-pointer text-sm'>
                <SelectValue placeholder='เลือกระดับความยาก' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value='basic'>ระดับพื้นฐาน</SelectItem>
                  <SelectItem value='intermediate'>ระดับปานกลาง</SelectItem>
                  <SelectItem value='advanced'>ระดับสูง</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* รูปภาพหน้าปก */}
          <div className='space-y-2.5'>
            <Label className='font-medium text-slate-700'>ภาพหน้าปกหลักสูตร</Label>
            <Dropzone {...dropzone}>
              <DropZoneArea
                className={cn(
                  'relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200',
                  currentImageUrl
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50',
                  isSubmitting && 'cursor-not-allowed opacity-50',
                )}
              >
                <DropzoneTrigger className='w-full outline-none'>
                  {currentImageUrl ? (
                    <div className='group relative aspect-video w-full overflow-hidden'>
                      <img
                        src={currentImageUrl}
                        alt='Preview'
                        className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                      />
                      {/* Overlay เมื่อ Hover */}
                      <div className='absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100'>
                        <div className='flex flex-col gap-2'>
                          <Button
                            type='button'
                            variant='destructive'
                            size='sm'
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveFile(e)
                            }}
                            className='h-9 rounded-full'
                          >
                            <Trash2 className='mr-2 h-4 w-4' /> ลบรูปภาพ
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='flex cursor-pointer flex-col items-center justify-center px-6 py-12 text-center'>
                      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-sm'>
                        <UploadCloud className='h-8 w-8' />
                      </div>
                      <p className='text-sm font-semibold text-slate-700'>
                        คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง
                      </p>
                      <p className='mt-1 text-xs text-slate-500'>
                        รองรับ JPG, PNG หรือ WebP (แนะนำขนาด 16:9 ไม่เกิน 5MB)
                      </p>
                    </div>
                  )}
                </DropzoneTrigger>
              </DropZoneArea>
            </Dropzone>
          </div>
        </div>

        <footer className='bg-muted/20 flex justify-end border-t p-4'>
          <Button
            size='lg'
            onClick={handleSubmit}
            disabled={isSubmitting || !isDirty} // ปุ่มกดได้เฉพาะเมื่อมีการเปลี่ยนแปลง
            className='bg-blue-600 px-8 hover:bg-blue-700'
          >
            {isSubmitting ? (
              <Loader2 className='mr-2 size-4 animate-spin' />
            ) : (
              <Save className='mr-2 size-4' />
            )}
            บันทึกการเปลี่ยนแปลง
          </Button>
        </footer>
      </div>
    </div>
  )
}
