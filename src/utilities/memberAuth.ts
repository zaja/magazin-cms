import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Subscriber } from '@/payload-types'

const JWT_SECRET = new TextEncoder().encode(process.env.PAYLOAD_SECRET || 'your-secret-key')

export interface MemberSession {
  subscriberId: number
  email: string
  name?: string
}

export async function getMemberSession(): Promise<MemberSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('member_session')

    if (!sessionCookie?.value) {
      return null
    }

    const { payload: jwtPayload } = await jwtVerify(sessionCookie.value, JWT_SECRET)

    return {
      subscriberId: jwtPayload.subscriberId as number,
      email: jwtPayload.email as string,
      name: jwtPayload.name as string | undefined,
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return null
  }
}

export async function getMemberWithDetails(): Promise<Subscriber | null> {
  const session = await getMemberSession()

  if (!session) {
    return null
  }

  try {
    const payload = await getPayload({ config })

    const subscriber = await payload.findByID({
      collection: 'subscribers',
      id: session.subscriberId,
    })

    return subscriber as Subscriber
  } catch (error) {
    console.error('Get member details error:', error)
    return null
  }
}

export async function requireMemberAuth(): Promise<Subscriber> {
  const member = await getMemberWithDetails()

  if (!member) {
    throw new Error('Unauthorized')
  }

  return member
}
