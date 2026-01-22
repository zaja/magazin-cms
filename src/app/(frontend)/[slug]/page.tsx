import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Page } from '@/payload-types'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    depth: 1,
    limit: 1,
  })

  const page = result.docs[0] as Page | undefined

  if (!page) {
    return { title: 'Page Not Found' }
  }

  return {
    title: page.title,
    description: page.meta?.description || page.title,
  }
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params

  const reservedSlugs = ['posts', 'tags', 'subscribe', 'categories']
  if (reservedSlugs.includes(slug)) {
    notFound()
  }

  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    depth: 2,
    limit: 1,
  })

  const page = result.docs[0] as Page | undefined

  if (!page) {
    notFound()
  }

  return (
    <>
      {/* Page Header - Always show title */}
      <section className="bg-gray-50 py-12 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {page.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Hero Section - if exists and not 'none' */}
      {page.hero && page.hero.type !== 'none' && <RenderHero {...page.hero} />}

      {/* Page Content - Layout Blocks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {page.layout && page.layout.length > 0 ? (
            <RenderBlocks blocks={page.layout} />
          ) : (
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600">Ova stranica nema sadržaj.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
