import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Post, Media, Category } from '@/payload-types'
import { Pagination } from '@/components/frontend/Pagination'
import RichText from '@/components/RichText'

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
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    locale: 'hr',
  })

  const category = result.docs[0] as Category | undefined

  if (!category) {
    return { title: 'Kategorija nije pronađena' }
  }

  const title = typeof category.title === 'string' ? category.title : 'Kategorija'

  return {
    title: title,
    description: `Članci iz kategorije ${title}`,
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config })

  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    depth: 0,
  })

  return categories.docs.map((category) => ({
    slug: category.slug,
  }))
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page } = await searchParams
  const currentPage = Number(page) || 1

  const payload = await getPayload({ config })

  const categoryResult = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    locale: 'hr',
  })

  const category = categoryResult.docs[0] as Category | undefined

  if (!category) {
    notFound()
  }

  const categoryTitle = typeof category.title === 'string' ? category.title : 'Kategorija'
  const categoryImage = category.image as Media | undefined

  const postsResult = await payload.find({
    collection: 'posts',
    depth: 2,
    limit: 9,
    page: currentPage,
    locale: 'hr',
    where: {
      and: [{ _status: { equals: 'published' } }, { 'categories.slug': { equals: slug } }],
    },
    sort: '-publishedAt',
  })

  const posts = postsResult.docs as Post[]

  // Get all categories for the filter bar
  const allCategoriesResult = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 20,
    sort: 'order',
    locale: 'hr',
  })

  const allCategories = allCategoriesResult.docs as Category[]

  return (
    <>
      {/* Page Header with Hero Image */}
      <section className="relative bg-neutral-900 text-white py-24 md:py-32">
        {categoryImage?.url && (
          <>
            <Image
              src={categoryImage.url}
              alt={categoryImage.alt || categoryTitle}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 mb-4 text-sm font-medium uppercase tracking-wider bg-white/20 backdrop-blur-sm">
            Kategorija
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {categoryTitle}
          </h1>
          {category.description && (
            <div className="max-w-2xl mx-auto text-gray-200">
              <RichText
                data={category.description}
                enableGutter={false}
                enableProse={false}
                className="prose-invert"
              />
            </div>
          )}
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-white border-b border-gray-200 sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/posts"
              className="px-5 py-2 text-sm font-medium uppercase tracking-wider border-2 border-gray-200 text-gray-700 hover:border-neutral-900 hover:text-neutral-900 transition-all"
            >
              Svi
            </Link>
            {allCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={`px-5 py-2 text-sm font-medium uppercase tracking-wider border-2 transition-all ${
                  cat.slug === slug
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-neutral-900 hover:text-neutral-900'
                }`}
              >
                {typeof cat.title === 'string' ? cat.title : 'Kategorija'}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">Nema članaka u ovoj kategoriji.</p>
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
              const postCategories = post.categories as Category[] | undefined
              const postCategory = postCategories?.[0]

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
                    {postCategory && (
                      <span className="inline-block bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider px-3 py-1 mb-3">
                        {typeof postCategory.title === 'string' ? postCategory.title : 'Kategorija'}
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
          baseUrl={`/category/${slug}`}
        />
      </section>
    </>
  )
}
