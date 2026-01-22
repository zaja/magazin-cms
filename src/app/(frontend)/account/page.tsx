import { redirect } from 'next/navigation'
import { getMemberWithDetails } from '@/utilities/memberAuth'
import { AccountDashboard } from './AccountDashboard'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const member = await getMemberWithDetails()

  if (!member) {
    redirect('/account/login')
  }

  return <AccountDashboard member={member} />
}
