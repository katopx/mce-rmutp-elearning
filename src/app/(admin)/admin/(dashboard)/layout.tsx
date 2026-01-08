import { AdminHeader } from '@/components/layout/admin/admin-header'
import { AdminSidebar } from '@/components/layout/admin/admin-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='[--header-height:calc(--spacing(14))]'>
      <SidebarProvider className='flex flex-col'>
        <AdminHeader />
        <div className='flex flex-1'>
          <AdminSidebar />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
