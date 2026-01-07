import { defineField, defineType } from 'sanity'
import { BookOpen } from 'lucide-react'
import { assert } from 'console'

export default defineType({
  name: 'course',
  title: 'หลักสูตร - Course',
  type: 'document',
  icon: BookOpen,
  groups: [
    { name: 'general', title: 'ข้อมูลเบื้องต้น' },
    { name: 'detail', title: 'รายละเอียดหลักสูตร' },
    { name: 'content', title: 'เนื้อหาหลักสูตร' },
    { name: 'stats', title: 'สถิติ' },
    { name: 'references', title: 'การเชื่อมโยง' },
    { name: 'resources', title: 'ไฟล์แนบ' },
  ],
  fields: [
    // General Group Fields
    defineField({
      name: 'status',
      title: 'สถานะ',
      type: 'string',
      group: 'general',
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
      title: 'ชื่อหลักสูตร',
      type: 'string',
      group: 'general',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'slug',
      type: 'slug',
      group: 'general',
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
      name: 'shortDescription',
      title: 'คำอธิบายย่อ',
      type: 'text',
      group: 'general',
      rows: 2,
    }),
    defineField({
      name: 'image',
      title: 'ภาพหน้าปกหลักสูตร',
      type: 'image',
      group: 'general',
      options: { hotspot: true },
    }),

    // Detail Group Fields
    defineField({
      name: 'description',
      title: 'คำอธิบายหลักสูตร',
      type: 'text',
      group: 'detail',
      rows: 5,
    }),
    defineField({
      name: 'objectives',
      title: 'วัตถุประสงค์ของหลักสูตร',
      type: 'array',
      group: 'detail',
      of: [{ type: 'string' }],
    }),

    // Statistic Group Fields
    defineField({
      name: 'difficulty',
      title: 'ระดับของหลักสูตร',
      type: 'string',
      group: 'stats',
      options: {
        list: [
          { title: 'ระดับพื้นฐาน', value: 'Basic' },
          { title: 'ระดับปานกลาง', value: 'Intermediate' },
          { title: 'ระดับสูง', value: 'Advanced' },
        ],
      },
      initialValue: 'Basic',
    }),
    defineField({
      name: 'rating',
      title: 'คะแนนรีวิว',
      type: 'number',
      group: 'stats',
      initialValue: 5,
      validation: (Rule) => Rule.min(0).max(5),
    }),
    defineField({
      name: 'registered',
      title: 'จำนวนผู้ลงทะเบียน',
      type: 'number',
      group: 'stats',
      initialValue: 0,
    }),

    // References Group Fields
    defineField({
      name: 'instructor',
      title: 'ผู้สอนหลัก',
      type: 'reference',
      to: [{ type: 'instructor' }],
      group: 'references',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coInstructors',
      title: 'ผู้สอนร่วม',
      type: 'array',
      group: 'references',
      description: 'สามารถเลือกผู้สอนร่วมได้มากกว่า 1 คน',
      of: [{ type: 'reference', to: [{ type: 'instructor' }] }],
    }),
    defineField({
      name: 'category',
      title: 'หมวดหมู่หลักสูตร',
      type: 'array',
      group: 'references',
      description: 'สามารถเลือกหมวดหมู่ได้มากกว่า 1 หมวดหมู่',
      of: [
        {
          type: 'reference',
          to: [{ type: 'category' }],
          options: {
            filter: 'categoryType == "course"',
          },
        },
      ],
    }),

    // Resources Group Fields
    defineField({
      name: 'resources',
      title: 'ไฟล์แนบ',
      type: 'array',
      group: 'resources',
      of: [
        {
          type: 'object',
          title: 'Resource',
          fields: [
            {
              name: 'title',
              title: 'ชื่อไฟล์',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'fileUrl',
              title: 'ลิ้งค์ดาวน์โหลด',
              type: 'url',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'fileType',
              title: 'ประเภทไฟล์',
              type: 'string',
              initialValue: 'website',
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
            },
          ],
        },
      ],
    }),

    // Content Group Fields
    defineField({
      name: 'modules',
      title: 'โครงสร้างหลักสูตร',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          name: 'module',
          title: 'บท',
          fields: [
            // ชื่อบท (เช่น บทที่ 1 Module)
            {
              name: 'title',
              title: 'ชื่อบท',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },

            // รายการบทเรียนย่อย (Lessons)
            {
              name: 'lessons',
              title: 'เนื้อหาในบทเรียนนี้',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'lesson',
                  title: 'บทเรียน',
                  fields: [
                    // --- ข้อมูลพื้นฐาน ---
                    {
                      name: 'title',
                      title: 'ชื่อหัวข้อ',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'lessonType',
                      title: 'ประเภทเนื้อหา',
                      type: 'string',
                      initialValue: 'video',
                      options: {
                        list: [
                          { title: '🎬 บทเรียนวิดีโอ', value: 'video' },
                          { title: '📄 บทเรียนเนื้อหา', value: 'article' },
                          { title: '📝 แบบฝึกหัด', value: 'exercise' },
                          { title: '📝 แบบทดสอบ', value: 'assessment' },
                        ],
                        layout: 'radio',
                      },
                    },
                    {
                      name: 'isFree',
                      title: 'เปิดให้ดูฟรี (Preview)',
                      type: 'boolean',
                      initialValue: false,
                    },

                    // --- กรณีเลือก Video ---
                    {
                      name: 'videoSource',
                      title: 'แหล่งที่มาของวิดีโอ',
                      type: 'string',
                      initialValue: 'youtube',
                      options: {
                        list: [
                          { title: 'YouTube', value: 'youtube' },
                          { title: 'Google Drive', value: 'gdrive' },
                          { title: 'Vimeo', value: 'vimeo' },
                        ],
                      },
                      hidden: ({ parent }) => parent?.lessonType !== 'video',
                    },
                    {
                      name: 'videoUrl',
                      title: 'ลิงก์วิดีโอ',
                      type: 'url',
                      hidden: ({ parent }) => parent?.lessonType !== 'video',
                    },
                    {
                      name: 'videoContent',
                      title: 'เนื้อหาประกอบวิดีโอ',
                      type: 'text',
                      hidden: ({ parent }) => parent?.lessonType !== 'video',
                    },

                    // --- กรณีเลือก Article  ---
                    {
                      name: 'articleContent',
                      title: 'เนื้อหาบทเรียน',
                      type: 'text',
                      hidden: ({ parent }) => parent?.lessonType !== 'article',
                    },

                    // --- Exercise (ฝังในหลักสูตร - Inline) ---
                    {
                      name: 'exerciseData',
                      title: 'รายละเอียดแบบฝึกหัดทบทวน',
                      type: 'object',
                      hidden: ({ parent }) => parent?.lessonType !== 'exercise',
                      fields: [
                        {
                          name: 'questions',
                          title: 'รายการคำถาม',
                          type: 'array',
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
                                      {
                                        title: 'เลือกตอบคำตอบเดียว (Single Choice)',
                                        value: 'single',
                                      },
                                      {
                                        title: 'เลือกตอบหลายคำตอบ (Multiple Answers)',
                                        value: 'multiple',
                                      },
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
                                // --- ปรนัย (รองรับทั้ง Single และ Multiple) ---
                                {
                                  name: 'choices',
                                  title: 'ตัวเลือกตอบ (สำหรับข้อสอบปรนัย)',
                                  type: 'array',
                                  hidden: ({ parent }) => parent?.questionType === 'text',
                                  of: [
                                    {
                                      type: 'object',
                                      fields: [
                                        {
                                          name: 'choiceText',
                                          title: 'ข้อความตัวเลือก',
                                          type: 'string',
                                        },
                                        {
                                          name: 'choiceImage',
                                          title: 'รูปภาพประกอบตัวเลือก',
                                          type: 'image',
                                        },
                                        {
                                          name: 'isCorrect',
                                          title: 'เป็นคำตอบที่ถูก',
                                          type: 'boolean',
                                        },
                                      ],
                                      preview: {
                                        select: {
                                          title: 'choiceText',
                                          isCorrect: 'isCorrect',
                                          media: 'choiceImage',
                                        },
                                        prepare(selection: any) {
                                          const { title, isCorrect, media } = selection
                                          return {
                                            title: title || 'ไม่มีข้อความ',
                                            subtitle: isCorrect ? '✅' : '❌',
                                            media: media,
                                          }
                                        },
                                      },
                                    },
                                  ],
                                },
                                // --- อัตนัย (เติมคำ) ---
                                {
                                  name: 'correctAnswerText',
                                  title: 'คำตอบที่ถูกต้อง (สำหรับเติมคำ)',
                                  type: 'string',
                                  hidden: ({ parent }) => parent?.questionType !== 'text',
                                },
                                {
                                  name: 'explanation',
                                  title: 'เฉลยละเอียด / คำอธิบาย',
                                  type: 'text',
                                },
                              ],
                              // Preview สำหรับรายการคำถาม
                              preview: {
                                select: { content: 'content', type: 'questionType' },
                                prepare(selection: any) {
                                  const { content, type } = selection
                                  const cleanTitle = content
                                    ? content.replace(/<[^>]*>/g, '').substring(0, 40) + '...'
                                    : 'ไม่มีเนื้อหาโจทย์'
                                  const typeLabel =
                                    type === 'single'
                                      ? 'ข้อเดียว'
                                      : type === 'multiple'
                                        ? 'หลายคำตอบ'
                                        : 'เติมคำ'
                                  return {
                                    title: cleanTitle,
                                    subtitle: `รูปแบบ: ${typeLabel}`,
                                  }
                                },
                              },
                            },
                          ],
                        },
                      ],
                    },

                    // --- Assessment (อ้างอิงจากคลังข้อสอบ exam.ts - Reference exam.ts) ---
                    {
                      name: 'assessmentReference',
                      title: 'เลือกแบบทดสอบจากคลัง',
                      type: 'reference',
                      to: [{ type: 'exam' }],
                      hidden: ({ parent }) => parent?.lessonType !== 'assessment',
                    },

                    // --- ระบุความยาวบทเรียน (นาที) ---
                    {
                      name: 'lessonDuration',
                      title: 'ความยาวบทเรียน (นาที)',
                      type: 'number',
                      initialValue: 0,
                      hidden: ({ parent }) =>
                        parent?.lessonType !== 'video' && parent?.lessonType !== 'article',
                    },

                    // --- กรณีเลือก Quiz (จะโชว์เฉพาะตอนเลือก Quiz) ---
                    // {
                    //   name: 'quizReference',
                    //   title: 'เลือกชุดข้อสอบ',
                    //   description: 'เลือกข้อสอบที่สร้างไว้',
                    //   type: 'reference',
                    //   to: [{ type: 'exam' }],
                    //   hidden: ({ parent }) => parent?.lessonType !== 'quiz',
                    // },
                  ],

                  // จัดหน้า Preview
                  preview: {
                    select: {
                      title: 'title',
                      lessonType: 'lessonType',
                      lessonDuration: 'lessonDuration',
                      isFree: 'isFree',
                    },
                    prepare({ title, lessonType, lessonDuration, isFree }) {
                      const icons: Record<string, string> = {
                        video: '🎬 Video',
                        article: '📄 Article',
                        exercise: '📝 Exercise',
                        assessment: '📝 Assessment',
                      }
                      let subtitleInfo = icons[lessonType] || 'Unknown'

                      if (lessonDuration && lessonDuration > 0) {
                        subtitleInfo += ` • ${lessonDuration} min`
                      }

                      return {
                        title: title + (isFree ? ' [🆓 FREE]' : ''),
                        subtitle: subtitleInfo,
                      }
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      instructorName: 'instructor.name',
      status: 'status',
      modules: 'modules',
      media: 'image',
    },
    prepare({ title, instructorName, status, modules, media }) {
      let totalMinutes = 0
      if (modules && Array.isArray(modules)) {
        modules.forEach((module: any) => {
          if (module.lessons && Array.isArray(module.lessons)) {
            module.lessons.forEach((lesson: any) => {
              totalMinutes += lesson.lessonDuration || 0
            })
          }
        })
      }

      // 2. จัดรูปแบบการแสดงผลเวลา
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      const durationLabel = hours > 0 ? `${hours} ชม. ${minutes} นาที` : `${minutes} นาที`

      // 3. กำหนดป้ายสถานะ
      const statusIcon = status === 'published' ? '🟢' : '🟡'
      const statusText = status === 'published' ? 'เผยแพร่' : 'ฉบับร่าง'

      return {
        title: `${statusIcon} | ${title}`,
        subtitle: `ผู้สอน: ${instructorName || 'ไม่ระบุ'} | ⏳ ${durationLabel}`,
        media: media,
      }
    },
  },
})
