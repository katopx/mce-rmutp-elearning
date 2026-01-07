'use client'

import { type LucideIcon } from 'lucide-react'
import * as React from 'react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu className='px-2'>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className='group/menu-item h-auto min-h-10 py-2 transition-colors hover:bg-transparent active:bg-transparent'
              >
                <a href={item.url} className='flex items-center gap-3 px-4'>
                  {item.icon && (
                    <item.icon className='group-hover/menu-item:text-primary !size-5 shrink-0 text-slate-400 transition-colors' />
                  )}
                  <span className='group-hover/menu-item:text-primary text-base leading-normal font-normal text-slate-600 transition-colors'>
                    {item.title}
                  </span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
