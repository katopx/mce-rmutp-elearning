'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import imageCompression from 'browser-image-compression'
import * as Icons from 'lucide-react'
import {
  CheckCircle2,
  ChevronLeft,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Search,
  X,
  XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Dropzone,
  DropZoneArea,
  DropzoneMessage,
  DropzoneTrigger,
  useDropzone,
} from '@/components/ui/dropzone'
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

// Import Actions Sanity
import { checkSlugAction, createCourseAction, getCourseMetadata } from '@/lib/sanity/course-actions'

export default function CreateCoursePage() {
  const router = useRouter()
  const { user, userData, loading } = useAuth()

  // --- States ---
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [categories, setCategories] = useState<{ value: string; label: string }[]>([])
  const [isLoadingMeta, setIsLoadingMeta] = useState(true)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressingImage, setIsCompressingImage] = useState(false)

  const [newCategoryData, setNewCategoryData] = useState({
    title: '',
    description: '',
    color: '#3b82f6',
    icon: 'Tag',
  })
  const [pendingNewCategories, setPendingNewCategories] = useState<any[]>([])

  // Fetch Metadata
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const { categories } = await getCourseMetadata()

        setCategories(categories)
      } catch (error) {
        toast.error('ไม่สามารถดึงข้อมูลพื้นฐานได้')
      } finally {
        setIsLoadingMeta(false)
      }
    }
    fetchMeta()
  }, [])

  // --- Logic การจัดการ Slug ---
  const handleSlugChange = (val: string) => {
    setTitle(val)
    const formattedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙\s-]/gi, '')
      .replace(/[\s-]+/g, '-')
      .replace(/^-|-$/g, '')
    setSlug(formattedSlug)
    setSlugAvailable(null)
  }

  const handleManualSlugChange = (val: string) => {
    const formattedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙\s-]/gi, '')
      .replace(/\s/g, '-')
      .replace(/-+/g, '-')
    setSlug(formattedSlug)
    setSlugAvailable(null)
  }

  const handleCheckSlug = async () => {
    if (!slug.trim()) return
    setIsCheckingSlug(true)
    setSlugAvailable(null)
    const result = await checkSlugAction(slug)
    setSlugAvailable(result.isAvailable)
    setIsCheckingSlug(false)
    if (result.isAvailable) {
      toast.success('Slug นี้สามารถใช้งานได้')
    } else {
      toast.error('Slug นี้ถูกใช้งานไปแล้ว กรุณาเปลี่ยนใหม่')
    }
  }

  // --- Logic Category ---
  const handleAddCategory = () => {
    if (!newCategoryData.title.trim()) return toast.error('กรุณาระบุชื่อหมวดหมู่')

    const tempId = `new-${Date.now()}`

    const newCatObj = {
      tempId: tempId,
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

  // --- Logic Submit ---
  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('กรุณากรอกชื่อหลักสูตร')
    if (!slug.trim()) return toast.error('กรุณากรอก Slug')
    if (slugAvailable !== true) {
      return toast.error('กรุณาตรวจสอบ Slug ก่อนดำเนินการต่อ')
    }
    if (!shortDescription.trim()) return toast.error('กรุณากรอกคำอธิบายหลักสูตร')
    if (selectedCategories.length === 0) return toast.error('กรุณาเลือกอย่างน้อย 1 หมวดหมู่')
    if (!difficulty) return toast.error('กรุณาเลือกระดับความยากของหลักสูตร')
    if (!imageFile) return toast.error('กรุณาอัปโหลดรูปภาพหน้าปกหลักสูตร')

    if (!user?.email) return toast.error('ไม่พบข้อมูลผู้ใช้งาน กรุณา Login ใหม่')

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('slug', slug)
      formData.append('shortDescription', shortDescription)
      formData.append('difficulty', difficulty)
      formData.append('image', imageFile)

      formData.append('creatorEmail', user.email)
      formData.append('creatorName', userData?.displayName || user.displayName || '')

      const existingCatIds = selectedCategories.filter((id) => !id.startsWith('new-'))
      const newCatsToCreate = pendingNewCategories.filter((cat) =>
        selectedCategories.includes(cat.tempId),
      )

      formData.append('existingCategories', JSON.stringify(existingCatIds))
      formData.append('newCategories', JSON.stringify(newCatsToCreate))

      const result = await createCourseAction(formData)

      if (result.success) {
        toast.success('สร้างหลักสูตรเรียบร้อยแล้ว!', {
          description: 'ระบบกำลังพาคุณไปยังหน้าจัดการหลักสูตร',
        })
        router.push(`/admin/courses/${result.id}`)
      } else {
        toast.error('เกิดข้อผิดพลาดจากระบบ', { description: result.error })
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดที่ไม่สามารถระบุได้', { description: String(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Dropzone Logic ---
  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      // ป้องกันการลากไฟล์ใส่ตอนกำลังบันทึก
      if (isSubmitting) return { status: 'error', error: 'กำลังบันทึกข้อมูล กรุณารอสักครู่' }

      setIsCompressingImage(true) // เริ่มสถานะบีบอัด

      try {
        // ตั้งค่าการบีบอัด (ให้เหลือไม่เกิน 1MB เพื่อ Server Action)
        const options = {
          maxSizeMB: 0.9,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp',
        }

        // เริ่มบีบอัด
        const compressedFile = await imageCompression(file, options)

        // สร้าง Preview จากไฟล์ที่บีบอัดแล้ว
        const preview = URL.createObjectURL(compressedFile)
        setImageFile(compressedFile)

        return {
          status: 'success',
          result: preview,
        }
      } catch (error) {
        console.error('Compression failed:', error)
        return {
          status: 'error',
          error: 'ไม่สามารถบีบอัดไฟล์ภาพได้',
        }
      } finally {
        setIsCompressingImage(false) // จบสถานะบีบอัด
      }
    },
    validation: {
      accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
      maxSize: 5 * 1024 * 1024,
      maxFiles: 1,
    },
    shiftOnMaxFiles: true,
  })

  const { fileStatuses, onRemoveFile } = dropzone
  const currentFile = fileStatuses[0]
  const previewUrl = currentFile?.result
  const isPending = currentFile?.status === 'pending' || isCompressingImage

  // --- Cleanup Memory ---
  useEffect(() => {
    return () => {
      if (previewUrl && typeof previewUrl === 'string') {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // --- Handlers ---
  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentFile || isSubmitting) return

    onRemoveFile(currentFile.id)
    setImageFile(null)

    if (previewUrl && typeof previewUrl === 'string') {
      URL.revokeObjectURL(previewUrl)
    }
  }

  // --- Icon Renderer ---

  const IconRenderer = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = (Icons as any)[name]
    if (!IconComponent) return <Icons.HelpCircle className={className} />
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

  if (loading) return <div>กำลังตรวจสอบสิทธิ์...</div>
  return (
    <div className='mx-auto max-w-2xl px-4 py-8'>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => router.back()}
        disabled={isSubmitting}
        className='text-muted-foreground group mb-4 flex h-auto items-center p-0 transition-colors hover:bg-transparent hover:text-blue-600'
      >
        <ChevronLeft className='mr-1 size-4 transition-transform group-hover:-translate-x-1' />
        <span className='text-base font-medium'>ย้อนกลับ</span>
      </Button>

      <div className='bg-card overflow-hidden rounded-xl border shadow-sm'>
        <header className='bg-muted/30 border-b p-6'>
          <h1 className='text-foreground text-xl font-semibold'>รายละเอียดหลักสูตร</h1>
          <p className='text-muted-foreground text-sm'>กรอกข้อมูลพื้นฐานเพื่อสร้างหลักสูตรใหม่</p>
        </header>

        <div className='space-y-6 p-6'>
          {/* ชื่อหลักสูตร */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>ชื่อหลักสูตร</Label>
            <Input
              placeholder='ใส่ชื่อหลักสูตร (ภาษาอังกฤษหรือไทย)'
              className='text-base'
              value={title}
              disabled={isSubmitting}
              onChange={(e) => {
                setTitle(e.target.value)
                handleSlugChange(e.target.value)
              }}
            />
          </div>

          {/* URL Slug */}
          <div className='space-y-2'>
            <div className='flex items-center gap-1.5 text-xs'>
              <span className='text-xs font-medium uppercase'>URL:</span>
              <span>
                .../courses/<span>{slug || 'your-slug'}</span>
              </span>
              {slugAvailable === true && (
                <span className='flex items-center text-green-600'>
                  <CheckCircle2 className='mr-1 h-3 w-3' /> ใช้งานได้
                </span>
              )}
              {slugAvailable === false && (
                <span className='flex items-center text-red-600'>
                  <XCircle className='mr-1 h-3 w-3' /> ซ้ำ! ใช้งานไม่ได้
                </span>
              )}
            </div>
            <div className='flex gap-2'>
              <Input
                placeholder='ใส่ชื่อ slug'
                value={slug}
                onChange={(e) => handleManualSlugChange(e.target.value)}
                className={`text-base ${slugAvailable === true ? 'border-green-500 bg-green-50/10' : ''}`}
                disabled={isSubmitting}
              />
              <Button
                variant='outline'
                onClick={handleCheckSlug}
                disabled={isCheckingSlug || !slug || isSubmitting}
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

          {/* คำอธิบายหลักสูตร (ฉบับย่อ) */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>คำอธิบายหลักสูตร (ฉบับย่อ)</Label>
            <Textarea
              placeholder='อธิบายรายละเอียดเกี่ยวกับหลักสูตรนี้สั้นๆ เพื่อดึงดูดความสนใจจากผู้เรียน'
              className='min-h-[100px] resize-none text-base'
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              disabled={isSubmitting}
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
                  disabled={isLoadingMeta || isSubmitting}
                >
                  <MultiSelectTrigger className='min-h-[2.5rem] w-full'>
                    <MultiSelectValue
                      placeholder={isLoadingMeta ? 'กำลังโหลด...' : 'เลือกหมวดหมู่'}
                    />
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
                    className='h-10 w-10 transition-colors hover:border-blue-500 hover:text-blue-500'
                    disabled={isSubmitting}
                  >
                    <Plus className='size-4' />
                  </Button>
                </DialogTrigger>
                <DialogContent className='rounded-2xl sm:max-w-[425px]'>
                  <DialogHeader>
                    <DialogTitle className='text-xl font-semibold'>สร้างหมวดหมู่ใหม่</DialogTitle>
                    <DialogDescription className=''>
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

                    {/* คำอธิบาย */}
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

                      {/* ส่วนไอคอนแนะนำ (Click to select) */}
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

          {/* ระดับ */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>
              ระดับ <span className='text-red-500'>*</span>
            </Label>
            <Select value={difficulty} onValueChange={setDifficulty} disabled={isSubmitting}>
              <SelectTrigger className='w-full text-sm'>
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

          {/* ภาพหน้าปกหลักสูตร */}
          <div className='space-y-2'>
            <Label className='text-sm font-medium'>ภาพหน้าปกหลักสูตร</Label>
            <Dropzone {...dropzone}>
              <div className='flex justify-between'>
                <DropzoneMessage />
              </div>
              <DropZoneArea className='border-muted-foreground/25 hover:border-primary/50 relative overflow-hidden rounded-xl border-2 border-dashed transition-colors'>
                <DropzoneTrigger className='w-full'>
                  {previewUrl ? (
                    <div className='group relative aspect-video w-full'>
                      <img
                        src={typeof previewUrl === 'string' ? previewUrl : ''}
                        alt='Cover Preview'
                        className={`h-full w-full object-cover transition-all duration-300 ${isPending ? 'opacity-50 blur-sm' : ''}`}
                      />
                      {isPending && (
                        <div className='absolute inset-0 flex items-center justify-center'>
                          <Loader2 className='text-primary h-8 w-8 animate-spin' />
                        </div>
                      )}
                      <div className='absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
                        <div className='mb-4 flex flex-col items-center text-white'>
                          <ImageIcon className='mb-2 h-8 w-8' />
                          <p className='text-sm font-medium'>คลิกเพื่อเปลี่ยนรูป</p>
                        </div>
                        <Button
                          type='button'
                          variant='destructive'
                          size='sm'
                          onClick={handleRemoveFile}
                          className='z-50 h-9 px-4 shadow-lg hover:bg-red-600'
                        >
                          <X className='mr-2 h-4 w-4' /> ลบรูปภาพนี้
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className='bg-muted/5 flex aspect-video w-full flex-col items-center justify-center gap-4 p-10 text-center'>
                      <div className='rounded-full bg-slate-100 p-4'>
                        <ImageIcon className='h-8 w-8 text-slate-400' />
                      </div>
                      <div className='space-y-1'>
                        <p className='text-sm font-medium text-slate-700'>อัปโหลดรูปภาพหน้าปก</p>
                        <p className='text-muted-foreground text-xs'>
                          ลากไฟล์มาวาง หรือคลิกเพื่อเลือก (รองรับ JPG, PNG ขนาดไม่เกิน 5MB)
                        </p>
                      </div>
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
            disabled={isSubmitting || isCompressingImage}
            className='rounded-lg bg-blue-600 px-8 text-white transition-all hover:bg-blue-700'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 size-4 animate-spin' /> กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className='mr-2 size-4' /> สร้างหลักสูตรใหม่
              </>
            )}
          </Button>
        </footer>
      </div>
    </div>
  )
}
