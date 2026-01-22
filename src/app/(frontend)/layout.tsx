import type { Metadata } from 'next'
import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

import { Header, type HeaderProps } from '@/components/frontend/Header'
import { Footer, type FooterProps } from '@/components/frontend/Footer'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { AdminBar } from '@/components/AdminBar'
import { draftMode } from 'next/headers'
import { getServerSideURL } from '@/utilities/getURL'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import { OrganizationJsonLd } from '@/components/OrganizationJsonLd'

import './globals.css'
import './magazine.css'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config })

  const [categoriesResult, settingsResult, seoResult, headerResult, footerResult] =
    await Promise.all([
      payload.find({
        collection: 'categories',
        depth: 0,
        limit: 10,
        sort: 'order',
      }),
      payload.findGlobal({
        slug: 'settings',
        depth: 2,
      }),
      payload.findGlobal({
        slug: 'seo',
        depth: 2,
      }),
      payload.findGlobal({
        slug: 'header',
        depth: 2,
      }),
      payload.findGlobal({
        slug: 'footer',
        depth: 2,
      }),
    ])

  const siteName =
    typeof settingsResult?.siteName === 'string'
      ? settingsResult.siteName
      : settingsResult?.siteName || 'Magazin CMS'

  const logo = settingsResult?.logo as { url?: string; alt?: string } | null
  const logoUrl = logo?.url || null
  const logoAlt = logo?.alt || siteName
  const logoWidth = (settingsResult?.logoWidth as number) || 120

  const favicon = settingsResult?.favicon as { url?: string } | null
  const faviconUrl = favicon?.url || '/favicon.ico'

  const language = (settingsResult?.language as string) || 'hr'
  const maintenanceMode = settingsResult?.maintenanceMode === true
  const maintenanceMessage = settingsResult?.maintenanceMessage
  const googleAnalyticsId = seoResult?.googleAnalyticsId as string | undefined
  const googleSiteVerification = seoResult?.googleSiteVerification as string | undefined

  const structuredData = seoResult?.structuredData as
    | {
        organizationName?: string
        organizationLogo?: { url?: string }
        socialLinks?: Array<{ platform?: string; url?: string }>
      }
    | undefined

  return (
    <html
      className={cn(GeistSans.variable, GeistMono.variable)}
      lang={language}
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href={faviconUrl} rel="icon" sizes="32x32" />
        <link href={faviconUrl} rel="icon" type="image/svg+xml" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {googleSiteVerification && (
          <meta name="google-site-verification" content={googleSiteVerification} />
        )}
      </head>
      <body className="bg-white text-neutral-900 antialiased">
        <Providers>
          <AdminBar adminBarProps={{ preview: isEnabled }} />
          <Header
            categories={categoriesResult.docs}
            siteName={siteName as string}
            logoUrl={logoUrl}
            logoAlt={logoAlt as string}
            logoWidth={logoWidth}
            navItems={headerResult?.navItems as HeaderProps['navItems']}
          />
          <main>
            {maintenanceMode ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="max-w-xl mx-auto px-4 text-center">
                  <h1 className="font-serif text-4xl font-bold mb-6">Održavanje u tijeku</h1>
                  {maintenanceMessage ? (
                    <div className="prose prose-lg mx-auto">
                      {typeof maintenanceMessage === 'string' ? (
                        <p>{maintenanceMessage}</p>
                      ) : (
                        <p>Stranica je trenutno u održavanju. Molimo pokušajte kasnije.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      Stranica je trenutno u održavanju. Molimo pokušajte kasnije.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              children
            )}
          </main>
          <Footer
            categories={categoriesResult.docs}
            siteName={siteName as string}
            logoUrl={logoUrl}
            logoAlt={logoAlt as string}
            columns={footerResult?.columns as FooterProps['columns']}
            socialLinks={footerResult?.socialLinks as FooterProps['socialLinks']}
            copyright={footerResult?.copyright as string | null}
            description={footerResult?.description as string | null}
          />
        </Providers>
        {googleAnalyticsId && <GoogleAnalytics gaId={googleAnalyticsId} />}
        {structuredData?.organizationName && (
          <OrganizationJsonLd
            name={structuredData.organizationName}
            logo={structuredData.organizationLogo?.url}
            sameAs={structuredData.socialLinks?.map((link) => link.url).filter(Boolean) as string[]}
          />
        )}
      </body>
    </html>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config })

  const [settings, seo] = await Promise.all([
    payload.findGlobal({ slug: 'settings', depth: 1 }),
    payload.findGlobal({ slug: 'seo', depth: 1 }),
  ])

  const siteName = (settings?.siteName as string) || 'Magazin CMS'
  const siteDescription = (settings?.siteDescription as string) || ''
  const defaultMetaTitle = (seo?.defaultMetaTitle as string) || siteName
  const defaultMetaDescription = (seo?.defaultMetaDescription as string) || siteDescription
  const defaultOgImage = seo?.defaultOgImage as { url?: string } | undefined
  const twitterHandle = (seo?.twitterHandle as string) || undefined

  return {
    metadataBase: new URL(getServerSideURL()),
    title: {
      default: defaultMetaTitle,
      template: `%s | ${siteName}`,
    },
    description: defaultMetaDescription,
    openGraph: {
      title: defaultMetaTitle,
      description: defaultMetaDescription,
      siteName: siteName,
      locale: 'hr_HR',
      type: 'website',
      ...(defaultOgImage?.url && { images: [{ url: defaultOgImage.url }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: defaultMetaTitle,
      description: defaultMetaDescription,
      ...(twitterHandle && { creator: twitterHandle }),
      ...(defaultOgImage?.url && { images: [defaultOgImage.url] }),
    },
  }
}
