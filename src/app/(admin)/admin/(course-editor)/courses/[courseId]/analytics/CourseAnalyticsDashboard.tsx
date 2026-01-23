'use client'

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  History,
  Percent,
  Star,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnalyticsData, getCourseAnalytics, getStudentExamHistory } from '@/lib/firebase'

// --- Helper: Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='rounded-lg border bg-white p-3 text-sm shadow-xl'>
        <p className='mb-2 font-semibold text-slate-900'>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className='mb-1 flex items-center gap-2 text-xs text-slate-500'>
            <div
              className='h-2 w-2 rounded-full'
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className='capitalize'>
              {entry.name === 'preTest' ? 'ก่อนเรียน' : 'หลังเรียน'} :{' '}
              <span className='ml-1 font-mono font-medium text-slate-900'>{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

interface DashboardProps {
  courseId: string
}

export default function CourseAnalyticsDashboard({ courseId }: DashboardProps) {
  const router = useRouter()

  // --- States ---
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)

  // Sorting State
  const [sortOption, setSortOption] = useState('date-new') // date-new, date-old, score-high, score-low

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  // History States
  const [examHistory, setExamHistory] = useState<any[]>([]) // รายการสอบทั้งหมด
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null) // ID ของรอบที่เลือกดู
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Computed: ข้อมูลของรอบที่เลือก
  const currentAttempt = examHistory.find((ex) => ex.id === selectedAttemptId)

  // --- Fetch Main Data ---
  useEffect(() => {
    async function fetchData() {
      if (!courseId) return
      setLoading(true)
      try {
        const result = await getCourseAnalytics(courseId)
        setData(result)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [courseId])

  // --- Sorting Logic (UseMemo) ---
  const sortedStudents = useMemo(() => {
    if (!data?.recentStudents) return []

    // Clone array เพื่อไม่ให้กระทบ state หลัก
    const students = [...data.recentStudents]

    // Helper: แปลงวันที่ให้เป็นตัวเลข (Timestamp Milliseconds)
    const getTime = (dateVal: any) => {
      if (!dateVal) return 0
      if (typeof dateVal.toDate === 'function') return dateVal.toDate().getTime() // Firestore Object
      if (dateVal.seconds) return dateVal.seconds * 1000 // Firestore Plain Object
      return new Date(dateVal).getTime() // String or Date
    }

    return students.sort((a: any, b: any) => {
      // คะแนน (ใช้ post หรือ score หรือ 0)
      const scoreA = Number(a.post ?? 0)
      const scoreB = Number(b.post ?? 0)

      // วันที่
      const dateA = getTime(a.enrolledAt)
      const dateB = getTime(b.enrolledAt)

      switch (sortOption) {
        case 'score-high': // คะแนนมาก -> น้อย
          return scoreB - scoreA
        case 'score-low': // คะแนนน้อย -> มาก
          return scoreA - scoreB
        case 'date-new': // ใหม่ -> เก่า (Default ของ Firebase มักจะเรียงมาแล้ว)
          return dateB - dateA
        case 'date-old': // เก่า -> ใหม่
          return dateA - dateB
        default:
          return 0
      }
    })
  }, [data, sortOption])

  // --- Handle View Details (Fetch History) ---
  const handleViewDetails = async (student: any) => {
    setSelectedStudent(student)
    setIsDialogOpen(true)
    setLoadingHistory(true)
    setExamHistory([])
    setSelectedAttemptId(null)

    try {
      // ✅ ดึงประวัติการสอบทั้งหมด (ไม่ใช่แค่ limit 1)
      const history = await getStudentExamHistory(courseId, student.userId)
      setExamHistory(history)

      // Auto-select รอบล่าสุดถ้ามีข้อมูล
      if (history.length > 0) {
        setSelectedAttemptId(history[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }

  // --- Loading UI ---
  if (loading) {
    return (
      <div className='flex h-96 flex-col items-center justify-center gap-3 text-slate-500'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600'></div>
        <p>กำลังประมวลผลข้อมูล...</p>
      </div>
    )
  }

  if (!data) return <div className='p-10 text-center'>ไม่พบข้อมูล</div>

  // --- Calculate Average Progress ---
  const avgProgress = data?.recentStudents?.length
    ? Math.round(
        data.recentStudents.reduce(
          (acc: number, curr: any) => acc + (curr.progressPercentage || curr.progress || 0),
          0,
        ) / data.recentStudents.length,
      )
    : 0

  // --- Data Preparation ---
  const kpiData = [
    {
      title: 'ผู้ลงทะเบียนเรียน',
      value: data.totalStudents,
      unit: 'คน',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'คะแนนรีวิวหลักสูตรเฉลี่ย',
      value: data.averageRating,
      unit: '/ 5.0',
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      title: 'ความคืบหน้าเฉลี่ย',
      value: avgProgress,
      unit: '%',
      icon: Percent,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'อัตราการเรียนจบ',
      value: data.completionRate,
      unit: '%',
      icon: Trophy,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'คะแนนสอบเฉลี่ย',
      value: data.avgPostTestScore,
      unit: '/ 100',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ]

  return (
    <div className='min-h-screen space-y-8 bg-slate-50/50 p-4 md:p-8'>
      {/* 1. Top Bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.push('/admin/courses')}
            className='mt-1 shrink-0 text-slate-500 hover:bg-slate-200'
          >
            <ArrowLeft className='size-5' />
          </Button>
          <div>
            <h2 className='text-2xl font-bold tracking-tight text-slate-900 md:text-3xl'>
              ภาพรวมของหลักสูตร
            </h2>
            <p className='text-sm text-slate-500 md:text-base'>
              วิเคราะห์ข้อมูลผู้เรียนและประสิทธิภาพหลักสูตร
            </p>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className='grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5'>
        {kpiData.map((stat, index) => (
          <Card key={index} className='border-slate-200 shadow-sm'>
            <CardContent>
              <div className='flex items-center justify-between'>
                <div className={`rounded-lg p-2 ${stat.bg} ${stat.color}`}>
                  <stat.icon size={18} />
                </div>
                {index === 1 && (
                  <span className='text-xs text-slate-400'>{data.reviewCount} รีวิว</span>
                )}
              </div>
              <div className='mt-3'>
                <p className='text-xs font-medium text-slate-500'>{stat.title}</p>
                <div className='flex items-baseline gap-1'>
                  <h3 className='text-xl font-bold text-slate-900 md:text-2xl'>{stat.value}</h3>
                  <span className='text-[10px] text-slate-400 md:text-xs'>{stat.unit}</span>
                </div>
                {stat.unit === '%' && (
                  <Progress value={Number(stat.value)} className='mt-2 h-1.5 bg-slate-100' />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Charts Section */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        {/* Score Evolution */}
        <Card className='col-span-full border-slate-200 shadow-sm lg:col-span-4'>
          <CardHeader>
            <CardTitle className='text-lg'>คะแนนสอบก่อนและหลังเรียน</CardTitle>
          </CardHeader>
          <CardContent className='pl-0'>
            <div className='h-[250px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={data.scoreDistribution}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e2e8f0' />
                  <XAxis
                    dataKey='range'
                    stroke='#64748b'
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke='#64748b'
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend iconType='circle' wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey='preTest' name='ก่อนเรียน' fill='#cbd5e1' radius={[4, 4, 0, 0]} />
                  <Bar dataKey='postTest' name='หลังเรียน' fill='#3b82f6' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hardest Questions */}
        <Card className='col-span-full border-slate-200 shadow-sm lg:col-span-3'>
          <CardHeader>
            <div className='flex items-center gap-2 text-red-600'>
              <AlertCircle className='h-5 w-5' />
              <CardTitle className='text-lg'>ข้อที่ตอบผิดบ่อยที่สุด</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {data.hardestQuestions.length > 0 ? (
                data.hardestQuestions.map((q, i) => (
                  <div key={i} className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <div
                        className='w-[75%] truncate font-medium text-slate-700'
                        title={q.questionText?.replace(/<[^>]*>/g, '')}
                      >
                        {i + 1}.{' '}
                        <span
                          dangerouslySetInnerHTML={{
                            __html: q.questionText?.replace(/<p>/g, '').replace(/<\/p>/g, '') || '',
                          }}
                        />
                      </div>
                      <span className='font-bold text-red-600'>{q.difficultyIndex}% ผิด</span>
                    </div>
                    <Progress
                      value={q.difficultyIndex}
                      className='h-1.5 bg-slate-100'
                      indicatorClassName='bg-red-500'
                    />
                  </div>
                ))
              ) : (
                <div className='py-8 text-center text-slate-400'>ยังไม่มีข้อมูล</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Students Table */}
      <Tabs defaultValue='students' className='w-full'>
        <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
          <TabsList className='border border-slate-200 bg-white p-1'>
            <TabsTrigger value='students'>รายชื่อผู้เรียน</TabsTrigger>
            <TabsTrigger value='reviews'>รีวิว ({data.reviews.length})</TabsTrigger>
          </TabsList>

          {/* ✅ Filter Dropdown */}
          <div className='flex items-center gap-2'>
            <span className='hidden text-sm text-slate-500 sm:inline'>
              <Filter className='mr-1 inline size-4' /> เรียงตาม:
            </span>
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className='h-9 w-[180px] border-slate-200 bg-white'>
                <SelectValue placeholder='เรียงลำดับ' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='date-new'>ลงทะเบียนล่าสุด</SelectItem>
                <SelectItem value='date-old'>ลงทะเบียนเก่าสุด</SelectItem>
                <SelectItem value='score-high'>คะแนนสอบ (มาก-น้อย)</SelectItem>
                <SelectItem value='score-low'>คะแนนสอบ (น้อย-มาก)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value='students' className='mt-4'>
          <Card className='border-slate-200 shadow-sm'>
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead className='border-b bg-slate-50/50 text-slate-500'>
                  <tr>
                    <th className='px-4 py-3 font-medium'>ผู้เรียน</th>
                    <th className='hidden px-4 py-3 text-center font-medium sm:table-cell'>
                      สถานะการเรียน
                    </th>
                    <th className='w-[20%] px-4 py-3 text-center font-medium'>ความคืบหน้า</th>
                    <th className='hidden px-4 py-3 text-center font-medium sm:table-cell'>
                      คะแนนสอบก่อนเรียน
                    </th>
                    <th className='px-4 py-3 text-center font-medium'>คะแนนสอบหลังเรียน</th>
                    <th className='hidden px-4 py-3 text-center font-medium sm:table-cell'>
                      จำนวนการสอบ (ครั้ง)
                    </th>
                    <th className='hidden w-[20%] px-4 py-3 text-center font-medium sm:table-cell'>
                      พัฒนาการ
                    </th>
                    <th className='px-4 py-3 text-center font-medium'>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {sortedStudents.map((student: any) => {
                    const pValue = student.progressPercentage ?? student.progress ?? 0
                    return (
                      <tr key={student.id} className='hover:bg-slate-50/50'>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-8 w-8 border'>
                              <AvatarImage src={student.image} />
                              <AvatarFallback>{student.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className='font-medium text-slate-900'>{student.name}</div>
                              <div className='text-xs text-slate-500'>{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className='hidden px-4 py-3 text-center sm:table-cell'>
                          <Badge variant={student.status === 'completed' ? 'default' : 'outline'}>
                            {student.status === 'completed' ? 'จบแล้ว' : 'กำลังเรียน'}
                          </Badge>
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex items-center gap-2'>
                            <Progress value={pValue} className='h-2 w-full bg-slate-100' />
                            <span className='w-8 text-right text-xs font-medium text-slate-500'>
                              {pValue}%
                            </span>
                          </div>
                        </td>
                        <td className='hidden px-4 py-3 text-center sm:table-cell'>
                          {student.pre}
                        </td>
                        <td className='px-4 py-3 text-center font-bold text-blue-600'>
                          {student.post ?? '-'}
                        </td>
                        <td className='hidden px-4 py-3 text-center sm:table-cell'>
                          {student.attempts > 0 ? (
                            <Badge variant='secondary'>{student.attempts}</Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className='hidden px-4 py-3 sm:table-cell'>
                          <div className='flex flex-col items-center justify-center gap-1'>
                            <div className='relative h-12 w-20 overflow-visible rounded border border-slate-100/50 bg-slate-50/50'>
                              {/* SVG สำหรับวาดเส้น Slope */}
                              <svg
                                className='h-full w-full'
                                preserveAspectRatio='none'
                                viewBox='0 0 100 100'
                              >
                                {/* เส้น Guideline แนวนอน (50%) */}
                                <line
                                  x1='0'
                                  y1='50'
                                  x2='100'
                                  y2='50'
                                  stroke='#e2e8f0'
                                  strokeWidth='1'
                                  strokeDasharray='4'
                                />

                                {/* เส้นเชื่อมคะแนน (Slope Line) */}
                                {student.post !== null && (
                                  <line
                                    x1='15'
                                    y1={100 - (student.pre || 0) * 10} // 📍 สมมติคะแนนเต็ม 10
                                    x2='85'
                                    y2={100 - (student.post || 0) * 10}
                                    stroke={student.post >= student.pre ? '#2563eb' : '#ef4444'}
                                    strokeWidth='3'
                                    strokeLinecap='round'
                                    className='transition-all duration-700'
                                  />
                                )}

                                {/* จุดคะแนน Pre */}
                                <circle
                                  cx='15'
                                  cy={100 - (student.pre || 0) * 10}
                                  r='3.5'
                                  fill='#94a3b8'
                                  className='transition-all'
                                />

                                {/* จุดคะแนน Post */}
                                {student.post !== null && (
                                  <circle
                                    cx='85'
                                    cy={100 - (student.post || 0) * 10}
                                    r='4'
                                    fill={student.post >= student.pre ? '#2563eb' : '#ef4444'}
                                    className='animate-pulse'
                                  />
                                )}
                              </svg>

                              {/* Tooltip หรือ Label กำกับ */}
                              <div className='absolute inset-x-0 -bottom-1 flex justify-between px-1 text-[8px] font-bold text-slate-400 uppercase'>
                                <span>{student.pre}</span>
                                <span>{student.post ?? '?'}</span>
                              </div>
                            </div>

                            {/* สรุปพัฒนาการเป็นตัวเลข */}
                            <div className='flex items-center gap-1 text-[10px] font-bold'>
                              {student.post !== null ? (
                                student.post - student.pre >= 0 ? (
                                  <span className='text-emerald-600'>
                                    +{student.post - student.pre}
                                  </span>
                                ) : (
                                  <span className='text-rose-600'>
                                    {student.post - student.pre}
                                  </span>
                                )
                              ) : (
                                <span className='text-slate-300'>รอผล</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className='px-4 py-3 text-center'>
                          <Button
                            size='sm'
                            variant='ghost'
                            disabled={!student.post}
                            onClick={() => handleViewDetails(student)}
                          >
                            <Eye className='mr-1 size-4' />{' '}
                            <span className='hidden sm:inline'>ดูผลสอบ</span>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value='reviews' className='mt-4'>
          {data.reviews.length > 0 ? (
            <div className='grid gap-4 md:grid-cols-2'>
              {data.reviews.map((review) => (
                <Card
                  key={review.id}
                  className='border-slate-200 shadow-sm transition-all hover:shadow-md'
                >
                  <CardContent className='p-6'>
                    <div className='mb-4 flex items-start justify-between'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-10 w-10 border'>
                          <AvatarImage src={review.userImage} />
                          <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-medium text-slate-900'>{review.userName}</div>
                          <div className='text-xs text-slate-500'>{review.createdAt}</div>
                        </div>
                      </div>
                      <div className='flex rounded-md border border-amber-100 bg-amber-50 px-2 py-1'>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={
                              s <= review.rating
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-slate-200'
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <p className='text-sm leading-relaxed text-slate-600'>"{review.comment}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className='flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50'>
              <Star className='mb-2 h-8 w-8 text-slate-300' />
              <p className='text-slate-500'>ยังไม่มีรีวิวสำหรับหลักสูตรนี้</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ========================================================= */}
      {/* 5. NEW: Enhanced Dialog (Split View & History) */}
      {/* ========================================================= */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='flex h-[90vh] w-[95vw] !max-w-[95vw] flex-col overflow-hidden p-0 md:flex-row'>
          {/* Left Sidebar: Exam History List */}
          <div className='w-full border-b border-slate-200 bg-slate-50 md:w-1/3 md:border-r md:border-b-0'>
            <div className='border-b border-slate-200 p-4'>
              <DialogHeader className='text-left'>
                <DialogTitle>ประวัติการสอบ</DialogTitle>
                <p className='text-sm text-slate-500'>ของ {selectedStudent?.name}</p>
              </DialogHeader>
            </div>

            <ScrollArea className='h-[150px] md:h-[calc(90vh-80px)]'>
              {loadingHistory ? (
                <div className='p-4 text-center text-sm text-slate-400'>กำลังโหลดประวัติ...</div>
              ) : examHistory.length > 0 ? (
                <div className='flex flex-col gap-2 p-2'>
                  {examHistory.map((exam, index) => {
                    const isSelected = selectedAttemptId === exam.id
                    return (
                      <button
                        key={exam.id}
                        onClick={() => setSelectedAttemptId(exam.id)}
                        className={`flex items-center justify-between rounded-lg p-3 text-left transition-all ${
                          isSelected
                            ? 'border border-blue-200 bg-white shadow-sm ring-1 ring-blue-200'
                            : 'border border-transparent hover:bg-slate-100'
                        }`}
                      >
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2'>
                            <Badge
                              variant={exam.isPassed ? 'default' : 'destructive'}
                              className='h-5 px-1.5 text-[10px]'
                            >
                              {exam.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'}
                            </Badge>
                            <span className='text-sm font-medium text-slate-900'>
                              ครั้งที่ {examHistory.length - index}
                            </span>
                          </div>
                          <div className='flex items-center gap-1 text-xs text-slate-500'>
                            <Calendar className='size-3' />
                            {exam.submittedAt?.toDate().toLocaleDateString('th-TH')}
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='text-md font-medium text-slate-600'>
                            {exam.score}/{exam.totalScore} คะแนน
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className='p-8 text-center text-sm text-slate-400'>ไม่มีประวัติการสอบ</div>
              )}
            </ScrollArea>
          </div>

          {/* Right Content: Detailed Answers */}
          <div className='flex min-h-0 flex-1 flex-col bg-white'>
            {currentAttempt ? (
              <>
                <div className='flex items-center justify-between border-b border-slate-100 bg-white p-4 pr-12'>
                  <div>
                    <h3 className='font-semibold text-slate-900'>รายละเอียดคำตอบ</h3>
                    <p className='flex items-center gap-1 text-xs text-slate-500'>
                      <Clock className='size-3' />
                      ใช้เวลา: {Math.floor((currentAttempt.timeTaken || 0) / 60)} นาที{' '}
                      {(currentAttempt.timeTaken || 0) % 60} วินาที
                    </p>
                  </div>
                  <div className='text-right'>
                    <span
                      className={`text-lg font-bold ${currentAttempt.isPassed ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {Math.round((currentAttempt.score / currentAttempt.totalScore) * 100)}%
                    </span>
                  </div>
                </div>

                <ScrollArea className='flex-1 p-4'>
                  <div className='mx-auto max-w-3xl space-y-4 pb-10'>
                    {currentAttempt.answers?.map((ans: any, i: number) => (
                      <div
                        key={i}
                        className={`rounded-lg border p-4 ${
                          ans.isCorrect
                            ? 'border-green-100 bg-green-50/30'
                            : 'border-red-100 bg-red-50/30'
                        }`}
                      >
                        <div className='flex gap-3'>
                          <div className='mt-1 shrink-0'>
                            {ans.isCorrect ? (
                              <CheckCircle2 className='size-5 text-green-600' />
                            ) : (
                              <XCircle className='size-5 text-red-600' />
                            )}
                          </div>
                          <div className='min-w-0 flex-1'>
                            {/* ✅ แก้ปัญหา HTML String ตรงนี้ */}
                            <div className='prose prose-sm mb-2 max-w-none text-sm font-medium text-slate-900'>
                              <span className='mr-2 text-slate-500'>{i + 1}.</span>
                              <span dangerouslySetInnerHTML={{ __html: ans.questionText || '' }} />
                            </div>

                            <div className='grid gap-2 text-sm sm:grid-cols-2'>
                              <div
                                className={`rounded px-3 py-2 ${
                                  ans.isCorrect
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                <span className='mb-0.5 block text-xs font-medium opacity-70'>
                                  คำตอบของผู้เรียน:
                                </span>
                                {ans.selectedOption || '-'}
                              </div>
                              {!ans.isCorrect && (
                                <div className='rounded bg-slate-100 px-3 py-2 text-slate-700'>
                                  <span className='mb-0.5 block text-xs font-medium opacity-70'>
                                    เฉลย:
                                  </span>
                                  {ans.correctOption || '-'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className='flex flex-1 flex-col items-center justify-center p-8 text-slate-400'>
                <History className='mb-2 size-10 opacity-20' />
                <p>เลือกรายการทางซ้ายเพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
