'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { auth, db } from '@/lib/firebase/config'
import { ROLE_DISPLAY } from '@/utils/roles'
import { deleteCookie, setCookie } from 'cookies-next'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { FolderHeart, Home, LogInIcon, LogOutIcon, MonitorCog, TvMinimalPlay, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { toast } from 'sonner'
import { Alert } from './alert'

type Props = {
  trigger?: ReactNode
  align?: 'start' | 'center' | 'end'
}

export function UserButton({ trigger, align = 'end' }: Props) {
  const { user, role, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isAdminPage = pathname?.startsWith('/admin')

  // --- Logic Login ---
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const u = result.user

      const userDocRef = doc(db, 'users', u.uid)
      const userDoc = await getDoc(userDocRef)

      let userRole = 'student'
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: u.uid,
          displayName: u.displayName,
          email: u.email,
          photoURL: u.photoURL,
          role: userRole,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        })
      } else {
        userRole = userDoc.data().role
        await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true })
      }

      const token = await u.getIdToken()
      setCookie('token', token, { maxAge: 60 * 60 * 24 * 7 })
      setCookie('user_role', userRole, { maxAge: 60 * 60 * 24 * 7 })

      toast.success('เข้าสู่ระบบสำเร็จ')
      router.refresh()
    } catch (error) {
      console.error('Login failed', error)
      toast.error('การเข้าสู่ระบบล้มเหลว')
    }
  }

  // --- Logic Logout ---
  const handleLogout = async () => {
    try {
      await signOut(auth)
      deleteCookie('token')
      deleteCookie('user_role')
      toast.success('ออกจากระบบแล้ว')
      router.push('/')
      router.refresh()
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ')
    }
  }

  if (loading) return <div className='size-9 animate-pulse rounded-full bg-slate-200' />

  if (!user) {
    return (
      <Button
        onClick={handleLogin}
        className='hover:bg-primary hover:text-primary-foreground cursor-pointer gap-2 border-blue-200 transition-colors'
      >
        <LogInIcon className='size-4' />
        <span>เข้าสู่ระบบ</span>
      </Button>
    )
  }

  const userInitials = user.displayName?.slice(0, 2).toUpperCase() || 'US'
  const currentRole = (role || 'student') as keyof typeof ROLE_DISPLAY
  const roleConfig = ROLE_DISPLAY[currentRole]

  return (
    <div className='flex items-center gap-3'>
      {/* Name Label (Desktop Only) */}
      <div className='hidden flex-col items-end leading-tight sm:flex'>
        <span className='text-slate-900'>{user.displayName}</span>
        <span className='rounded bg-blue-50 px-1.5 text-xs text-blue-600 uppercase'>{roleConfig.label}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger || (
            <Button
              variant='ghost'
              size='icon'
              className='size-9 cursor-pointer overflow-hidden rounded-full border border-slate-200 shadow-sm transition-all hover:ring-2 hover:ring-blue-100'
            >
              <Avatar className='size-9'>
                <AvatarImage src={user.photoURL || ''} referrerPolicy='no-referrer' />
                <AvatarFallback className='bg-blue-600 text-white'>{userInitials}</AvatarFallback>
              </Avatar>
            </Button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent className='w-72' align={align}>
          <DropdownMenuLabel className='flex items-center gap-3 px-4 py-3'>
            <div className='relative'>
              <Avatar className='size-10 border border-slate-100'>
                <AvatarImage src={user.photoURL || ''} referrerPolicy='no-referrer' />
                <AvatarFallback className='bg-blue-50 text-blue-600'>{userInitials}</AvatarFallback>
              </Avatar>
              <span className='absolute right-0 bottom-0 block size-2.5 rounded-full bg-green-500 ring-2 ring-white' />
            </div>
            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='truncate text-slate-900'>{user.displayName || 'ไม่แสดงชื่อ'}</span>
              <span className='truncate text-xs text-slate-500 italic'>{user.email || 'ไม่แสดงอีเมล'}</span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem asChild className='cursor-pointer px-4 py-2'>
              <Link href='#' className='flex w-full items-center'>
                <UserIcon className='mr-2 size-5' />
                <span>บัญชีของฉัน</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className='cursor-pointer px-4 py-2'>
              <Link href='#' className='flex w-full items-center'>
                <TvMinimalPlay className='mr-2 size-5' />
                <span>หลักสูตรของฉัน</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className='cursor-pointer px-4 py-2'>
              <Link href='#' className='flex w-full items-center'>
                <FolderHeart className='mr-2 size-5' />
                <span>รายการโปรด</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {(role === 'admin' || role === 'instructor') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {isAdminPage ? (
                  <DropdownMenuItem
                    asChild
                    className='text-primary focus:text-primary focus:bg-primary/10 cursor-pointer px-4 py-2'
                  >
                    <Link href='/' className='flex w-full items-center'>
                      <Home className='text-primary mr-2 size-5' />
                      <span>กลับหน้าหลัก</span>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    asChild
                    className='text-primary focus:text-primary focus:bg-primary/10 cursor-pointer px-4 py-2'
                  >
                    <Link href='/admin' className='flex w-full items-center'>
                      <MonitorCog className='text-primary mr-2 size-5' />
                      <span>ระบบจัดการผู้สอน</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className='text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer px-4 py-2'
          >
            <LogOutIcon className='text-destructive mr-2 size-5' />
            <Alert
              variant='destructive'
              title='ออกจากระบบ'
              description='คุณแน่ใจหรือว่าต้องการออกจากระบบ?'
              confirmText='ออกจากระบบ'
              cancelText='ยกเลิก'
              onConfirm={handleLogout}
              trigger={<span>ออกจากระบบ</span>}
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
