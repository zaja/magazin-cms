import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import type { Post, Media, Category } from '@/payload-types'
import { Pagination } from '@/components/frontend/Pagination'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Istražite naše najnovije članke, priče i inspiracije.',
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('hr-HR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const categorySlug = params.category

  const payload = await getPayload({ config })

  const categoriesResult = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 20,
    sort: 'order',
    locale: 'hr',
  })

  const postsResult = await payload.find({
    collection: 'posts',
    depth: 2,
    limit: 9,
    page: currentPage,
    locale: 'hr',
    where: categorySlug
      ? {
          and: [
            { _status: { equals: 'published' } },
            { 'categories.slug': { equals: categorySlug } },
          ],
        }
      : { _status: { equals: 'published' } },
    sort: '-publishedAt',
  })

  const posts = postsResult.docs as Post[]
  const categories = categoriesResult.docs as Category[]

  return (
    <>
      {/* Page Header */}
      <section className="bg-neutral-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Blog</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Istražite naše najnovije članke, priče i inspiracije iz svijeta mode, lepote i
            lifestylea.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-white border-b border-gray-200 sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/posts"
              className={`px-5 py-2 text-sm font-medium uppercase tracking-wider border-2 transition-all ${
                !categorySlug
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-gray-200 text-gray-700 hover:border-neutral-900 hover:text-neutral-900'
              }`}
            >
              Svi
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/posts?category=${category.slug}`}
                className={`px-5 py-2 text-sm font-medium uppercase tracking-wider border-2 transition-all ${
                  categorySlug === category.slug
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-neutral-900 hover:text-neutral-900'
                }`}
              >
                {typeof category.title === 'string' ? category.title : 'Kategorija'}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Nema pronađenih članaka.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => {
              const heroImage = post.heroImage as Media | undefined
              const postCategories = post.categories as Category[] | undefined
              const category = postCategories?.[0]

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
          baseUrl={categorySlug ? `/posts?category=${categorySlug}` : '/posts'}
        />
      </section>
    </>
  )
}
