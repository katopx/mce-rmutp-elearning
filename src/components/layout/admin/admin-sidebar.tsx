'use client'

import { NavMain } from '@/components/layout/common/nav-main'
import { NavSecondary } from '@/components/layout/common/nav-secondary'
import { Sidebar, SidebarContent, SidebarFooter } from '@/components/ui/sidebar'
import { ClipboardList, LayoutGrid, Settings, TvMinimalPlay, Users } from 'lucide-react'
import CopyrightText from '../common/copyright'

const data = {
  navMain: [
    {
      title: 'ภาพรวม',
      url: '/admin',
      icon: LayoutGrid,
      isActive: true,
    },
    {
      title: 'จัดการหลักสูตร',
      url: '/admin/courses',
      icon: TvMinimalPlay,
    },
    {
      title: 'รายงานผลการเรียน',
      url: '/admin/reports',
      icon: ClipboardList,
    },
    {
      title: 'จัดการผู้เรียน',
      url: '/admin/users',
      icon: Users,
    },
  ],
  navSecondary: [
    {
      title: 'ตั้งค่าระบบ',
      url: '/admin/settings',
      icon: Settings,
    },
  ],
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className='top-(--header-height) h-[calc(100svh-var(--header-height))]!' {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <CopyrightText />
      </SidebarFooter>
    </Sidebar>
  )
}
