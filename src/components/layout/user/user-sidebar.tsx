'use client'

import CopyrightText from '@/components/layout/common/copyright'
import { NavMain } from '@/components/layout/common/nav-main'
import { NavSecondary } from '@/components/layout/common/nav-secondary'
import { Sidebar, SidebarContent, SidebarFooter } from '@/components/ui/sidebar'
import { BookMarked, House, Info, TvMinimalPlay } from 'lucide-react'

const data = {
  navMain: [
    {
      title: 'หน้าแรก',
      url: '/courses',
      icon: House,
      isActive: true,
    },
    {
      title: 'หลักสูตร',
      url: '/courses',
      icon: TvMinimalPlay,
    },
    {
      title: 'ศูนย์คู่มือ',
      url: '/manuals',
      icon: BookMarked,
    },
  ],
  navSecondary: [
    {
      title: 'เกี่ยวกับเรา',
      url: '#',
      icon: Info,
    },
  ],
}

export function UserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
