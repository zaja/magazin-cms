import clsx from 'clsx'
import React from 'react'
import { getCachedGlobal } from '@/utilities/getGlobals'
import type { Setting, Media } from '@/payload-types'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = async (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  const settings = (await getCachedGlobal('settings', 1)()) as Setting
  const logo = settings?.logo as Media | null

  if (logo?.url) {
    return (
      /* eslint-disable @next/next/no-img-element */
      <img
        alt={logo.alt || settings?.siteName || 'Logo'}
        width={193}
        height={34}
        loading={loading}
        fetchPriority={priority}
        decoding="async"
        className={clsx('max-w-[9.375rem] w-full h-auto object-contain', className)}
        src={logo.url}
      />
    )
  }

  return (
    <span className={clsx('font-serif text-xl font-bold', className)}>
      {settings?.siteName || 'Magazin CMS'}
    </span>
  )
}
