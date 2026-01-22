import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import React from 'react'

import type { Header, Setting, Media } from '@/payload-types'

export async function Header() {
  const headerData: Header = await getCachedGlobal('header', 2)()

  // Fetch settings directly without cache to ensure fresh data
  const payload = await getPayload({ config: configPromise })
  const settings = (await payload.findGlobal({ slug: 'settings', depth: 2 })) as Setting

  const logo = settings?.logo as Media | null
  const logoUrl = logo?.url || null
  const logoAlt = logo?.alt || settings?.siteName || 'Logo'
  const siteName = settings?.siteName || 'Magazin CMS'

  return <HeaderClient data={headerData} logoUrl={logoUrl} logoAlt={logoAlt} siteName={siteName} />
}
