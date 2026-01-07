export const ROLE_DISPLAY = {
  admin: {
    label: 'ผู้ดูแลระบบ',
    color: 'bg-red-500',
  },
  instructor: {
    label: 'อาจารย์ผู้สอน',
    color: 'bg-amber-500',
  },
  student: {
    label: 'นักศึกษา',
    color: 'bg-blue-500',
  },
} as const

export type UserRole = keyof typeof ROLE_DISPLAY
