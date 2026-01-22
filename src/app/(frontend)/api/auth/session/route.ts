import { NextResponse } from 'next/server'
import { getMemberSession } from '@/utilities/memberAuth'

export async function GET() {
  try {
    const session = await getMemberSession()

    if (!session) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      member: {
        email: session.email,
        name: session.name,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
