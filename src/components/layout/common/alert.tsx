'use client'

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
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { ReactNode, useState } from 'react'

interface AlertProps {
  trigger: ReactNode

  // ส่วนของเนื้อหา
  title: string
  description?: string

  // Actions
  cancelText?: string
  confirmText?: string

  onConfirm: () => void | Promise<void>

  // Styling
  variant?: 'default' | 'destructive'
  className?: string
}

export function Alert({
  trigger,
  title,
  description,
  cancelText = 'ยกเลิก',
  confirmText = 'ยืนยัน',
  onConfirm,
  variant = 'default',
  className,
}: AlertProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      setIsOpen(false)
    } catch (error) {
      console.error('Alert Confirmation Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent className={cn('sm:max-w-[450px]', className)}>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-xl font-medium'>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription className='pt-2 text-base'>{description}</AlertDialogDescription>}
        </AlertDialogHeader>

        <AlertDialogFooter className='mt-4'>
          {/* ปุ่มยกเลิก: จะถูก Disable เมื่อกำลังโหลด */}
          <AlertDialogCancel className={cn(buttonVariants({ variant: 'outline-muted' }))} disabled={loading}>
            {cancelText}
          </AlertDialogCancel>

          {/* ปุ่มยืนยัน: เปลี่ยนสีตาม variant และแสดง Loading อัตโนมัติ */}
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={loading}
            className={cn(buttonVariants({ variant }), 'min-w-[100px] cursor-pointer gap-2')}
          >
            {loading && <Loader2 className='h-4 w-4 animate-spin' />}
            {loading ? 'กำลังประมวลผล...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
