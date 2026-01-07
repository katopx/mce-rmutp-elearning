import { defineField, defineType } from 'sanity'
import { Tag } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import React from 'react'

export default defineType({
  name: 'category',
  title: 'หมวดหมู่ - Category',
  type: 'document',
  icon: Tag,
  fields: [
    defineField({
      name: 'categoryType',
      title: 'ประเภทหมวดหมู่',
      type: 'string',
      description: 'เลือกประเภทการใช้งานของหมวดหมู่นี้',
      options: {
        list: [
          { title: 'หลักสูตรเรียน', value: 'course' },
          { title: 'คู่มือ', value: 'manual' },
        ],
        layout: 'radio',
      },
      initialValue: 'course',
      validation: (Rule) => Rule.required().error('จำเป็นต้องเลือกประเภทหมวดหมู่'),
    }),
    defineField({
      name: 'title',
      title: 'ชื่อหมวดหมู่',
      type: 'string',
      description: 'เช่น PLC, Iot',
      validation: (Rule) => Rule.required().error('จำเป็นต้องระบุชื่อหมวดหมู่'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input: string, schemaType: any, context: any) => {
          const categoryType = context.parent?.categoryType

          let prefix = ''
          if (categoryType === 'course') prefix = 'c-'
          if (categoryType === 'manual') prefix = 'm-'

          const slugifiedTitle = input
            .toLowerCase()
            .replace(/[^a-z0-9ก-๙\s-]/gi, '')
            .replace(/[\s-]+/g, '-')
            .replace(/^-|-$/g, '')

          return `${prefix}${slugifiedTitle}`.slice(0, 96)
        },
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'คำอธิบายหมวดหมู่',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'color',
      title: 'สีประจำหมวดหมู่',
      type: 'string',
      initialValue: '#3b82f6',
    }),
    defineField({
      name: 'icon',
      title: 'ไอคอนหมวดหมู่',
      type: 'string',
      description: 'ระบุชื่อไอคอนจาก Lucide เช่น Book, Settings, Monitor',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      type: 'categoryType',
      iconName: 'icon',
    },
    prepare({ title, type, iconName }) {
      const IconComponent = (LucideIcons as any)[iconName]

      const typeMap: Record<string, string> = {
        course: '🎓 หลักสูตร',
        manual: '📖 คู่มือ',
      }

      return {
        title: title,
        subtitle: typeMap[type] || 'ไม่ระบุประเภท',
        media: IconComponent ? React.createElement(IconComponent) : Tag,
      }
    },
  },
})
