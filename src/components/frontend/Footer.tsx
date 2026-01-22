import Link from 'next/link'
import type { Category, Page, Post } from '@/payload-types'

interface NavLink {
  type?: 'reference' | 'custom'
  reference?: {
    relationTo: 'pages' | 'posts' | 'categories'
    value: Page | Post | Category | string | number
  } | null
  url?: string
  label?: string
  newTab?: boolean
}

interface FooterColumn {
  id?: string
  title: string
  navItems?: Array<{
    id?: string
    link?: NavLink
  }>
}

interface SocialLink {
  id?: string
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok'
  url: string
}

export interface FooterProps {
  categories?: Category[]
  siteName?: string
  logoUrl?: string | null
  logoAlt?: string
  columns?: FooterColumn[]
  socialLinks?: SocialLink[]
  copyright?: string | null
  description?: string | null
}

function getNavLinkHref(link?: NavLink): string {
  if (!link) return '/'

  if (link.type === 'custom' && link.url) {
    return link.url
  }

  if (link.type === 'reference' && link.reference?.value) {
    const doc = link.reference.value
    if (typeof doc === 'object' && 'slug' in doc) {
      if (link.reference.relationTo === 'posts') {
        return `/posts/${doc.slug}`
      }
      if (link.reference.relationTo === 'categories') {
        return `/category/${doc.slug}`
      }
      return `/${doc.slug}`
    }
  }

  return '/'
}

const socialIcons: Record<string, React.ReactNode> = {
  facebook: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  instagram: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  twitter: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  youtube: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  tiktok: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
}

export function Footer({
  categories = [],
  siteName = 'GRAZIA',
  logoUrl,
  logoAlt,
  columns = [],
  socialLinks = [],
  copyright,
  description = 'Vaš izvor inspiracije za modu, lepotu, lifestyle i zabavu. Pratite najnovije trendove i priče.',
}: FooterProps) {
  const currentYear = new Date().getFullYear()
  const hasColumns = columns && columns.length > 0
  const hasSocialLinks = socialLinks && socialLinks.length > 0

  return (
    <footer className="bg-neutral-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1 - Brand */}
          <div>
            {logoUrl ? (
              /* eslint-disable @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={logoAlt || siteName}
                className="h-10 w-auto object-contain mb-4"
              />
            ) : (
              <h3 className="font-serif text-2xl font-bold mb-4">{siteName}</h3>
            )}
            <p className="text-gray-400 text-sm leading-relaxed mb-6">{description}</p>
            <div className="flex gap-4">
              {hasSocialLinks ? (
                socialLinks.map((social) => (
                  <a
                    key={social.id || social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center border border-gray-700 hover:border-white hover:bg-white hover:text-neutral-900 transition-all"
                    aria-label={social.platform}
                  >
                    {socialIcons[social.platform]}
                  </a>
                ))
              ) : (
                <>
                  <a
                    href="#"
                    className="w-10 h-10 flex items-center justify-center border border-gray-700 hover:border-white hover:bg-white hover:text-neutral-900 transition-all"
                    aria-label="Facebook"
                  >
                    {socialIcons.facebook}
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 flex items-center justify-center border border-gray-700 hover:border-white hover:bg-white hover:text-neutral-900 transition-all"
                    aria-label="Instagram"
                  >
                    {socialIcons.instagram}
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 flex items-center justify-center border border-gray-700 hover:border-white hover:bg-white hover:text-neutral-900 transition-all"
                    aria-label="Twitter"
                  >
                    {socialIcons.twitter}
                  </a>
                </>
              )}
            </div>
          </div>

          {hasColumns ? (
            // Dynamic columns from admin
            columns.slice(0, 3).map((column) => (
              <div key={column.id || column.title}>
                <h4 className="font-semibold uppercase tracking-wider text-sm mb-4">
                  {column.title}
                </h4>
                <ul className="space-y-3">
                  {column.navItems?.map((item, index) => (
                    <li key={item.id || index}>
                      <Link
                        href={getNavLinkHref(item.link)}
                        target={item.link?.newTab ? '_blank' : undefined}
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        {item.link?.label || 'Link'}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            // Fallback hardcoded columns
            <>
              {/* Column 2 - Categories */}
              <div>
                <h4 className="font-semibold uppercase tracking-wider text-sm mb-4">Kategorije</h4>
                <ul className="space-y-3">
                  {categories.slice(0, 5).map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/category/${category.slug}`}
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        {typeof category.title === 'string' ? category.title : category.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3 - Links */}
              <div>
                <h4 className="font-semibold uppercase tracking-wider text-sm mb-4">Navigacija</h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Naslovnica
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/posts"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/subscribe"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Newsletter
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 4 - Info */}
              <div>
                <h4 className="font-semibold uppercase tracking-wider text-sm mb-4">Informacije</h4>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/o-nama"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      O nama
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/kontakt"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Kontakt
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privatnost"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Privatnost
                    </Link>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              {copyright || `© ${currentYear} ${siteName}. Sva prava zadržana.`}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
