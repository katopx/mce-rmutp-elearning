'use client'

export default function HomePage() {
  return (
    <div className='flex flex-1 flex-col gap-8 p-6 md:p-8'>
      {/* ส่วนหัว: ต้อนรับนักศึกษา */}
      <section className='flex flex-col gap-2 rounded-2xl bg-blue-600 p-8 text-white shadow-md'>
        <h1 className='text-2xl font-semibold'>กำลังพัฒนาระบบ</h1>
        <p className='text-base text-blue-100 opacity-90'>กำลังพัฒนาระบบ</p>
      </section>
    </div>
  )
}
