'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Download,
  ChevronLeft,
  Calendar,
  User,
  Share2,
  Info,
  ExternalLink,
  PlayCircle,
  Image as ImageIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ManualDetailClient({ manual }: { manual: any }) {
  const router = useRouter()

  // ตรวจสอบว่าเป็นไฟล์ PDF หรือไม่ เพื่อตัดสินใจว่าจะโชว์ Preview ไหม
  const isPdf = manual.fileType === 'pdf' || manual.fileUrl?.toLowerCase().endsWith('.pdf')

  return (
    <div className='flex min-h-screen flex-1 flex-col bg-slate-50/50 pb-10'>
      {/* 🟦 1. Header Section (สไตล์ Navy คุมโทนระบบ) */}
      <div className='relative w-full overflow-hidden rounded-b-[2.5rem] bg-slate-900 px-4 pt-10 pb-24'>
        {/* Background Blur Effect */}
        <div
          className='absolute inset-0 z-0 scale-110 opacity-30 blur-xl'
          style={{
            backgroundImage: `url(${manual.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className='absolute inset-0 z-10 bg-slate-900/80' />

        <div className='relative z-20 container mx-auto'>
          <Button
            variant='ghost'
            onClick={() => router.back()}
            className='mb-6 cursor-pointer text-slate-300 transition-colors hover:bg-white/10 hover:text-white'
          >
            <ChevronLeft size={18} /> ย้อนกลับ
          </Button>

          <div className='max-w-4xl space-y-4'>
            <Badge className='border-none bg-blue-600 px-3 py-1 text-white'>
              {manual.category}
            </Badge>

            <h1 className='text-3xl leading-tight font-medium tracking-tight text-white md:text-5xl lg:text-6xl'>
              {manual.title}
            </h1>

            <p className='max-w-2xl text-lg leading-relaxed font-light text-slate-300'>
              {manual.description || 'ไม่มีคำอธิบายเพิ่มเติมสำหรับคู่มือฉบับนี้'}
            </p>

            <div className='flex flex-wrap gap-6 pt-4 text-sm text-slate-400'>
              <div className='flex items-center gap-2'>
                <User size={16} className='text-blue-400' /> โดย {manual.uploaderName}
              </div>
              <div className='flex items-center gap-2'>
                <Calendar size={16} className='text-blue-400' /> อัปเดตล่าสุด{' '}
                {new Date(manual._updatedAt).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ⬜ 2. Content Section */}
      <div className='relative z-30 container mx-auto -mt-12 px-4'>
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          {/* ฝั่งซ้าย: ตัวแสดงผลไฟล์ หรือเนื้อหาหลัก */}
          <div className='space-y-6 lg:col-span-2'>
            <div className='flex min-h-[750px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl'>
              <div className='flex items-center justify-between border-b p-4'>
                <span className='flex items-center gap-2 font-medium text-slate-700'>
                  {isPdf ? (
                    <FileText size={18} className='text-blue-600' />
                  ) : (
                    <ExternalLink size={18} className='text-blue-600' />
                  )}
                  {isPdf ? 'พรีวิวคู่มือฉบับเต็ม' : 'ข้อมูลไฟล์/ลิงก์'}
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-blue-600 hover:bg-blue-50'
                  onClick={() => window.open(manual.fileUrl)}
                >
                  <Share2 size={16} className='mr-2' /> เปิดหน้าต่างใหม่
                </Button>
              </div>

              {/* 🎯 ส่วนแสดงผลตามประเภทไฟล์ */}
              <div className='flex-1 overflow-hidden rounded-b-xl bg-slate-50'>
                {isPdf ? (
                  /* กรณีเป็น PDF: ใช้ Google Docs Viewer พรีวิว */
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(manual.fileUrl)}&embedded=true`}
                    className='h-full w-full border-none'
                  />
                ) : manual.fileType === 'video' ? (
                  /* กรณีเป็น Video */
                  <div className='flex h-full flex-col items-center justify-center gap-4 text-slate-400'>
                    <PlayCircle size={64} className='text-blue-600 opacity-20' />
                    <p className='font-medium'>คู่มือนี้เป็นรูปแบบวิดีโอ</p>
                    <Button onClick={() => window.open(manual.fileUrl)}>กดเพื่อดูวิดีโอ</Button>
                  </div>
                ) : (
                  /* กรณีเป็นไฟล์อื่นๆ หรือ Link */
                  <div className='flex h-full flex-col items-center justify-center gap-4 p-10 text-center text-slate-400'>
                    <div className='rounded-full bg-white p-6 shadow-sm'>
                      <ExternalLink size={48} className='text-blue-600 opacity-20' />
                    </div>
                    <div className='max-w-xs space-y-2'>
                      <p className='font-semibold text-slate-600'>
                        คู่มือนี้เป็นรูปแบบ {manual.fileType?.toUpperCase()}
                      </p>
                      <p className='text-sm'>
                        ไม่สามารถพรีวิวได้โดยตรง กรุณากดปุ่มเพื่อเปิดลิงก์หรือดาวน์โหลด
                      </p>
                    </div>
                    <Button variant='outline' onClick={() => window.open(manual.fileUrl)}>
                      ไปยังที่อยู่ไฟล์
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ฝั่งขวา: Sidebar Action (ปุ่มจัดการและข้อมูล) */}
          <div className='space-y-6'>
            <div className='sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
              <h3 className='mb-4 flex items-center gap-2 font-semibold text-slate-800'>
                <Download size={18} className='text-blue-600' /> จัดการไฟล์
              </h3>

              <div className='space-y-3'>
                {/* ปุ่มหลัก: ปรับตามประเภทไฟล์ */}
                <a href={manual.fileUrl} target='_blank' rel='noopener noreferrer'>
                  <Button className='text-md h-12 w-full gap-2 bg-blue-600 shadow-md shadow-blue-100 transition-all hover:bg-blue-700 active:scale-[0.98]'>
                    {isPdf ? <Download size={18} /> : <ExternalLink size={18} />}
                    {isPdf ? 'ดาวน์โหลด PDF' : 'ไปยังลิงก์ดาวน์โหลด'}
                  </Button>
                </a>

                {isPdf && (
                  <Button
                    variant='outline'
                    className='h-11 w-full gap-2 border-slate-200 text-slate-600 transition-colors hover:bg-slate-50'
                    onClick={() => window.print()}
                  >
                    พิมพ์เอกสาร
                  </Button>
                )}
              </div>

              <Separator className='my-6' />

              <h4 className='mb-4 text-sm font-semibold tracking-wider text-slate-900 uppercase'>
                ข้อมูลคู่มือเพิ่มเติม
              </h4>
              <div className='space-y-5'>
                <TechnicalInfo label='ประเภทไฟล์' value={manual.fileType?.toUpperCase() || '-'} />
                <TechnicalInfo label='ชื่อรุ่นอุปกรณ์' value={manual.modelNo || 'โปรดดูในคู่มือ'} />
                <TechnicalInfo label='สถานะไฟล์' value='พร้อมใช้งาน (Public)' />
              </div>

              {/* คำแนะนำเสริม */}
              <div className='mt-8 rounded-xl border border-amber-100 bg-amber-50/50 p-4'>
                <div className='mb-2 flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase'>
                  <Info size={16} /> <span>คำแนะนำการใช้งาน</span>
                </div>
                <p className='text-[11px] leading-relaxed text-amber-600/90'>
                  หากคุณไม่สามารถดูพรีวิวบนหน้าเว็บได้ อาจเกิดจากข้อจำกัดของ Browser แนะนำให้กดปุ่ม{' '}
                  <span className='font-bold'>ดาวน์โหลด PDF</span> เพื่อบันทึกลงเครื่อง หรือกด{' '}
                  <span className='font-bold'>เปิดหน้าต่างใหม่</span> แทนครับ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Component ย่อยสำหรับแสดงข้อมูล Metadata
function TechnicalInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <span className='text-[10px] font-bold tracking-widest text-slate-400 uppercase'>
        {label}
      </span>
      <span className='text-sm font-medium text-slate-700'>{value}</span>
    </div>
  )
}
