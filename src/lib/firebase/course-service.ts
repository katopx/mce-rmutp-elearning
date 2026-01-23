import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getCountFromServer,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db } from './config'

// ==========================================
// ENROLLMENT (ลงทะเบียน & สถานะการเรียน)
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

export const enrollCourse = async (
  userId: string,
  course: any,
  userData?: { name: string; image: string },
) => {
  const enrollmentId = `${userId}_${course._id}`
  const enrollRef = doc(db, 'enrollments', enrollmentId)

  // เช็คก่อนว่าเคยลงหรือยัง จะได้ไม่ทับข้อมูลเก่า
  const existing = await getDoc(enrollRef)
  if (existing.exists()) return existing.data()

  const data = {
    userId: userId,
    userName: userData?.name || '',
    userImage: userData?.image || '',
    courseId: course._id,
    courseSlug: course.slug,
    courseTitle: course.title,
    status: 'in_progress', // active, in_progress, completed
    progressPercentage: 0,
    completedLessons: [],

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
        attempts: 0,
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
  })
}

// ==========================================
// Stats & Info
// ==========================================

// ฟังก์ชันจัดการ การดึงจำนวนผู้ลงทะเบียนคอร์ส
export const getRegisteredCount = async (courseId: string) => {
  const coll = collection(db, 'enrollments')
  const q = query(coll, where('courseId', '==', courseId))
  const snapshot = await getCountFromServer(q)
  return snapshot.data().count
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

/**
 *  ดึงสถิติรวมของคอร์ส
 */
export const getCourseStats = async (courseId: string) => {
  try {
    // 1. เรียกใช้ฟังก์ชันเดิมเพื่อนับจำนวนคนเรียน
    const registered = await getRegisteredCount(courseId)

    // 2. เรียกใช้ฟังก์ชันเดิมเพื่อหาคะแนนเฉลี่ย
    const ratingStats = await getCourseRatingStats(courseId)

    // 3. รวมผลลัพธ์ส่งกลับไป
    return {
      registered: registered,
      rating: ratingStats.average,
      reviewCount: ratingStats.count,
    }
  } catch (error) {
    console.error(`Error getting course stats for ${courseId}:`, error)
    return { registered: 0, rating: 0, reviewCount: 0 }
  }
}
