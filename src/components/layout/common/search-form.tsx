'use client'

import { Label } from '@/components/ui/label'
import { SidebarInput } from '@/components/ui/sidebar'
import { Search } from 'lucide-react'

export function SearchForm({ ...props }: React.ComponentProps<'form'>) {
  return (
    <form {...props}>
      <div className='group relative'>
        <Label htmlFor='search' className='sr-only'>
          Search
        </Label>
        <SidebarInput
          id='search'
          placeholder='ค้นหาหลักสูตร'
          className='h-9 rounded-lg border-slate-200 bg-slate-50/50 pl-9 text-base font-normal transition-all focus-visible:border-blue-600 focus-visible:ring-1 focus-visible:ring-blue-600'
        />
        <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400 transition-colors select-none group-focus-within:text-blue-600' />
      </div>
    </form>
  )
}
