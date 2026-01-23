import CourseAnalyticsDashboard from './CourseAnalyticsDashboard'

interface AnalyticsPageProps {
  params: Promise<{ courseId: string }>
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { courseId } = await params

  // เช็คดูว่า ID มาจริงไหม
  console.log('✅ Analytics Page - CourseID:', courseId)

  return (
    <div className='p-6'>
      <CourseAnalyticsDashboard courseId={courseId} />
    </div>
  )
}
