import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/utilities/emailService'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Check authentication
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    // Initialize email service with payload
    await emailService.initialize(payload)

    // Send test email
    const result = await emailService.sendTestEmail(email)

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Test email sent successfully!' })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
