'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Category, Page, Post } from '@/payload-types'
import { MemberAuthStatus } from './MemberAuthStatus'

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

interface NavItem {
  link?: NavLink
  hasSubmenu?: boolean
  subItems?: Array<{
    link?: NavLink
  }>
}

export interface HeaderProps {
  categories?: Category[]
  siteName?: string
  logoUrl?: string | null
  logoAlt?: string
  logoWidth?: number
  navItems?: NavItem[]
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

export function Header({
  categories = [],
  siteName = 'Magazin CMS',
  logoUrl,
  logoAlt,
  logoWidth = 120,
  navItems = [],
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [mobileOpenSubmenu, setMobileOpenSubmenu] = useState<number | null>(null)

  const today = new Date().toLocaleDateString('hr-HR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const hasNavItems = navItems && navItems.length > 0

  return (
    <>
      <header id="main-header" className="bg-white border-b border-gray-200 sticky top-0 z-50">
        {/* Top Bar */}
        <div className="bg-neutral-900 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-sm">
            <div className="flex items-center gap-6">
              <span className="text-gray-400 capitalize">{today}</span>
              <Link href="/subscribe" className="hover:text-white transition-colors">
                Newsletter
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <MemberAuthStatus />
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              {logoUrl ? (
                /* eslint-disable @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt={logoAlt || siteName}
                  style={{ width: logoWidth, height: 'auto' }}
                  className="object-contain"
                />
              ) : (
                <h1 className="text-3xl font-serif font-bold tracking-tight">{siteName}</h1>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center">
              <ul className="flex items-center gap-8">
                {hasNavItems ? (
                  // Render nav items from Header global
                  navItems.map((item, index) => (
                    <li
                      key={index}
                      className="relative"
                      onMouseEnter={() => item.hasSubmenu && setOpenDropdown(index)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <Link
                        href={getNavLinkHref(item.link)}
                        target={item.link?.newTab ? '_blank' : undefined}
                        className="text-sm font-medium uppercase tracking-wider hover:text-neutral-600 transition-colors flex items-center gap-1"
                      >
                        {item.link?.label || 'Link'}
                        {item.hasSubmenu && item.subItems && item.subItems.length > 0 && (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </Link>

                      {/* Dropdown Menu */}
                      {item.hasSubmenu &&
                        item.subItems &&
                        item.subItems.length > 0 &&
                        openDropdown === index && (
                          <div className="absolute top-full left-0 pt-2 z-50">
                            <div className="bg-white border border-gray-200 shadow-lg min-w-[200px] py-2">
                              {item.subItems.map((subItem, subIndex) => (
                                <Link
                                  key={subIndex}
                                  href={getNavLinkHref(subItem.link)}
                                  target={subItem.link?.newTab ? '_blank' : undefined}
                                  className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                                >
                                  {subItem.link?.label || 'Link'}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                    </li>
                  ))
                ) : (
                  // Fallback to categories if no nav items defined
                  <>
                    <li>
                      <Link
                        href="/"
                        className="text-sm font-medium uppercase tracking-wider hover:text-neutral-600 transition-colors"
                      >
                        Naslovnica
                      </Link>
                    </li>
                    {categories.slice(0, 5).map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/category/${category.slug}`}
                          className="text-sm font-medium uppercase tracking-wider hover:text-neutral-600 transition-colors"
                        >
                          {typeof category.title === 'string' ? category.title : category.title}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href="/posts"
                        className="text-sm font-medium uppercase tracking-wider hover:text-neutral-600 transition-colors"
                      >
                        Blog
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 transition-colors"
                aria-label="Meni"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-white z-50 overflow-y-auto lg:hidden transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 flex justify-between items-center p-4">
          <span className="font-serif text-xl font-bold">MENI</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100"
            aria-label="Zatvori"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {hasNavItems ? (
              // Render nav items from Header global
              navItems.map((item, index) => (
                <li key={index}>
                  {item.hasSubmenu && item.subItems && item.subItems.length > 0 ? (
                    <>
                      <button
                        onClick={() =>
                          setMobileOpenSubmenu(mobileOpenSubmenu === index ? null : index)
                        }
                        className="w-full flex justify-between items-center py-3 px-4 font-medium hover:bg-gray-50"
                      >
                        {item.link?.label || 'Link'}
                        <svg
                          className={`w-4 h-4 transition-transform ${mobileOpenSubmenu === index ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {mobileOpenSubmenu === index && (
                        <ul className="pl-4 space-y-1">
                          <li>
                            <Link
                              href={getNavLinkHref(item.link)}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block py-2 px-4 text-sm hover:bg-gray-50"
                            >
                              {item.link?.label || 'Link'} (sve)
                            </Link>
                          </li>
                          {item.subItems.map((subItem, subIndex) => (
                            <li key={subIndex}>
                              <Link
                                href={getNavLinkHref(subItem.link)}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-2 px-4 text-sm hover:bg-gray-50"
                              >
                                {subItem.link?.label || 'Link'}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      href={getNavLinkHref(item.link)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-3 px-4 font-medium hover:bg-gray-50"
                    >
                      {item.link?.label || 'Link'}
                    </Link>
                  )}
                </li>
              ))
            ) : (
              // Fallback to categories
              <>
                <li>
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 font-medium hover:bg-gray-50"
                  >
                    Naslovnica
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/category/${category.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-3 px-4 font-medium hover:bg-gray-50"
                    >
                      {typeof category.title === 'string' ? category.title : category.title}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/posts"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 font-medium hover:bg-gray-50"
                  >
                    Blog
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </>
  )
}
