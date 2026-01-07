import { client } from '@/sanity/lib/client'
import { BookOpen, ImageIcon, RotateCcw, User } from 'lucide-react'
import Link from 'next/link'

async function showManuals() {
  const query = `*[_type == "manual" && status == "published"] | order(_createdAt desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    "image": image.asset->url,
    "category": coalesce(categories[0]->title),
    "uploaderName": uploaderName,
  }`
  return await client.fetch(query)
}

export default async function ManualPage() {
  const manuals = await showManuals()

  if (manuals.length === 0) {
    return (
      <div className='flex min-h-[80vh] flex-col items-center justify-center p-6 text-center'>
        <div className='mb-4'>
          <BookOpen size={100} />
        </div>
        <h1 className='text-3xl font-normal'>ไม่พบคู่มือ</h1>

        <Link
          href={`/manuals`}
          className='text-primary mt-6 flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 shadow-none hover:bg-transparent active:opacity-70'
        >
          <RotateCcw size={18} />
          <span className='text-sm font-normal'>ลองอีกครั้ง</span>
        </Link>
      </div>
    )
  }

  return (
    <div className='p-6 md:p-8'>
      <header className='mb-8'>
        <h1 className='text-2xl font-semibold text-slate-900'>คู่มือทั้งหมด</h1>
        <p className='text-slate-500'>เลือกคู่มือที่สนใจเพื่อเริ่มเรียนรู้</p>
      </header>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
        {manuals.map((manual: any) => (
          <Link key={manual._id} href={`/manuals/${manual.slug}`} className='group block'>
            <div className='flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08),0_1px_4px_-1px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.12)] active:scale-[0.98]'>
              {/* Image Area */}
              <div className='relative aspect-video overflow-hidden bg-slate-100'>
                {manual.image ? (
                  <img
                    src={manual.image}
                    alt={manual.title}
                    className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105'
                    loading='lazy'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center'>
                    <ImageIcon className='text-slate-300' />
                  </div>
                )}
              </div>
              {/* Content Area */}
              <div className='flex flex-1 flex-col p-5'>
                <span className='font-regular mb-2 w-fit rounded-md bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600'>
                  {manual.category}
                </span>
                <h3 className='mb-2 line-clamp-2 text-lg leading-snug font-medium text-slate-900'>
                  {manual.title}
                </h3>
                <p className='mb-5 line-clamp-2 flex-1 text-sm font-normal text-slate-500'>
                  {manual.description}
                </p>
                <div className='flex items-center justify-between border-t border-slate-100 pt-4 text-xs'>
                  <div className='mr-3 flex min-w-0 flex-1 items-center gap-1.5'>
                    <User size={14} className='shrink-0 opacity-70' />
                    <span className='truncate font-normal' title={manual.uploaderName}>
                      {manual.uploaderName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
