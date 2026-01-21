'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { Users, Star, Trophy, TrendingUp, Search, Download, Clock, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// --- MOCK DATA ---
const overviewStats = [
  {
    title: 'ผู้ลงทะเบียนทั้งหมด',
    value: '1,248',
    change: '+12% จากเดือนที่แล้ว',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    title: 'คะแนนเฉลี่ย (Rating)',
    value: '4.8',
    change: 'จาก 156 รีวิว',
    icon: Star,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
  },
  {
    title: 'อัตราเรียนจบ (Completion)',
    value: '68%',
    change: '+5% จากค่าเฉลี่ย',
    icon: Trophy,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  {
    title: 'คะแนนสอบเฉลี่ย (Post-test)',
    value: '82/100',
    change: 'สูงกว่า Pre-test 45%',
    icon: TrendingUp,
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
]

// ข้อมูลเปรียบเทียบ Pre-test vs Post-test (Evolution)
const scoreComparisonData = [
  { range: '0-20%', preTest: 15, postTest: 0 },
  { range: '21-40%', preTest: 30, postTest: 2 },
  { range: '41-60%', preTest: 40, postTest: 5 },
  { range: '61-80%', preTest: 10, postTest: 35 },
  { range: '81-100%', preTest: 5, postTest: 58 },
]

// ข้อมูลการเข้าเรียนย้อนหลัง
const enrollmentTrendData = [
  { name: 'ม.ค.', students: 40 },
  { name: 'ก.พ.', students: 55 },
  { name: 'มี.ค.', students: 80 },
  { name: 'เม.ย.', students: 120 },
  { name: 'พ.ค.', students: 150 },
  { name: 'มิ.ย.', students: 210 },
]

const recentStudents = [
  {
    id: 1,
    name: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    progress: 100,
    status: 'completed',
    preScore: 45,
    postScore: 92,
    enrolledDate: '12 ม.ค. 2026',
    image: 'https://i.pravatar.cc/150?u=1',
  },
  {
    id: 2,
    name: 'วิภาดา รักเรียน',
    email: 'wipada@example.com',
    progress: 75,
    status: 'in_progress',
    preScore: 50,
    postScore: null,
    enrolledDate: '15 ม.ค. 2026',
    image: 'https://i.pravatar.cc/150?u=2',
  },
  {
    id: 3,
    name: 'ก้องภพ จบไว',
    email: 'kongphop@example.com',
    progress: 100,
    status: 'completed',
    preScore: 30,
    postScore: 88,
    enrolledDate: '10 ม.ค. 2026',
    image: 'https://i.pravatar.cc/150?u=3',
  },
  {
    id: 4,
    name: 'อารียา พาเพลิน',
    email: 'areeya@example.com',
    progress: 20,
    status: 'in_progress',
    preScore: 60,
    postScore: null,
    enrolledDate: '18 ม.ค. 2026',
    image: 'https://i.pravatar.cc/150?u=4',
  },
]

const mockReviews = [
  {
    id: 1,
    user: 'ธนพล',
    rating: 5,
    comment: 'เนื้อหาดีมากครับ เข้าใจง่าย อาจารย์สอนสนุก',
    date: '2 วันที่แล้ว',
    avatar: 'https://i.pravatar.cc/150?u=5',
  },
  {
    id: 2,
    user: 'สุดารัตน์',
    rating: 4,
    comment: 'อยากให้เพิ่มตัวอย่าง Workshop มากกว่านี้อีกหน่อยค่ะ แต่โดยรวมดีมาก',
    date: '1 สัปดาห์ที่แล้ว',
    avatar: 'https://i.pravatar.cc/150?u=6',
  },
]

export default function CourseAnalyticsDashboard() {
  return (
    <div className='min-h-screen space-y-8 bg-slate-50/50 p-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight text-slate-900'>
            Dashboard ภาพรวมหลักสูตร
          </h2>
          <p className='text-slate-500'>
            วิเคราะห์ข้อมูลเชิงลึกและติดตามพัฒนาการของผู้เรียนสำหรับหลักสูตรนี้
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline'>
            <Download className='mr-2 size-4' /> Export Report
          </Button>
        </div>
      </div>

      {/* 1. Overview Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {overviewStats.map((stat, index) => (
          <Card key={index} className='border-slate-200 shadow-sm'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className={`rounded-full p-2.5 ${stat.bg} ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                {index === 1 && (
                  <div className='flex'>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={s <= 4.8 ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className='mt-4'>
                <p className='text-sm font-medium text-slate-500'>{stat.title}</p>
                <h3 className='text-2xl font-bold text-slate-900'>{stat.value}</h3>
                <p className='mt-1 text-xs text-slate-400'>{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 2. Charts Section */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        {/* Evolution Chart (Pre vs Post) */}
        <Card className='col-span-4 border-slate-200 shadow-sm'>
          <CardHeader>
            <CardTitle>วิวัฒนาการคะแนนสอบ (Evolution)</CardTitle>
            <CardDescription>
              เปรียบเทียบการกระจายตัวของคะแนน Pre-test และ Post-test
            </CardDescription>
          </CardHeader>
          <CardContent className='pl-2'>
            <div className='h-[300px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={scoreComparisonData}>
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
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Legend />
                  <Bar
                    dataKey='preTest'
                    name='Pre-test'
                    fill='#94a3b8'
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar
                    dataKey='postTest'
                    name='Post-test'
                    fill='#3b82f6'
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Trend */}
        <Card className='col-span-3 border-slate-200 shadow-sm'>
          <CardHeader>
            <CardTitle>ยอดผู้เรียนใหม่</CardTitle>
            <CardDescription>จำนวนผู้ลงทะเบียนในรอบ 6 เดือน</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={enrollmentTrendData}>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#e2e8f0' />
                  <XAxis
                    dataKey='name'
                    stroke='#64748b'
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke='#64748b' fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    type='monotone'
                    dataKey='students'
                    stroke='#2563eb'
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Detailed Data Tabs */}
      <Tabs defaultValue='students' className='w-full'>
        <div className='flex items-center justify-between'>
          <TabsList className='border border-slate-200 bg-white p-1 shadow-sm'>
            <TabsTrigger
              value='students'
              className='data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900'
            >
              <Users className='mr-2 size-4' /> รายชื่อผู้เรียน
            </TabsTrigger>
            <TabsTrigger
              value='reviews'
              className='data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900'
            >
              <Star className='mr-2 size-4' /> รีวิวและความเห็น
            </TabsTrigger>
          </TabsList>

          <div className='relative w-64'>
            <Search className='absolute top-2.5 left-2.5 h-4 w-4 text-slate-400' />
            <Input placeholder='ค้นหา...' className='bg-white pl-9' />
          </div>
        </div>

        {/* Tab: Students List */}
        <TabsContent value='students' className='mt-4'>
          <Card className='border-slate-200 shadow-sm'>
            <CardHeader className='pb-3'>
              <CardTitle>ความคืบหน้าของผู้เรียน</CardTitle>
              <CardDescription>ติดตามสถานะการเรียนและคะแนนสอบรายบุคคล</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <table className='w-full text-left text-sm'>
                  <thead className='border-b bg-slate-50/50 font-medium text-slate-500'>
                    <tr>
                      <th className='px-4 py-3'>ผู้เรียน</th>
                      <th className='px-4 py-3'>วันที่ลงทะเบียน</th>
                      <th className='px-4 py-3'>ความคืบหน้า</th>
                      <th className='px-4 py-3 text-center'>Pre-test</th>
                      <th className='px-4 py-3 text-center'>Post-test</th>
                      <th className='px-4 py-3 text-center'>พัฒนาการ</th>
                      <th className='px-4 py-3 text-right'>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-slate-100'>
                    {recentStudents.map((student) => {
                      const evolution = student.postScore ? student.postScore - student.preScore : 0
                      return (
                        <tr key={student.id} className='transition-colors hover:bg-slate-50/50'>
                          <td className='px-4 py-3'>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-9 w-9 border border-slate-200'>
                                <AvatarImage src={student.image} />
                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className='font-medium text-slate-900'>{student.name}</div>
                                <div className='text-xs text-slate-500'>{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-3 text-slate-500'>{student.enrolledDate}</td>
                          <td className='w-48 px-4 py-3'>
                            <div className='flex items-center gap-2'>
                              <Progress value={student.progress} className='h-2' />
                              <span className='w-8 text-right text-xs font-medium'>
                                {student.progress}%
                              </span>
                            </div>
                          </td>
                          <td className='px-4 py-3 text-center'>
                            <span className='inline-block rounded bg-slate-100 px-2 py-1 font-mono font-medium text-slate-600'>
                              {student.preScore}
                            </span>
                          </td>
                          <td className='px-4 py-3 text-center'>
                            {student.postScore ? (
                              <span className='inline-block rounded bg-blue-50 px-2 py-1 font-mono font-bold text-blue-600'>
                                {student.postScore}
                              </span>
                            ) : (
                              <span className='text-slate-400'>-</span>
                            )}
                          </td>
                          <td className='px-4 py-3 text-center'>
                            {student.postScore ? (
                              <div className='flex items-center justify-center gap-1 font-bold text-green-600'>
                                <TrendingUp size={14} /> +{evolution}
                              </div>
                            ) : (
                              <span className='text-xs text-slate-400'>รอสอบ</span>
                            )}
                          </td>
                          <td className='px-4 py-3 text-right'>
                            {student.status === 'completed' ? (
                              <Badge className='border-green-200 bg-green-100 text-green-700 hover:bg-green-100'>
                                เรียนจบแล้ว
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='border-blue-200 bg-blue-50 text-blue-600'
                              >
                                กำลังเรียน
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Reviews */}
        <TabsContent value='reviews' className='mt-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            {mockReviews.map((review) => (
              <Card key={review.id} className='border-slate-200 shadow-sm'>
                <CardContent className='p-6'>
                  <div className='mb-4 flex items-start justify-between'>
                    <div className='flex items-center gap-3'>
                      <Avatar>
                        <AvatarImage src={review.avatar} />
                        <AvatarFallback>{review.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className='font-medium text-slate-900'>{review.user}</div>
                        <div className='text-xs text-slate-500'>{review.date}</div>
                      </div>
                    </div>
                    <div className='flex rounded-md border border-amber-100 bg-amber-50 px-2 py-1'>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={
                            s <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
