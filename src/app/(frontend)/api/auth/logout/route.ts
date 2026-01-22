import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('member_session')

  return NextResponse.json({ success: true })
}

export async function GET() {
  const cookieStore = await cookies()
  cookieStore.delete('member_session')

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  return NextResponse.redirect(new URL('/', serverUrl))
}
