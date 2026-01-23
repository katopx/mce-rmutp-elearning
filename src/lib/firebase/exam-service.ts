import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ==========================================
// EXAM & ASSESSMENT (การสอบ)
// ==========================================

/**
 * บันทึกผลสอบลง Collection 'exam_results'
 * และอัปเดตสถานะใน 'enrollments' ด้วย
 */
export const saveExamResult = async (
  userId: string,
  courseId: string,
  examData: {
    examId: string
    type: 'pre_test' | 'post_test'
    score: number
    totalScore: number
    isPassed: boolean
    timeTaken: number // วินาทีที่ใช้ไป
    answers?: any[] // รายละเอียดการตอบแต่ละข้อ
  },
) => {
  try {
    // 1. บันทึกลง History (เก็บทุกครั้งที่สอบ)
    const resultRef = await addDoc(collection(db, 'exam_results'), {
      userId,
      courseId,
      ...examData,
      submittedAt: serverTimestamp(),
    })

    // 2. อัปเดตสถานะใน Enrollment (เพื่อให้หน้า Classroom รู้เรื่อง)
    const enrollmentId = `${userId}_${courseId}`
    const enrollRef = doc(db, 'enrollments', enrollmentId)

    // เตรียมข้อมูลที่จะอัปเดต
    const updatePayload: any = {
      lastAccessed: serverTimestamp(),
    }

    if (examData.type === 'pre_test') {
      // Pre-test: แค่บอกว่าทำแล้ว
      updatePayload['assessmentProgress.preTest'] = {
        isCompleted: true,
        score: examData.score,
        completedAt: new Date().toISOString(),
      }
    } else if (examData.type === 'post_test') {
      // Post-test: ต้องเช็คว่าผ่านไหม
      if (examData.isPassed) {
        updatePayload['status'] = 'completed' // จบหลักสูตร!
        updatePayload['completedAt'] = serverTimestamp()
      }

      updatePayload['assessmentProgress.postTest'] = {
        isPassed: examData.isPassed,
        score: examData.score,
        completedAt: new Date().toISOString(),
        // หมายเหตุ: attempts ต้องบวกเพิ่ม (ต้องทำ Logic อ่านก่อนเขียน หรือใช้ increment ของ Firestore)
        // เพื่อความง่ายใน MVP อาจจะยังไม่ต้องนับ attempts เป๊ะๆ ตรงนี้ก็ได้
      }
    }

    await updateDoc(enrollRef, updatePayload)

    return { success: true, resultId: resultRef.id }
  } catch (error) {
    console.error('Error saving exam:', error)
    return { success: false, error }
  }
}

/**
 * ดึงประวัติการสอบล่าสุด (ใช้เช็คว่าสอบ Pre-test หรือยัง)
 */
export const getLatestExamResult = async (
  userId: string,
  courseId: string,
  type: 'pre_test' | 'post_test',
) => {
  const q = query(
    collection(db, 'exam_results'),
    where('userId', '==', userId),
    where('courseId', '==', courseId),
    where('type', '==', type),
    orderBy('submittedAt', 'desc'),
    limit(1),
  )

  const querySnapshot = await getDocs(q)
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data()
  }
  return null
}

// ใช้ตอนกดดูรายละเอียดคำตอบใน Dashboard
export const getStudentExamDetails = async (courseId: string, userId: string) => {
  const q = query(
    collection(db, 'exam_results'),
    where('courseId', '==', courseId),
    where('userId', '==', userId),
    where('type', '==', 'post_test'),
    orderBy('submittedAt', 'desc'),
    limit(1),
  )
  const snap = await getDocs(q)
  return !snap.empty ? snap.docs[0].data() : null
}

/**
 * ดึงประวัติการสอบทั้งหมดของผู้เรียนในคอร์สนั้น (เรียงจากใหม่ -> เก่า)
 */
export const getStudentExamHistory = async (courseId: string, userId: string) => {
  const q = query(
    collection(db, 'exam_results'),
    where('courseId', '==', courseId),
    where('userId', '==', userId),
    where('type', '==', 'post_test'), // ดูเฉพาะ Post-test
    orderBy('submittedAt', 'desc'), // ไม่ใส่ limit(1) แล้ว เพราะจะเอาทั้งหมด
  )

  const snap = await getDocs(q)
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}
