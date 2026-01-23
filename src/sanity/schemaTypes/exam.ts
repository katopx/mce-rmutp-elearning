import { defineField, defineType } from 'sanity'
import { ClipboardCheck, Settings, ShieldCheck, ListChecks } from 'lucide-react'

export default defineType({
  name: 'exam',
  title: 'คลังข้อสอบ (Assessments)',
  type: 'document',
  icon: ClipboardCheck,
  groups: [
    { name: 'content', title: 'เนื้อหาข้อสอบ', icon: ListChecks },
    { name: 'settings', title: 'ตั้งค่าการสอบ', icon: Settings },
    { name: 'security', title: 'ความปลอดภัย', icon: ShieldCheck },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'ชื่อชุดข้อสอบ',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),

    // --- ส่วนการตั้งค่า (Settings Group) ---
    defineField({
      name: 'passingScore',
      title: 'เกณฑ์คะแนนผ่าน (%)',
      type: 'number',
      group: 'settings',
      initialValue: 60,
    }),
    defineField({
      name: 'maxAttempts',
      title: 'จำนวนครั้งที่สามารถทำได้',
      type: 'number',
      description: 'ใส่ 0 หากไม่จำกัดจำนวนครั้ง',
      group: 'settings',
      initialValue: 0,
    }),

    defineField({
      name: 'timeLimit',
      title: 'เวลาในการทำ (นาที)',
      type: 'number',
      description: 'ใส่ 0 หากไม่จำกัดเวลา',
      group: 'settings',
      initialValue: 0,
    }),
    defineField({
      name: 'shuffleQuestions',
      title: 'สลับลำดับคำถาม (Shuffle Questions)',
      type: 'boolean',
      group: 'settings',
      initialValue: false,
    }),
    defineField({
      name: 'shuffleChoices',
      title: 'สลับลำดับตัวเลือก (Shuffle Choices)',
      type: 'boolean',
      group: 'settings',
      initialValue: false,
    }),
    defineField({
      name: 'showResultImmediate',
      title: 'แสดงคะแนนทันทีหลังสอบเสร็จ',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
    defineField({
      name: 'allowReview',
      title: 'อนุญาตให้ดูเฉลยและคำอธิบายหลังสอบ',
      type: 'boolean',
      group: 'settings',
      initialValue: false,
    }),

    // --- ส่วนความปลอดภัย (Security Group) ---
    defineField({
      name: 'preventTabSwitch',
      title: 'ป้องกันการสลับหน้าจอ (Anti-Cheat)',
      description: 'ระบบจะแจ้งเตือนหรือส่งคำตอบทันทีเมื่อมีการสลับ Tab',
      type: 'boolean',
      group: 'security',
      initialValue: false,
    }),
    defineField({
      name: 'preventCopyPaste',
      title: 'ป้องกันการคัดลอก/วาง (Disable Copy-Paste)',
      type: 'boolean',
      group: 'security',
      initialValue: false,
    }),

    // --- ส่วนเนื้อหาข้อสอบ (Questions) ---
    defineField({
      name: 'questions',
      title: 'รายการข้อสอบ',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          name: 'questionItem',
          fields: [
            {
              name: 'questionType',
              title: 'รูปแบบคำถาม',
              type: 'string',
              options: {
                list: [
                  { title: 'เลือกตอบคำตอบเดียว (Single Choice)', value: 'single' },
                  { title: 'เลือกตอบหลายคำตอบ (Multiple Answers)', value: 'multiple' },
                  { title: 'เติมคำ/อธิบาย (Short Answer)', value: 'text' },
                ],
              },
              initialValue: 'single',
            },
            {
              name: 'content',
              title: 'โจทย์ (ข้อความ/รูปภาพ)',
              type: 'text',
            },
            // ตัวเลือกสำหรับปรนัย (Single/Multiple)
            {
              name: 'choices',
              title: 'ตัวเลือกตอบ (สำหรับข้อสอบปรนัย)',
              type: 'array',
              hidden: ({ parent }) => parent?.questionType === 'text',
              of: [
                {
                  type: 'object',
                  preview: {
                    select: {
                      title: 'choiceText',
                      isCorrect: 'isCorrect',
                      media: 'choiceImage',
                    },
                    prepare(selection) {
                      const { title, isCorrect, media } = selection
                      return {
                        title: title || 'ไม่มีข้อความ',
                        // แสดงสถานะ ถูก/ผิด ใน Subtitle
                        subtitle: isCorrect ? '✅' : '❌',
                        media: media,
                      }
                    },
                  },
                  fields: [
                    { name: 'choiceText', title: 'ข้อความตัวเลือก', type: 'string' },
                    { name: 'choiceImage', title: 'รูปภาพประกอบตัวเลือก', type: 'image' },
                    { name: 'isCorrect', title: 'เป็นคำตอบที่ถูก', type: 'boolean' },
                  ],
                },
              ],
            },
            // คำตอบสำหรับอัตนัย (Text)
            {
              name: 'correctAnswerText',
              title: 'คำตอบที่ถูกต้อง (สำหรับเติมคำ)',
              type: 'string',
              description: 'ในกรณีเติมคำ ให้ใส่คำตอบที่ถูกต้องที่สุดไว้ที่นี่',
              hidden: ({ parent }) => parent?.questionType !== 'text',
            },
            {
              name: 'explanation',
              title: 'เฉลยละเอียด / คำอธิบาย',
              type: 'text',
            },
          ],
          preview: {
            select: {
              title: 'content',
              type: 'questionType',
            },
            prepare(selection: any) {
              const { title, type } = selection

              // สร้าง Map สำหรับแปลงค่า Type เป็นภาษาไทยให้แอดมินอ่านง่าย
              const typeMap: any = {
                single: 'เลือกตอบข้อเดียว',
                multiple: 'เลือกตอบหลายข้อ',
                text: 'เติมคำ/อธิบาย',
              }

              // ล้าง Tag HTML (ถ้ามี) และตัดข้อความให้สั้นลงเพื่อความสวยงาม
              const cleanTitle = title
                ? title.replace(/<[^>]*>/g, '').substring(0, 100)
                : 'ไม่มีเนื้อหาโจทย์'

              return {
                title: cleanTitle,
                subtitle: `รูปแบบ: ${typeMap[type] || type}`,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      questions: 'questions',
      timeLimit: 'timeLimit',
    },
    prepare({ title, questions, timeLimit }) {
      return {
        title: title,
        subtitle:
          `ข้อสอบ: ${questions?.length || 0} ข้อ` + (timeLimit ? ` | เวลา: ${timeLimit} นาที` : ''),
        icon: ClipboardCheck,
      }
    },
  },
})
