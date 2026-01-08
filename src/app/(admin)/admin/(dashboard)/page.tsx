'use client'

import { BookOpen, GraduationCap, TrendingUp, Users } from 'lucide-react'

export default function AdminDashboard() {
  const stats = [
    {
      title: 'นักศึกษาทั้งหมด',
      value: '1,250',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'หลักสูตรที่เปิดสอน',
      value: '12',
      icon: BookOpen,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'ผู้ที่เรียนจบแล้ว',
      value: '450',
      icon: GraduationCap,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'อัตราการเข้าเรียน',
      value: '85%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  return (
    <div className='space-y-8 p-6'>
      {/* Header Section */}
      <div className='space-y-1'>
        <h1 className='text-2xl leading-normal font-semibold text-slate-900'>แผงควบคุมระบบ</h1>
        <p className='text-base leading-normal font-normal text-slate-500'>
          ภาพรวมข้อมูลและการใช้งานระบบ Elearning
        </p>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {stats.map((item, idx) => (
          <div
            key={idx}
            className='group rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-sm'
          >
            <div
              className={`flex size-12 items-center justify-center rounded-xl ${item.bg} ${item.color} mb-4`}
            >
              <item.icon className='!size-6' />
            </div>
            <p className='text-sm leading-normal font-medium text-slate-500'>{item.title}</p>
            <p className='mt-1 text-2xl leading-normal font-semibold text-slate-900'>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Activity Section */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <div className='rounded-2xl border border-slate-100 bg-white p-6 lg:col-span-2'>
          <h2 className='mb-4 text-lg leading-normal font-semibold text-slate-800'>
            กิจกรรมล่าสุด
          </h2>
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='flex items-center gap-4 border-b border-slate-50 py-3 last:border-0'
              >
                <div className='size-10 shrink-0 rounded-full bg-slate-100' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-base leading-normal font-medium text-slate-700'>
                    นายนพดล เรียนจบหลักสูตร Basic PLC
                  </p>
                  <p className='text-sm leading-normal font-normal text-slate-400'>2 นาทีที่แล้ว</p>
                </div>
                <button className='cursor-pointer text-sm font-medium text-slate-400 transition-colors hover:text-blue-600'>
                  ดูรายละเอียด
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className='rounded-2xl border border-slate-100 bg-white p-6'>
          <h2 className='mb-4 text-lg leading-normal font-semibold text-slate-800'>สถานะระบบ</h2>
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-base leading-normal font-normal text-slate-600'>
                การเชื่อมต่อฐานข้อมูล
              </span>
              <span className='flex items-center gap-2 text-sm font-medium text-green-600'>
                <span className='size-2 animate-pulse rounded-full bg-green-500' /> ปกติ
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-base leading-normal font-normal text-slate-600'>
                พื้นที่จัดเก็บ
              </span>
              <span className='text-sm font-medium text-slate-900'>45%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
