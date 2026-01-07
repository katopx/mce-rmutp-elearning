'use client'

export default function CopyrightText() {
  const currentYear = new Date().getFullYear()
  const text = `สงวนลิขสิทธิ์ ${currentYear} © KATOPX`

  return <div className='text-xs'>{text}</div>
}
