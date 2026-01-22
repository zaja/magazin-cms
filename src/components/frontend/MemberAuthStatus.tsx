'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface MemberSession {
  email: string
  name?: string
}

export function MemberAuthStatus() {
  const [session, setSession] = useState<MemberSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setSession(data.member)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <span className="text-gray-400">...</span>
  }

  if (session) {
    return (
      <Link href="/account" className="hover:text-white transition-colors">
        Moj račun
      </Link>
    )
  }

  return (
    <Link href="/account/login" className="hover:text-white transition-colors">
      Prijava
    </Link>
  )
}
