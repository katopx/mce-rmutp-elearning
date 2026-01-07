// src/components/auth/AuthGuard.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface AuthGuardProps {
  children: React.ReactElement // ปุ่ม หรือ element ที่ต้องการให้กด
  GoTo?: string // ถ้า login แล้ว ให้ไปหน้าไหน (Optional)
  action?: () => void // ถ้า login แล้ว ให้ทำฟังก์ชันอะไร (Optional)
  text?: string // ข้อความใน toast
  toastType?: 'error' | 'success' | 'info' | 'warning' // ประเภทของ toast
}

interface ClickableProps {
  onClick?: React.MouseEventHandler<HTMLElement>
  [key: string]: any
}

export function AuthGuard({
  children,
  GoTo,
  action,
  text = 'กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ',
  toastType = 'error',
}: AuthGuardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const childrenProps = children.props as ClickableProps

  const handleCheck = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      // 1. ถ้าไม่ล๊อกอิน -> ยิง Toast ตามประเภทที่กำหนด
      toast[toastType](text)
      return
    }

    // 2. ถ้าล๊อกอินแล้ว -> ทำตามเงื่อนไขที่ส่งมา
    if (GoTo) {
      router.push(GoTo)
    } else if (action) {
      action()
    } else if (childrenProps.onClick) {
      childrenProps.onClick(e)
    }
  }

  return React.cloneElement(children, {
    onClick: handleCheck,
  } as ClickableProps)
}
