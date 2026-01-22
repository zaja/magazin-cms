import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const payload = await getPayload({ config })

  const seo = await payload.findGlobal({
    slug: 'seo',
    depth: 0,
  })

  const robotsContent =
    (seo?.robots as string) ||
    `User-agent: *
Allow: /
Disallow: /admin/
Sitemap: /sitemap.xml`

  // Parse the robots.txt content into structured format
  const lines = robotsContent.split('\n').filter((line) => line.trim())

  const rules: MetadataRoute.Robots['rules'] = []
  let currentRule: { userAgent?: string; allow?: string[]; disallow?: string[] } = {}

  for (const line of lines) {
    const [directive, ...valueParts] = line.split(':')
    const value = valueParts.join(':').trim()

    if (directive.toLowerCase().trim() === 'user-agent') {
      if (currentRule.userAgent) {
        rules.push(currentRule as { userAgent: string; allow?: string[]; disallow?: string[] })
        currentRule = {}
      }
      currentRule.userAgent = value
    } else if (directive.toLowerCase().trim() === 'allow') {
      currentRule.allow = currentRule.allow || []
      currentRule.allow.push(value)
    } else if (directive.toLowerCase().trim() === 'disallow') {
      currentRule.disallow = currentRule.disallow || []
      currentRule.disallow.push(value)
    }
  }

  if (currentRule.userAgent) {
    rules.push(currentRule as { userAgent: string; allow?: string[]; disallow?: string[] })
  }

  // Extract sitemap URL
  const sitemapLine = lines.find((line) => line.toLowerCase().startsWith('sitemap:'))
  const sitemap = sitemapLine ? sitemapLine.split(':').slice(1).join(':').trim() : undefined

  return {
    rules: rules.length > 0 ? rules : [{ userAgent: '*', allow: '/', disallow: '/admin/' }],
    ...(sitemap && { sitemap }),
  }
}
