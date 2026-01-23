'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  Clock,
  CloudCheck,
  FileEdit,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  MoreVertical,
  RotateCcw,
  Save,
  Settings,
} from 'lucide-react'
import Link from 'next/link'

interface CorseEditorHeaderProps {
  courseTitle: string
  currentView: 'content' | 'settings' | 'assessment'
  onSwitchView: (view: 'content' | 'settings' | 'assessment') => void
  isSaving?: boolean
  isDirty?: boolean
  onSave?: () => void
  onDiscard?: () => void
  lastSavedTime: Date | null
  isPublished?: boolean
  onTogglePublish?: (status: boolean) => void
}

export default function CorseEditorHeader({
  courseTitle,
  currentView,
  onSwitchView,
  isSaving = false,
  isDirty = false,
  onSave,
  onDiscard,
  lastSavedTime,
  isPublished = false,
  onTogglePublish,
}: CorseEditorHeaderProps) {
  return (
    <header className='sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-white px-3 shadow-sm md:h-16 md:gap-4 md:px-6'>
      {/* --- LEFT: BACK & TITLE --- */}
      <div className='flex max-w-[200px] min-w-0 items-center gap-2 md:max-w-md md:gap-4 lg:max-w-lg'>
        <Link
          href='/admin/courses'
          className='flex shrink-0 items-center text-sm text-slate-500 transition-colors hover:text-slate-900'
        >
          <ChevronLeft className='h-5 w-5 md:mr-1 md:h-4 md:w-4' />
          <span className='hidden md:inline'>กลับ</span>
        </Link>

        <div className='hidden h-6 w-px bg-slate-200 md:block' />

        <div className='flex min-w-0 flex-col'>
          <div className='flex items-center gap-2'>
            <span
              className='truncate text-sm font-medium text-slate-800 md:text-base'
              title={courseTitle}
            >
              {courseTitle || 'ไม่มีชื่อหลักสูตร'}
            </span>
          </div>

          {/* STATUS INDICATOR (Desktop Only for full detail, Mobile simplified) */}
          <div className='hidden flex-col md:flex'>
            {isDirty ? (
              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='h-4 w-fit gap-1.5 border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-normal text-amber-600 shadow-sm'
                >
                  <span className='relative flex h-1.5 w-1.5'>
                    <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75'></span>
                    <span className='relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500'></span>
                  </span>
                  ยังไม่ได้บันทึก
                </Badge>
                {lastSavedTime && (
                  <span className='text-[10px] text-slate-400'>
                    {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <span className='flex items-center gap-1 text-[10px] text-slate-400'>
                  <CloudCheck size={12} className='text-emerald-500' /> ซิงค์แล้ว
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- CENTER: VIEW SWITCHER --- */}
      {/* เอา absolute ออก เพื่อให้มันไหลตาม Flow หน้าจอ ไม่ทับชาวบ้าน */}
      <nav className='flex flex-1 items-center justify-center'>
        <div className='flex items-center rounded-lg border border-slate-100 bg-slate-50/50 p-1'>
          {/* Tab 1 */}
          <button
            onClick={() => onSwitchView('content')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-1.5 transition-all md:px-4',
              currentView === 'content'
                ? 'bg-white font-medium text-blue-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
            )}
            title='เนื้อหาหลักสูตร'
          >
            <LayoutDashboard className='h-4 w-4' />
            <span className='hidden text-sm lg:inline'>เนื้อหาหลักสูตร</span>
          </button>

          {/* Tab 2 */}
          <button
            onClick={() => onSwitchView('assessment')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-1.5 transition-all md:px-4',
              currentView === 'assessment'
                ? 'bg-white font-medium text-blue-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
            )}
            title='การวัดผล'
          >
            <GraduationCap className='h-4 w-4' />
            <span className='hidden text-sm lg:inline'>การวัดผล</span>
          </button>

          {/* Tab 3 */}
          <button
            onClick={() => onSwitchView('settings')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-1.5 transition-all md:px-4',
              currentView === 'settings'
                ? 'bg-white font-medium text-blue-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
            )}
            title='ตั้งค่าหลักสูตร'
          >
            <Settings className='h-4 w-4' />
            <span className='hidden text-sm lg:inline'>ตั้งค่าหลักสูตร</span>
          </button>
        </div>
      </nav>

      {/* --- RIGHT: ACTIONS --- */}
      <div className='flex shrink-0 items-center justify-end gap-2'>
        {/* Desktop: Publish Toggle */}
        <div className='hidden items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 md:flex'>
          <button
            onClick={() => onTogglePublish?.(false)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all',
              !isPublished
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <FileEdit size={13} />
            ฉบับร่าง
          </button>
          <button
            onClick={() => onTogglePublish?.(true)}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all',
              isPublished
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Globe size={13} />
            เผยแพร่
          </button>
        </div>

        {/* Desktop: Discard */}
        {isDirty && !isSaving && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onDiscard}
            className='hidden h-8 px-2 text-slate-500 hover:bg-red-50 hover:text-red-600 md:flex'
            title='ยกเลิกการแก้ไข'
          >
            <RotateCcw className='h-4 w-4' />
          </Button>
        )}

        {/* SAVE BUTTON (Always Visible, Text hidden on mobile) */}
        <Button
          size='sm'
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className={cn(
            'h-8 rounded-lg px-3 shadow-sm transition-all duration-200 md:h-9 md:px-4',
            isDirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400',
          )}
        >
          {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
          <span className='ml-2 hidden md:inline'>
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
          </span>
        </Button>

        {/* Mobile: More Actions Menu */}
        <div className='md:hidden'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => onTogglePublish?.(!isPublished)}>
                {isPublished ? (
                  <>
                    <FileEdit className='mr-2 h-4 w-4' /> เปลี่ยนเป็น ฉบับร่าง
                  </>
                ) : (
                  <>
                    <Globe className='mr-2 h-4 w-4' /> เปลี่ยนเป็น เผยแพร่
                  </>
                )}
              </DropdownMenuItem>

              {isDirty && (
                <DropdownMenuItem onClick={onDiscard} className='text-red-600 focus:text-red-600'>
                  <RotateCcw className='mr-2 h-4 w-4' /> ยกเลิกการแก้ไข
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
