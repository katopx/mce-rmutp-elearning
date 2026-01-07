import { defineField, defineType } from 'sanity'
import { FileText } from 'lucide-react'

export default defineType({
  name: 'manual',
  title: 'คู่มือ - Manual',
  type: 'document',
  icon: FileText,
  fields: [
    defineField({
      name: 'status',
      title: 'สถานะ',
      type: 'string',
      options: {
        list: [
          { title: 'ฉบับร่าง', value: 'draft' },
          { title: 'เผยแพร่', value: 'published' },
        ],
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'title',
      title: 'ชื่อคู่มือ',
      type: 'string',
      description: 'ระบุชื่อคู่มือที่ชัดเจน',
      validation: (Rule) => Rule.required().error('จำเป็นต้องระบุชื่อคู่มือ'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input: string) =>
          input
            .toLowerCase()
            .replace(/[^a-z0-9ก-๙\s-]/gi, '')
            .replace(/[\s-]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'uploaderName',
      title: 'ชื่อผู้อัปโหลด',
      type: 'string',
      initialValue: 'Admin',
      description: 'ชื่อเจ้าหน้าที่หรือผู้ที่จัดเตรียมคู่มือนี้ลงระบบ',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'หมวดหมู่คู่มือ',
      type: 'reference',
      description: 'สามารถเลือกหมวดหมู่ได้มากกว่า 1 หมวดหมู่',
      to: [{ type: 'category' }],
      options: {
        filter: 'categoryType == "manual"',
      },
    }),
    defineField({
      name: 'fileType',
      title: 'ประเภทไฟล์',
      type: 'string',
      initialValue: 'link',
      options: {
        list: [
          { title: '🌐 Website / Link', value: 'link' },
          { title: '📄 PDF Document', value: 'pdf' },
          { title: '📦 ZIP File', value: 'zip' },
          { title: '🎬 Video Link', value: 'video' },
          { title: '🖼️ Image', value: 'image' },
          { title: '🔵 Word (DOCX)', value: 'word' },
          { title: '🟢 Excel (XLSX)', value: 'excel' },
          { title: '🟠 PowerPoint (PPTX)', value: 'powerpoint' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'fileUrl',
      title: 'ลิ้งค์ดาวน์โหลด',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'รายละเอียดคู่มือ',
      type: 'text',
      rows: 3,
      description: 'อธิบายเนื้อหาโดยย่อของคู่มือนี้',
    }),
    defineField({
      name: 'image',
      title: 'ภาพหน้าปกคู่มือ',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      status: 'status',
      category: 'category.title',
      fileType: 'fileType',
      uploader: 'uploaderName',
      media: 'image',
    },
    prepare({ title, status, category, fileType, uploader, media }) {
      const typeIcons: Record<string, string> = {
        link: '🌐',
        pdf: '📄',
        zip: '📦',
        video: '🎬',
        image: '🖼️',
        word: '🔵',
        excel: '🟢',
        powerpoint: '🟠',
      }
      const statusIcon = status === 'published' ? '🟢' : '🟡'
      const statusText = status === 'published' ? 'เผยแพร่' : 'ฉบับร่าง'
      const icon = typeIcons[fileType] || '📁'
      const catLabel = category || 'ทั่วไป'

      return {
        title: `${statusIcon} | ${title}`,
        subtitle: `${icon} [${catLabel}] โดย: ${uploader || 'Admin'}`,
        media: media,
      }
    },
  },
})
