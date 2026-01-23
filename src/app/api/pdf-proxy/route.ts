import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fileId = searchParams.get('id')

  if (!fileId) return new NextResponse('Missing File ID', { status: 400 })

  // ลิงก์ Direct Download ของ Google Drive
  const googleUrl = `https://drive.google.com/uc?export=download&id=${fileId}`

  try {
    const response = await fetch(googleUrl)
    if (!response.ok) throw new Error('Google Drive response was not OK')

    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Access-Control-Allow-Origin': '*', // ปลดล็อคให้เว็บเราดึงไปใช้ได้
        'Cache-Control': 'public, max-age=3600', // Cache ไว้ 1 ชม. จะได้ไม่โหลดซ้ำบ่อยๆ
      },
    })
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 })
  }
}
