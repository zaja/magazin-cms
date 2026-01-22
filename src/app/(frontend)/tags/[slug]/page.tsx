import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Post, Media, Category, Tag } from '@/payload-types'
import { Pagination } from '@/components/frontend/Pagination'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('hr-HR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const tag = result.docs[0] as Tag | undefined

  if (!tag) {
    return { title: 'Tag Not Found' }
  }

  return {
    title: `#${tag.name}`,
    description: `Članci označeni tagom ${tag.name}`,
  }
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page } = await searchParams
  const currentPage = Number(page) || 1

  const payload = await getPayload({ config })

  const tagResult = await payload.find({
    collection: 'tags',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const tag = tagResult.docs[0] as Tag | undefined

  if (!tag) {
    notFound()
  }

  const postsResult = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 9,
    page: currentPage,
    where: {
      and: [{ _status: { equals: 'published' } }, { 'tags.slug': { equals: slug } }],
    },
    sort: '-publishedAt',
  })

  const posts = postsResult.docs as Post[]

  return (
    <>
      {/* Page Header */}
      <section className="bg-neutral-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span
            className="inline-block px-4 py-2 mb-4 text-sm font-medium uppercase tracking-wider"
            style={{ backgroundColor: tag.color || '#737373' }}
          >
            Tag
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            #{tag.name}
          </h1>
          {tag.description && (
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{tag.description}</p>
          )}
        </div>
      </section>

      {/* Posts Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Nema članaka s ovim tagom.</p>
            <Link
              href="/posts"
              className="inline-block mt-4 px-6 py-3 bg-neutral-900 text-white font-semibold uppercase tracking-wider text-sm hover:bg-neutral-800 transition-colors"
            >
              Pogledaj sve članke
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => {
              const heroImage = post.heroImage as Media | undefined
              const categories = post.categories as Category[] | undefined
              const category = categories?.[0]

              return (
                <article key={post.id} className="article-card group">
                  <Link href={`/posts/${post.slug}`} className="block">
                    <div className="overflow-hidden mb-4">
                      {heroImage?.url ? (
                        <Image
                          src={heroImage.url}
                          alt={heroImage.alt || post.title}
                          width={400}
                          height={280}
                          className="article-image w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full aspect-[4/3] bg-neutral-100 flex items-center justify-center">
                          <span className="text-neutral-400 font-serif">Slika</span>
                        </div>
                      )}
                    </div>
                    {category && (
                      <span className="inline-block bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider px-3 py-1 mb-3">
                        {typeof category.title === 'string' ? category.title : 'Kategorija'}
                      </span>
                    )}
                    <h3 className="article-title font-serif text-xl font-bold leading-tight mb-2 group-hover:text-neutral-600 transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                    )}
                    <span className="text-sm text-gray-500">
                      {post.publishedAt && formatDate(post.publishedAt)}
                    </span>
                  </Link>
                </article>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={postsResult.totalPages}
          baseUrl={`/tags/${slug}`}
        />
      </section>
    </>
  )
}
