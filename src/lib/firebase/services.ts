import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion, collection, addDoc } from 'firebase/firestore'
import { db } from './config'

/**
 * 1. SYNC USER: จัดการข้อมูลเมื่อ Login ครั้งแรก
 */
export const syncUserDatabase = async (user: any) => {
  if (!user) return null
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    const newUser = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      role: 'student',
      studentInfo: { studentId: '', classGroup: '', level: '' },
      contact: { phone: '', line: '', facebook: '' },
      favorites: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }
    await setDoc(userRef, newUser)
    return newUser
  }

  await updateDoc(userRef, { lastLogin: new Date().toISOString() })
  return userSnap.data()
}

/**
 * 2. ENROLL: ลงทะเบียนเรียน
 */
export const enrollCourse = async (userId: string, course: any) => {
  const enrollmentId = `${userId}_${course._id}`
  const enrollRef = doc(db, 'enrollments', enrollmentId)

  const data = {
    userId: userId,
    courseId: course._id,
    courseSlug: course.slug,
    courseTitle: course.title,
    status: 'active',
    progressPercentage: 0,
    completedLessons: [],
    enrolledAt: serverTimestamp(),
    lastAccessed: serverTimestamp(),
  }

  await setDoc(enrollRef, data)
  return data
}

/**
 * 3. PROGRESS: อัปเดตเมื่อดูวิดีโอจบ/เรียนจบหัวข้อ
 */
export const updateLessonProgress = async (userId: string, courseId: string, lessonId: string) => {
  const enrollmentId = `${userId}_${courseId}`
  const enrollRef = doc(db, 'enrollments', enrollmentId)

  await updateDoc(enrollRef, {
    completedLessons: arrayUnion(lessonId),
    lastAccessed: serverTimestamp(),
  })
}

/**
 * 4. QUIZ: บันทึกคะแนนและ Log คำตอบอย่างละเอียด
 */
export const saveQuizAttempt = async (attemptData: {
  userId: string
  courseId: string
  examId: string
  type: 'pre_test' | 'post_test' | 'exercise'
  score: number
  maxScore: number
  answers: any[]
}) => {
  const attemptsRef = collection(db, 'quiz_attempts')
  return await addDoc(attemptsRef, {
    ...attemptData,
    createdAt: serverTimestamp(),
  })
}

/*******************************************************************************************************/

/**
 * ตรวจสอบว่า User เคยลงทะเบียนคอร์สนี้หรือยัง
 */
export const checkEnrollment = async (userId: string, courseId: string) => {
  if (!userId || !courseId) return null
  const enrollmentId = `${userId}_${courseId}`
  const enrollRef = doc(db, 'enrollments', enrollmentId)
  const snap = await getDoc(enrollRef)

  if (snap.exists()) {
    return snap.data()
  }
  return null
}
