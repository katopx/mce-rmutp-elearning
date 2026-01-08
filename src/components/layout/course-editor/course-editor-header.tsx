'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  Clock,
  CloudCheck,
  FileEdit,
  Globe,
  LayoutDashboard,
  Loader2,
  RotateCcw,
  Save,
  Settings,
} from 'lucide-react'
import Link from 'next/link'

interface CorseEditorHeaderProps {
  courseTitle: string
  currentView: 'content' | 'settings'
  onSwitchView: (view: 'content' | 'settings') => void
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
    <header className='sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b bg-white px-6'>
      {/* --- LEFT: BACK & TITLE --- */}
      <div className='flex min-w-0 flex-1 items-center gap-4'>
        <Link
          href='/admin/courses'
          className='flex items-center text-sm text-slate-500 transition-colors hover:text-slate-900'
        >
          <ChevronLeft className='mr-1 h-4 w-4' /> กลับ
        </Link>

        <div className='h-6 w-px bg-slate-200' />

        <div className='flex items-center gap-4'>
          <span className='truncate font-medium text-slate-800'>{courseTitle}</span>

          {/* STATUS INDICATOR */}
          <div className='flex flex-col'>
            {isDirty ? (
              <>
                <Badge
                  variant='outline'
                  className='w-fit gap-1.5 border-amber-200 bg-amber-50 py-0.5 text-[11px] font-normal text-amber-600 shadow-sm'
                >
                  <span className='relative flex h-1.5 w-1.5'>
                    <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75'></span>
                    <span className='relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500'></span>
                  </span>
                  มีข้อมูลยังไม่ได้บันทึก
                </Badge>
                {lastSavedTime && (
                  <span className='mt-1 flex items-center gap-1 text-[10px] font-normal text-slate-400'>
                    <Clock size={10} />
                    บันทึกแบบร่างเมื่อ{' '}
                    {lastSavedTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                )}
              </>
            ) : (
              <>
                <Badge
                  variant='outline'
                  className='w-fit gap-1.5 border-emerald-200 bg-emerald-50 py-0.5 text-[11px] font-medium text-emerald-600 shadow-sm'
                >
                  <CloudCheck className='h-3 w-3' />
                  บันทึกลงระบบแล้ว
                </Badge>
                <span className='mt-1 text-[10px] text-slate-400'>Synced</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- CENTER: VIEW SWITCHER --- */}
      <nav className='absolute left-1/2 flex -translate-x-1/2 items-center p-1 shadow-sm'>
        <button
          onClick={() => onSwitchView('content')}
          className={cn(
            'text-ml flex items-center gap-2 rounded-lg px-8 py-1.5',
            currentView === 'content'
              ? 'text-primary border-primary rounded-b-none border-b-2 bg-white'
              : 'hover:text-primary hover:border-primary rounded-b-none hover:border-b-2',
          )}
        >
          <LayoutDashboard className='h-4 w-4' />
          เนื้อหาหลักสูตร
        </button>
        <button
          onClick={() => onSwitchView('settings')}
          className={cn(
            'text-ml flex items-center gap-2 rounded-lg px-8 py-1.5',
            currentView === 'settings'
              ? 'text-primary border-primary rounded-b-none border-b-2 bg-white'
              : 'hover:text-primary hover:border-primary rounded-b-none hover:border-b-2',
          )}
        >
          <Settings className='h-4 w-4' />
          ตั้งค่าหลักสูตร
        </button>
      </nav>
      {/* --- RIGHT: ACTIONS --- */}
      <div className='flex flex-1 items-center justify-end gap-3'>
        {/* PUBLISH TOGGLE */}
        <div className='hidden items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 md:flex'>
          <button
            onClick={() => onTogglePublish?.(false)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition-all',
              !isPublished
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <FileEdit size={13} />
            แบบร่าง
          </button>
          <button
            onClick={() => onTogglePublish?.(true)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition-all',
              isPublished
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Globe size={13} />
            เผยแพร่
          </button>
        </div>

        <div className='mx-1 h-4 w-px bg-slate-200' />

        {isDirty && !isSaving && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onDiscard}
            className='h-9 hover:bg-red-50 hover:text-red-600'
          >
            <RotateCcw className='mr-2 h-3.5 w-3.5' />
            คืนค่าเดิม
          </Button>
        )}
        <div className='h-4 w-px bg-slate-200' />
        {/* บันทึกข้อมูลลง Server */}
        <Button
          size='sm'
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className={cn(
            'h-9 min-w-[120px] rounded-lg shadow-sm transition-all duration-200',
            isDirty
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
              : 'bg-slate-100 text-slate-400',
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className='mr-2 h-4 w-4' />
              บันทึกโครงสร้าง
            </>
          )}
        </Button>
      </div>
    </header>
  )
}
