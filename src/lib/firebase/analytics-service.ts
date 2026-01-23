import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from './config'
// Export Type ให้ UI เอาไปใช้ได้ง่ายๆ
export interface AnalyticsData {
  totalStudents: number
  completionRate: number
  averageRating: number
  reviewCount: number
  avgPostTestScore: number
  scoreDistribution: any[]
  recentStudents: any[]
  hardestQuestions: any[]
  enrollmentTrend: any[]
  reviews: any[]
}

export const getCourseAnalytics = async (courseId: string): Promise<AnalyticsData> => {
  // Default Data
  const defaultData: AnalyticsData = {
    totalStudents: 0,
    completionRate: 0,
    averageRating: 0,
    reviewCount: 0,
    avgPostTestScore: 0,
    scoreDistribution: Array(5)
      .fill(0)
      .map((_, i) => ({ range: `${i * 20}-${(i + 1) * 20}%`, preTest: 0, postTest: 0 })),
    recentStudents: [],
    hardestQuestions: [],
    enrollmentTrend: [],
    reviews: [],
  }

  if (!courseId) return defaultData

  try {
    // 1. Enrollment Query
    const enrollRef = collection(db, 'enrollments')
    const qEnroll = query(enrollRef, where('courseId', '==', courseId))
    const enrollSnap = await getDocs(qEnroll)

    const totalStudents = enrollSnap.size
    const completedCount = enrollSnap.docs.filter((d) => d.data().status === 'completed').length
    const completionRate =
      totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0

    // Trend Logic
    const trendMap = new Map<string, number>()
    const months = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ]
    const today = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      trendMap.set(months[d.getMonth()], 0)
    }
    enrollSnap.forEach((doc) => {
      const data = doc.data()
      if (data.enrolledAt) {
        const date = (data.enrolledAt as Timestamp).toDate()
        const monthName = months[date.getMonth()]
        if (trendMap.has(monthName)) trendMap.set(monthName, (trendMap.get(monthName) || 0) + 1)
      }
    })
    const enrollmentTrend = Array.from(trendMap, ([month, students]) => ({ month, students }))

    // 2. Exam Query
    const examRef = collection(db, 'exam_results')
    const qExam = query(examRef, where('courseId', '==', courseId))
    const examSnap = await getDocs(qExam)

    const questionStats = new Map<string, { text: string; wrong: number; total: number }>()
    const studentAttempts = new Map<string, number>()
    let totalPostScore = 0
    let postTestCount = 0
    const distribution = JSON.parse(JSON.stringify(defaultData.scoreDistribution))

    examSnap.forEach((doc) => {
      const d = doc.data()
      if (d.type === 'post_test') {
        studentAttempts.set(d.userId, (studentAttempts.get(d.userId) || 0) + 1)
        const score = d.score || 0
        const total = d.totalScore || 100
        const percent = total > 0 ? (score / total) * 100 : 0

        totalPostScore += percent
        postTestCount++

        const index = Math.min(Math.floor(percent / 20.01), 4)
        distribution[index].postTest++

        if (d.answers && Array.isArray(d.answers)) {
          d.answers.forEach((ans: any) => {
            const qId = ans.questionId
            if (!questionStats.has(qId))
              questionStats.set(qId, { text: ans.questionText || 'ไม่ระบุ', wrong: 0, total: 0 })
            const stat = questionStats.get(qId)!
            stat.total++
            if (!ans.isCorrect) stat.wrong++
          })
        }
      } else {
        const percent = d.totalScore > 0 ? (d.score / d.totalScore) * 100 : 0
        const index = Math.min(Math.floor(percent / 20.01), 4)
        distribution[index].preTest++
      }
    })

    const avgPostTestScore = postTestCount > 0 ? Math.round(totalPostScore / postTestCount) : 0
    const hardestQuestions = Array.from(questionStats.entries())
      .map(([id, stat]) => ({
        questionId: id,
        questionText: stat.text,
        wrongCount: stat.wrong,
        totalAttempts: stat.total,
        difficultyIndex: stat.total > 0 ? Math.round((stat.wrong / stat.total) * 100) : 0,
      }))
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 5)

    // Recent Students with Attempts
    const recentStudents = enrollSnap.docs
      .sort((a, b) => b.data().enrolledAt?.seconds - a.data().enrolledAt?.seconds)
      .map((doc) => {
        const d = doc.data()
        return {
          id: doc.id,
          userId: d.userId,
          name: d.userName || 'Unknown',
          email: d.userEmail || '-',
          image: d.userImage || '',
          enrolledAt: d.enrolledAt,
          lastAccessed: d.lastAccessed,
          progress: d.progressPercentage || 0,
          status: d.status,
          pre: d.assessmentProgress?.preTest?.score || 0,
          post: d.assessmentProgress?.postTest?.score || null,
          attempts: studentAttempts.get(d.userId) || 0,
        }
      })

    // 3. Reviews Query
    const reviewRef = collection(db, 'reviews')
    const qReview = query(reviewRef, where('courseId', '==', courseId))
    const reviewSnap = await getDocs(qReview)
    let totalRating = 0
    const reviews = reviewSnap.docs
      .map((doc) => {
        const d = doc.data()
        totalRating += d.rating || 0
        return {
          id: doc.id,
          userName: d.userName || 'Anonymous',
          userImage: d.userImage || '',
          rating: d.rating || 0,
          comment: d.comment || '',
          createdAt: d.createdAt
            ? (d.createdAt as Timestamp).toDate().toLocaleDateString('th-TH')
            : '-',
        }
      })
      .sort(
        (a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime(),
      ) // Fix sort type slightly loose here for brevity

    const averageRating =
      reviewSnap.size > 0 ? Number((totalRating / reviewSnap.size).toFixed(1)) : 0

    return {
      totalStudents,
      completionRate,
      averageRating,
      reviewCount: reviewSnap.size,
      avgPostTestScore,
      scoreDistribution: distribution,
      recentStudents,
      hardestQuestions,
      enrollmentTrend,
      reviews,
    }
  } catch (error) {
    console.error('Error getting analytics:', error)
    return defaultData
  }
}
