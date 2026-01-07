'use client'

import { ChevronRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className='mt-4 px-4 text-xs font-normal tracking-wider text-slate-400 uppercase'>
        เมนูหลัก
      </SidebarGroupLabel>

      <SidebarMenu className='px-2'>
        {items.map((item) => {
          const isParentActive = pathname === item.url || item.items?.some((sub) => pathname === sub.url)

          return (
            <Collapsible key={item.title} asChild defaultOpen={isParentActive || item.isActive}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={`group/menu-item h-auto min-h-10 py-2 transition-colors hover:bg-transparent active:bg-transparent ${
                    isParentActive ? 'text-primary' : 'hover:text-primary'
                  }`}
                >
                  <Link href={item.url} className='flex items-center gap-3 px-4'>
                    {item.icon && (
                      <item.icon
                        className={`!size-5 shrink-0 transition-colors ${
                          isParentActive ? 'text-primary' : 'group-hover/menu-item:text-primary'
                        }`}
                      />
                    )}
                    <span className='text-base leading-normal font-normal'>{item.title}</span>
                  </Link>
                </SidebarMenuButton>

                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction
                        className={`transition-transform hover:bg-transparent data-[state=open]:rotate-90 ${
                          isParentActive ? 'text-primary' : 'text-slate-400'
                        }`}
                      >
                        <ChevronRight className='size-4' />
                        <span className='sr-only'>Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className='ml-11 border-slate-100 pl-2'>
                        {item.items?.map((subItem) => {
                          const isSubActive = pathname === subItem.url

                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={`h-auto min-h-9 py-1.5 transition-colors hover:bg-transparent ${
                                  isSubActive ? 'text-primary font-normal' : 'hover:text-primary'
                                }`}
                              >
                                <Link href={subItem.url} className='px-2'>
                                  <span className='text-base leading-normal font-normal'>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
