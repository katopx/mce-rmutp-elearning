'use client'

import Link from 'next/link'
import { Home, Search, Ghost } from 'lucide-react'

export default function NotFound() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center'>
      {/* Icon Area */}
      <div className='relative mb-8'>
        <div className='absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75'></div>
        <div className='relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-xl'>
          <Ghost size={64} className='animate-bounce text-blue-500' />
        </div>
      </div>

      {/* Text Area */}
      <h1 className='mb-2 text-6xl font-bold text-slate-900'>404</h1>
      <h2 className='mb-4 text-2xl font-semibold text-slate-800'>
        โอ๊ะโอ! หน้าที่คุณหาไม่อยู่ที่นี่
      </h2>
      <p className='mb-8 max-w-md text-slate-500'>
        ดูเหมือนว่าเส้นทางที่คุณกำลังไปไม่มีอยู่ในแผนที่การเรียนรู้ของเรา
        ลองกลับไปเริ่มต้นใหม่ที่หน้าหลักสูตรดูไหมครับ?
      </p>

      {/* Buttons */}
      <div className='flex flex-col gap-4 sm:flex-row'>
        <Link
          href='/courses'
          className='flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-medium text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95'
        >
          <Home size={18} />
          กลับไปหน้าหลักสูตร
        </Link>

        <button
          onClick={() => window.history.back()}
          className='flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3 font-medium text-slate-600 transition-all hover:bg-slate-50 active:scale-95'
        >
          <Search size={18} />
          ย้อนกลับไปก่อนหน้า
        </button>
      </div>

      {/* Decorative Circles */}
      <div className='fixed -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-50 opacity-50 blur-3xl'></div>
      <div className='fixed -top-10 -right-10 h-40 w-40 rounded-full bg-indigo-50 opacity-50 blur-3xl'></div>
    </div>
  )
}
