'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import clsx from 'clsx'

import type { Header } from '@/payload-types'

import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
  logoUrl: string | null
  logoAlt: string
  siteName: string
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, logoUrl, logoAlt, siteName }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header className="container relative z-20   " {...(theme ? { 'data-theme': theme } : {})}>
      <div className="py-8 flex justify-between">
        <Link href="/">
          {logoUrl ? (
            /* eslint-disable @next/next/no-img-element */
            <img
              alt={logoAlt}
              width={193}
              height={34}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className={clsx('max-w-[9.375rem] w-full h-auto object-contain invert dark:invert-0')}
              src={logoUrl}
            />
          ) : (
            <span className="font-serif text-xl font-bold invert dark:invert-0">{siteName}</span>
          )}
        </Link>
        <HeaderNav data={data} />
      </div>
    </header>
  )
}
