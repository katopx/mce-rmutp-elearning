import { PlayCircle, FileText, Trophy, CopyCheck } from 'lucide-react'

// src={getFileIcon(resource.fileType.icon})}
export const getFileIcon = (type: string | undefined) => {
  const fileType = type?.toLowerCase() || 'link'

  return (
    {
      link: { label: 'เว็บไซต์ / ลิงก์', icon: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png' },
      zip: { label: 'ไฟล์บีบอัด', icon: 'https://cdn-icons-png.flaticon.com/512/4726/4726042.png' },
      video: { label: 'วิดีโอ', icon: 'https://cdn-icons-png.flaticon.com/512/10260/10260977.png' },
      image: { label: 'รูปภาพ', icon: 'https://cdn-icons-png.flaticon.com/512/8760/8760611.png' },
      pdf: { label: 'PDF', icon: 'https://cdn-icons-png.flaticon.com/512/337/337946.png' },
      word: { label: 'Word', icon: 'https://cdn-icons-png.flaticon.com/512/4725/4725970.png' },
      excel: { label: 'Excel', icon: 'https://cdn-icons-png.flaticon.com/512/4726/4726040.png' },
      powerpoint: { label: 'PowerPoint', icon: 'https://cdn-icons-png.flaticon.com/512/4726/4726016.png' },
    }[fileType] || { label: 'ลิงก์', icon: 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png' }
  )
}

//{getCourseDifficulty(course.difficulty).label}
export const getCourseDifficulty = (difficulty: string | undefined) => {
  return (
    {
      basic: { label: 'ระดับพื้นฐาน', color: 'bg-green-100 text-green-700' },
      intermediate: { label: 'ระดับกลาง', color: 'bg-orange-100 text-orange-700' },
      advanced: { label: 'ระดับสูง', color: 'bg-red-100 text-red-700' },
    }[difficulty?.toLowerCase() || ''] || {
      label: difficulty || '-',
      color: 'bg-slate-100 text-slate-700',
    }
  )
}

// {getLessonType(lesson.lessonType).label}
export const getLessonType = (type: string | undefined) => {
  const lessonType = type?.toLowerCase() || ''
  const types = {
    video: { label: 'บทเรียนวิดีโอ', icon: PlayCircle, color: 'text-blue-500' },
    article: { label: 'บทเรียนเนื้อหา', icon: FileText, color: 'text-slate-400' },
    quiz: { label: 'แบบทดสอบ', icon: Trophy, color: 'text-orange-500' },
    exercise: { label: 'แบบฝึกหัด', icon: CopyCheck, color: 'text-green-500' },
  }
  return types[lessonType as keyof typeof types] || types.article
}

// {getCourseStatus(course.status).label}
export const getCourseStatus = (status: string | undefined) => {
  const currentStatus = status?.toLowerCase() || 'draft'
  return (
    {
      published: {
        label: 'เผยแพร่แล้ว',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: '🟢',
      },
      draft: {
        label: 'ฉบับร่าง',
        color: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: '🟡',
      },
    }[currentStatus] || {
      label: 'ไม่ระบุ',
      color: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: '⚪',
    }
  )
}
