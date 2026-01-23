'use client'

import { useState, useEffect, useMemo } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// นำเข้าสไตล์พื้นฐานเพื่อให้แสดงผลถูกต้อง
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// ✅ Setup Worker จาก CDN ให้ตรงกับเวอร์ชันที่ติดตั้ง
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  fileUrl: string
  pageSelection?: string // รับค่าเป็น "1-5, 8, 11-13" หรือ "all"
}

export default function LockedPDFViewer({ fileUrl, pageSelection = 'all' }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  // ✅ Logic คำนวณหน้าที่จะแสดงผล (รองรับ 1-5, 8, 11-13)
  const pagesToRender = useMemo(() => {
    if (!numPages) return []

    // ถ้าตั้งเป็น all หรือค่าว่าง ให้แสดงทุกหน้า
    if (!pageSelection || pageSelection.toLowerCase() === 'all' || pageSelection.trim() === '') {
      return Array.from({ length: numPages }, (_, i) => i + 1)
    }

    const pages = new Set<number>()
    const groups = pageSelection.split(',')

    groups.forEach((group) => {
      const range = group.trim().split('-')
      if (range.length === 2) {
        // กรณีระบุเป็นช่วง เช่น 1-5
        const start = parseInt(range[0])
        const end = parseInt(range[1])
        if (!isNaN(start) && !isNaN(end)) {
          const min = Math.min(start, end)
          const max = Math.max(start, end)
          for (let i = min; i <= max; i++) {
            if (i <= numPages && i > 0) pages.add(i)
          }
        }
      } else {
        // กรณีระบุหน้าเดียว เช่น 8
        const page = parseInt(group.trim())
        if (!isNaN(page) && page <= numPages && page > 0) {
          pages.add(page)
        }
      }
    })

    // เรียงลำดับหน้าจากน้อยไปมาก
    return Array.from(pages).sort((a, b) => a - b)
  }, [pageSelection, numPages])

  // ปรับขนาด PDF ให้พอดีกับความกว้างของ Div
  useEffect(() => {
    const updateWidth = () => {
      const el = document.getElementById('pdf-wrapper')
      if (el) setContainerWidth(el.offsetWidth - 48) // เผื่อระยะขอบ (Padding)
    }

    // ทำงานทันทีที่ Mount และทุกครั้งที่ Resize
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  return (
    <div
      id='pdf-wrapper'
      className='custom-scrollbar flex h-full w-full flex-col items-center overflow-y-auto bg-slate-100 p-4'
    >
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className='flex animate-pulse items-center justify-center p-20 text-slate-400'>
            กำลังโหลดเอกสาร...
          </div>
        }
        error={
          <div className='p-10 text-center text-rose-500'>
            <p className='font-medium'>ไม่สามารถเปิดไฟล์ PDF ได้</p>
            <p className='mt-2 text-xs opacity-70'>
              โปรดตรวจสอบสิทธิ์การเข้าถึงไฟล์ หรือการตั้งค่า API Proxy
            </p>
          </div>
        }
      >
        {pagesToRender.map((pageNum) => (
          <div
            key={pageNum}
            className='group relative mb-8 border border-slate-200 bg-white shadow-xl transition-transform hover:scale-[1.01]'
          >
            <Page
              pageNumber={pageNum}
              width={containerWidth > 0 ? containerWidth : 500}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
            {/* ป้ายเลขหน้ากำกับ */}
            <div className='absolute top-3 right-3 rounded-full bg-slate-900/60 px-3 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100'>
              หน้า {pageNum} / {numPages}
            </div>
          </div>
        ))}
      </Document>

      {/* กรณีวิเคราะห์แล้วไม่มีหน้าไหนให้แสดง (เช่น ใส่เลขหน้าเกินจริง) */}
      {numPages !== null && pagesToRender.length === 0 && (
        <div className='flex h-64 flex-col items-center justify-center text-slate-400'>
          <p>ระบุช่วงหน้าไม่ถูกต้อง หรือเกินจำนวนหน้าจริง</p>
          <p className='text-xs'>(ไฟล์นี้มีทั้งหมด {numPages} หน้า)</p>
        </div>
      )}
    </div>
  )
}
