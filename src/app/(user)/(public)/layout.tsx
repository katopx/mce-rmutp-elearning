import { UserSidebar } from '@/components/layout/user/user-sidebar'
import { UserHeader } from '@/components/layout/user/user-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='h-screen overflow-hidden [--header-height:calc(theme(spacing.14))]'>
      <SidebarProvider className='flex h-full flex-col'>
        <UserHeader />

        <div className='flex h-[calc(100vh-var(--header-height))] overflow-hidden'>
          <UserSidebar />

          <SidebarInset className='bg-muted/50 overflow-y-auto'>
            <main className='p-4 md:p-6'>{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
