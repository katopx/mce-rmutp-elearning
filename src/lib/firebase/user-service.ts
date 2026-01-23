import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  collection,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore'
import { db } from './config'

// ==========================================
// SYNC USER PROFILE
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
// TOGGLE BOOKMARK COURSE
// ==========================================
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

// ==========================================
// CHECK BOOKMARK STATUS
// ==========================================
export const checkBookmarkStatus = async (userId: string, courseId: string) => {
  const bookmarkId = `${userId}_${courseId}`
  const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmarkId)
  const snap = await getDoc(bookmarkRef)
  return snap.exists()
}

// ==========================================
// UPDATE USER PROFILE
// ==========================================
export async function updateUserProfile(uid: string, data: any) {
  try {
    const userRef = doc(db, 'users', uid)
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, error }
  }
}

// ดึงรายการที่ลงทะเบียนเรียน
export const getMyEnrollments = async (userId: string) => {
  const q = query(
    collection(db, 'enrollments'),
    where('userId', '==', userId),
    orderBy('lastAccessed', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

// ดึงรายการโปรด (Bookmarks)
export const getMyBookmarks = async (userId: string) => {
  try {
    // ดึงจาก Sub-collection: users/{userId}/bookmarks
    const bookmarkRef = collection(db, 'users', userId, 'bookmarks')
    const snap = await getDocs(bookmarkRef)

    // คืนค่ากลับไปเป็นแค่ [ "id1", "id2", ... ]
    return snap.docs.map((doc) => doc.data().courseId)
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return []
  }
}
