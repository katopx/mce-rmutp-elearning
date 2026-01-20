import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  getCountFromServer,
  deleteDoc,
} from 'firebase/firestore'
import { db } from './config'

// ==========================================
// 1. USER MANAGEMENT
// ==========================================
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

  // อัปเดตเวลา Login ล่าสุดทุกครั้งที่เข้าใช้งาน
  await updateDoc(userRef, { lastLogin: new Date().toISOString() })
  return userSnap.data()
}

// ==========================================
// 2. ENROLLMENT (ลงทะเบียน & สถานะการเรียน)
// ==========================================

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

export const enrollCourse = async (userId: string, course: any) => {
  const enrollmentId = `${userId}_${course._id}`
  const enrollRef = doc(db, 'enrollments', enrollmentId)

  // เช็คก่อนว่าเคยลงหรือยัง จะได้ไม่ทับข้อมูลเก่า
  const existing = await getDoc(enrollRef)
  if (existing.exists()) return existing.data()

  const data = {
    userId: userId,
    courseId: course._id,
    courseSlug: course.slug,
    courseTitle: course.title,
    status: 'in_progress', // active, in_progress, completed
    progressPercentage: 0,
    completedLessons: [], // เก็บ lessonId

    // ✅ เพิ่ม: ส่วนเก็บสถานะการสอบ (Assessment Progress)
    assessmentProgress: {
      preTest: {
        isCompleted: false,
        score: 0,
        completedAt: null,
      },
      postTest: {
        isPassed: false,
        score: 0,
        completedAt: null,
        attempts: 0, // จำนวนครั้งที่สอบ
      },
    },

    enrolledAt: serverTimestamp(),
    lastAccessed: serverTimestamp(),
  }

  await setDoc(enrollRef, data)
  return data
}

export const updateLessonProgress = async (userId: string, courseId: string, lessonId: string) => {
  const enrollmentId = `${userId}_${courseId}`
  const enrollRef = doc(db, 'enrollments', enrollmentId)

  await updateDoc(enrollRef, {
    completedLessons: arrayUnion(lessonId),
    lastAccessed: serverTimestamp(),
  })
}

// อัปเดต % ความคืบหน้า (เรียกใช้เมื่อเรียนจบแต่ละบท)
export const updateCourseProgressPercentage = async (
  userId: string,
  courseId: string,
  percent: number,
) => {
  const enrollmentId = `${userId}_${courseId}`
  const enrollRef = doc(db, 'enrollments', enrollmentId)

  const safePercent = Math.min(100, Math.max(0, percent))

  await updateDoc(enrollRef, {
    progressPercentage: safePercent,
    lastAccessed: serverTimestamp(),
    // ถ้าเรียนครบ 100% แต่ยังไม่สอบ Post-test ก็ยังไม่ถือว่า completed (รอสอบผ่านก่อน)
  })
}

// ==========================================
// 3. EXAM & ASSESSMENT (การสอบ)
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
// ==========================================
// 4. BOOKMARKS & REVIEWS & RATINGS
// ==========================================

// ฟังก์ชันจัดการ Bookmark (Toggle)
export const toggleBookmark = async (userId: string, courseId: string, isBookmarked: boolean) => {
  const bookmarkId = `${userId}_${courseId}`
  const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmarkId)

  if (isBookmarked) {
    // ถ้าเคยบันทึกแล้ว -> ให้ลบออก
    await deleteDoc(bookmarkRef)
    return false
  } else {
    // ถ้ายังไม่เคย -> ให้บันทึกใหม่
    await setDoc(bookmarkRef, {
      courseId,
      savedAt: new Date().toISOString(),
    })
    return true
  }
}

// ฟังก์ชันจัดการ การดึงจำนวนผู้ลงทะเบียนคอร์ส
export const getRegisteredCount = async (courseId: string) => {
  const coll = collection(db, 'enrollments')
  const q = query(coll, where('courseId', '==', courseId))
  const snapshot = await getCountFromServer(q)
  return snapshot.data().count
}

// เช็คสถานะ Bookmark ตอนโหลดหน้า
export const checkBookmarkStatus = async (userId: string, courseId: string) => {
  const bookmarkId = `${userId}_${courseId}`
  const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmarkId)
  const snap = await getDoc(bookmarkRef)
  return snap.exists()
}

// ส่งรีวิว
export const submitReview = async (
  userId: string,
  data: {
    courseId: string
    rating: number
    comment: string
    userName: string
    userImage: string
  },
) => {
  // บันทึกรีวิวลงคอลเลกชัน reviews
  await addDoc(collection(db, 'reviews'), {
    ...data,
    createdAt: serverTimestamp(),
  })

  // อัปเดตสถานะใน enrollment ว่า "รีวิวแล้ว" จะได้ไม่เด้งซ้ำ
  const enrollmentId = `${userId}_${data.courseId}`
  await updateDoc(doc(db, 'enrollments', enrollmentId), {
    isRated: true,
  })
}

// เช็คว่าเคยรีวิวคอร์สนี้หรือยัง
export const checkIsRated = async (userId: string, courseId: string) => {
  const enrollmentId = `${userId}_${courseId}`
  const snap = await getDoc(doc(db, 'enrollments', enrollmentId))
  return snap.data()?.isRated || false
}

export const getCourseRatingStats = async (courseId: string) => {
  try {
    const q = query(collection(db, 'reviews'), where('courseId', '==', courseId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { average: 0, count: 0 }
    }

    let totalScore = 0
    querySnapshot.forEach((doc) => {
      totalScore += doc.data().rating
    })

    const count = querySnapshot.size
    const average = (totalScore / count).toFixed(1) // ทศนิยม 1 ตำแหน่ง เช่น 4.0

    return { average: Number(average), count }
  } catch (error) {
    console.error('Error fetching rating stats:', error)
    return { average: 0, count: 0 }
  }
}
