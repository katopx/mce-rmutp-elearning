'use client'

import dynamic from 'next/dynamic'
import { useMemo, useRef } from 'react'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => (
    <div className='h-[400px] w-full animate-pulse rounded-md border bg-slate-100'></div>
  ),
})

interface TextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
}

export default function TextEditor({ content, onChange, placeholder }: TextEditorProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const config = useMemo(
    () => ({
      readonly: false,
      height: 500,
      placeholder: placeholder || 'เริ่มพิมพ์เนื้อหา...',
      toolbarSticky: false,
      enableDragAndDropFileToEditor: false,
      buttons: [
        'source',
        '|',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'font',
        'fontsize',
        'brush',
        'paragraph',
        '|',
        'ul',
        'ol',
        '|',
        'outdent',
        'indent',
        'align',
        '|',
        'image',
        'video',
        'table',
        'link',
        '|',
        'hr',
        'eraser',
        'copyformat',
        '|',
        'undo',
        'redo',
        'fullsize',
      ],
      uploader: {
        insertImageAsBase64URI: false,
      },
      paste: {
        insertImageAsBase64URI: false,
        defaultActionOnPaste: 'insert_clear_html',
      },
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_clear_html' as const,
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false,
      processPasteHTML: true,
      processPasteFromWord: true,
      beautifyHTML: false,
    }),
    [placeholder],
  )

  return (
    <div className='jodit-wrapper overflow-hidden rounded-md border bg-white text-black shadow-sm'>
      <JoditEditor
        value={typeof content === 'string' ? content : ''}
        config={config}
        onChange={(newContent) => {
          if (timerRef.current) clearTimeout(timerRef.current)

          // หน่วงเวลา 500ms (ครึ่งวินาที) หลังจากหยุดพิมพ์ ถึงจะส่งค่ากลับ
          timerRef.current = setTimeout(() => {
            if (onChange && newContent !== content) {
              onChange(newContent)
            }
          }, 500)
        }}
      />

      <style jsx global>{`
        .jodit-wrapper .jodit-toolbar__box {
          background-color: #f8fafc !important;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .jodit-status-bar {
          display: none !important;
        }

        /* 🔧 กู้คืน Paragraph (ให้มีระยะห่างบรรทัด) */
        .jodit-wysiwyg p {
          margin-bottom: 1em !important;
          line-height: 1.6 !important;
        }

        /* 🔧 กู้คืน Lists (ให้มีจุด/ตัวเลข และไม่ล้นขอบ) */
        .jodit-wysiwyg ul {
          list-style-type: disc !important;
          padding-left: 2.5rem !important; /* ดันเข้ามาไม่ให้ล้น */
          margin-bottom: 1rem !important;
        }
        .jodit-wysiwyg ol {
          list-style-type: decimal !important;
          padding-left: 2.5rem !important; /* ดันเข้ามาไม่ให้ล้น */
          margin-bottom: 1rem !important;
        }
        .jodit-wysiwyg li {
          margin-bottom: 0.5rem !important;
        }

        /* 🔧 กู้คืน Heading (ให้ตัวใหญ่หนา) */
        .jodit-wysiwyg h1 {
          font-size: 2.5em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }
        .jodit-wysiwyg h2 {
          font-size: 2em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }
        .jodit-wysiwyg h3 {
          font-size: 1.75em;
          font-weight: bold;
          margin-bottom: 0.5em;
        }

        /* แก้เรื่อง z-index ของ Popup บางทีโดนบัง */
        .jodit-popup {
          z-index: 9999 !important;
        }
      `}</style>
    </div>
  )
}
