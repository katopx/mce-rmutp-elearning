import { defineField, defineType } from 'sanity'
import { User, Contact, Settings } from 'lucide-react'

export default defineType({
  name: 'instructor',
  title: 'ผู้สอน - Instructor',
  type: 'document',
  icon: User,
  groups: [
    { name: 'profile', title: '👤 ข้อมูลส่วนตัว', default: true },
    { name: 'contact', title: '📞 ช่องทางติดต่อ', icon: Contact },
    { name: 'system', title: '⚙️ ตั้งค่าระบบ', icon: Settings },
  ],
  fields: [
    // Profile Group Fields
    defineField({
      name: 'name',
      title: 'ชื่อ-นามสกุล',
      type: 'string',
      group: 'profile',
      validation: (Rule) => Rule.required().error('จำเป็นต้องระบุชื่อผู้สอน'),
    }),

    //  Identifier Slug Field
    defineField({
      name: 'slug',
      title: 'slug',
      type: 'slug',
      group: 'profile',
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
      name: 'jobPosition',
      title: 'ตำแหน่ง / ความเชี่ยวชาญ',
      type: 'string',
      group: 'profile',
      placeholder: 'เช่น อาจารย์ประจำภาควิชา...',
      initialValue: 'ไม่ระบุ',
    }),

    defineField({
      name: 'bio',
      title: 'ประวัติโดยย่อ',
      type: 'text',
      group: 'profile',
      rows: 4,
    }),

    defineField({
      name: 'image',
      title: 'รูปประจำตัว',
      type: 'image',
      group: 'profile',
      options: { hotspot: true },
    }),

    //  Contact Group Fields
    defineField({
      name: 'contact',
      title: 'ช่องทางการติดต่อ',
      type: 'object',
      group: 'contact',
      fields: [
        {
          name: 'facebook',
          title: 'Facebook URL',
          type: 'url',
          placeholder: 'https://facebook.com/...',
        },
        {
          name: 'line',
          title: 'Line ID',
          type: 'string',
          placeholder: 'เช่น @yourlineid',
        },
        {
          name: 'phone',
          title: 'เบอร์โทรศัพท์',
          type: 'string',
          validation: (Rule) =>
            Rule.regex(/^[0-9+\-\s()]*$/, {
              name: 'phone',
              invert: false,
            }).warning('ควรใส่เฉพาะตัวเลขและเครื่องหมาย + -'),
        },
        {
          name: 'website',
          title: 'เว็บไซต์ / ผลงานส่วนตัว',
          type: 'url',
        },
      ],
    }),

    //  System Group Fields
    defineField({
      name: 'email',
      title: 'อีเมล (Login Email)',
      type: 'string',
      group: 'system',
      description: 'ใช้อีเมลนี้เพื่อเชื่อมโยงกับบัญชีผู้ใช้ที่ Login เข้ามา',
      validation: (Rule) => Rule.required().email(),
    }),
  ],

  preview: {
    select: {
      title: 'name',
      email: 'email',
      image: 'image',
    },
  },
})
