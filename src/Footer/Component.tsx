import { getCachedGlobal } from '@/utilities/getGlobals'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Link from 'next/link'
import React from 'react'

import type { Footer, Setting, Media } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'

export async function Footer() {
  const footerData: Footer = await getCachedGlobal('footer', 2)()

  // Fetch settings directly without cache
  const payload = await getPayload({ config: configPromise })
  const settings = (await payload.findGlobal({ slug: 'settings', depth: 2 })) as Setting

  const columns = footerData?.columns || []
  const logo = settings?.logo as Media | null
  const logoUrl = logo?.url || null
  const siteName = settings?.siteName || 'Magazin CMS'

  return (
    <footer className="mt-auto border-t border-border bg-black dark:bg-card text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          {logoUrl ? (
            /* eslint-disable @next/next/no-img-element */
            <img
              alt={logo?.alt || siteName}
              width={150}
              height={30}
              loading="lazy"
              decoding="async"
              className="max-w-[9.375rem] w-full h-auto object-contain"
              src={logoUrl}
            />
          ) : (
            <span className="font-serif text-xl font-bold">{siteName}</span>
          )}
        </Link>

        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          <ThemeSelector />
          <nav className="flex flex-col md:flex-row gap-4">
            {columns.map((column, colIndex) => (
              <div key={column.id || colIndex} className="flex flex-col gap-2">
                {column.navItems?.map((item, i) => (
                  <CMSLink
                    className="text-white"
                    key={item.id || i}
                    {...item.link}
                    label={item.link?.label || ''}
                  />
                ))}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
