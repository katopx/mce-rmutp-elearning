import { defineField, defineType } from "sanity";
import { ClipboardCheck } from "lucide-react";

export default defineType({
  name: "exam",
  title: "ข้อสอบและแบบฝึกหัด",
  type: "document",
  icon: ClipboardCheck,
  fields: [
    defineField({
      name: "title",
      title: "ชื่อหัวข้อ",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    //  1. แยกประเภทการใช้งาน
    defineField({
      name: "category",
      title: "ประเภทการใช้งาน",
      type: "string",
      options: {
        list: [
          { title: "📝 แบบทดสอบวัดผล (Exam)", value: "final_exam" },
          {
            title: "📖 แบบฝึกหัดในห้องเรียน (Exercise)",
            value: "classroom_exercise",
          },
        ],
        layout: "radio",
      },
      initialValue: "classroom_exercise",
    }),

    defineField({
      name: "passingScore",
      title: "เกณฑ์คะแนนผ่าน (%)",
      type: "number",
      initialValue: 60,
      hidden: ({ parent }) => parent?.category === "classroom_exercise",
    }),

    defineField({
      name: "questions",
      title: "รายการข้อสอบ",
      type: "array",
      of: [
        {
          type: "object",
          name: "question",
          fields: [
            // 2. ตัวโจทย์แบบ Rich Text (รองรับ HTML / Video Link / Image)
            {
              name: "content",
              title: "โจทย์ (ข้อความ/วิดีโอ/รูปภาพ)",
              type: "array",
              of: [
                { type: "block" }, // ข้อความธรรมดาและการจัด format
                { type: "image", options: { hotspot: true } }, // รูปภาพประกอบ
                {
                  type: "object",
                  name: "videoEmbed",
                  title: "วิดีโอประกอบโจทย์",
                  fields: [
                    {
                      name: "url",
                      type: "url",
                      title: "Video URL (YouTube/Vimeo)",
                    },
                  ],
                },
                {
                  type: "object",
                  name: "htmlCode",
                  title: "HTML/Code Snippet",
                  fields: [
                    { name: "code", type: "text", title: "HTML Content" },
                  ],
                },
              ],
            },

            // ✅ 3. ส่วนของตัวเลือก
            {
              name: "choices",
              title: "ตัวเลือกคำตอบ",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    {
                      name: "choiceText",
                      title: "ข้อความตัวเลือก",
                      type: "string",
                    },
                    {
                      name: "isCorrect",
                      title: "เป็นข้อที่ถูก",
                      type: "boolean",
                    },
                  ],
                },
              ],
            },
            {
              name: "explanation",
              title: "เฉลยละเอียด",
              type: "text",
            },
          ],
        },
      ],
    }),
  ],
});
