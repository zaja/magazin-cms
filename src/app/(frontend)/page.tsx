import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import type { Post, Media, Category } from '@/payload-types'
import { SubscribeForm } from '@/components/frontend/SubscribeForm'

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config })

  const [settings, seo] = await Promise.all([
    payload.findGlobal({ slug: 'settings', depth: 0 }),
    payload.findGlobal({ slug: 'seo', depth: 0 }),
  ])

  const siteName = (settings?.siteName as string) || 'Magazin CMS'
  const defaultTitle = (seo?.defaultMetaTitle as string) || siteName
  const defaultDescription =
    (seo?.defaultMetaDescription as string) || (settings?.siteDescription as string) || ''

  return {
    title: defaultTitle,
    description: defaultDescription,
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('hr-HR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function PostCard({
  post,
  variant = 'default',
}: {
  post: Post
  variant?: 'featured' | 'side' | 'default' | 'trending'
}) {
  const heroImage = post.heroImage as Media | undefined
  const categories = post.categories as Category[] | undefined
  const category = categories?.[0]

  if (variant === 'featured') {
    return (
      <Link href={`/posts/${post.slug}`} className="group block">
        <div className="overflow-hidden mb-4">
          {heroImage?.url ? (
            <Image
              src={heroImage.url}
              alt={heroImage.alt || post.title}
              width={800}
              height={500}
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full aspect-[16/10] bg-neutral-200 flex items-center justify-center">
              <span className="text-neutral-500 font-serif text-2xl">Hero slika</span>
            </div>
          )}
        </div>
        {category && (
          <span className="inline-block bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 mb-3">
            {typeof category.title === 'string' ? category.title : 'Kategorija'}
          </span>
        )}
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 group-hover:text-neutral-600 transition-colors">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-gray-600 text-lg leading-relaxed mb-3">{post.excerpt}</p>
        )}
        <span className="text-sm text-gray-500">
          {post.publishedAt && formatDate(post.publishedAt)}
        </span>
      </Link>
    )
  }

  if (variant === 'side') {
    return (
      <Link href={`/posts/${post.slug}`} className="group block">
        <div className="overflow-hidden mb-3">
          {heroImage?.url ? (
            <Image
              src={heroImage.url}
              alt={heroImage.alt || post.title}
              width={400}
              height={250}
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full aspect-[16/10] bg-neutral-100 flex items-center justify-center">
              <span className="text-neutral-400 font-serif">Slika</span>
            </div>
          )}
        </div>
        {category && (
          <span className="inline-block bg-neutral-300 text-neutral-900 text-xs font-bold uppercase tracking-wider px-3 py-1 mb-2">
            {typeof category.title === 'string' ? category.title : 'Kategorija'}
          </span>
        )}
        <h3 className="font-serif text-xl font-bold leading-tight group-hover:text-neutral-600 transition-colors">
          {post.title}
        </h3>
      </Link>
    )
  }

  if (variant === 'trending') {
    return (
      <Link href={`/posts/${post.slug}`} className="group">
        <div className="overflow-hidden mb-4">
          {heroImage?.url ? (
            <Image
              src={heroImage.url}
              alt={heroImage.alt || post.title}
              width={400}
              height={300}
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-neutral-200 flex items-center justify-center">
              <span className="text-neutral-500 font-serif">Slika</span>
            </div>
          )}
        </div>
        {category && (
          <span className="inline-block bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 mb-3">
            {typeof category.title === 'string' ? category.title : 'Kategorija'}
          </span>
        )}
        <h3 className="font-serif text-xl font-bold leading-tight mb-2 group-hover:text-neutral-600 transition-colors">
          {post.title}
        </h3>
        {post.excerpt && <p className="text-gray-600 text-sm">{post.excerpt}</p>}
      </Link>
    )
  }

  return (
    <Link href={`/posts/${post.slug}`} className="article-card group">
      <div className="overflow-hidden mb-4">
        {heroImage?.url ? (
          <Image
            src={heroImage.url}
            alt={heroImage.alt || post.title}
            width={300}
            height={380}
            className="article-image w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full aspect-[3/4] bg-neutral-100 flex items-center justify-center">
            <span className="text-neutral-400 font-serif">Slika</span>
          </div>
        )}
      </div>
      {category && (
        <span className="inline-block bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider px-3 py-1 mb-3">
          {typeof category.title === 'string' ? category.title : 'Kategorija'}
        </span>
      )}
      <h3 className="article-title font-serif text-lg font-bold leading-tight mb-2 group-hover:text-neutral-600 transition-colors">
        {post.title}
      </h3>
      <span className="text-sm text-gray-500">
        {post.publishedAt && formatDate(post.publishedAt)}
      </span>
    </Link>
  )
}

export default async function HomePage() {
  const payload = await getPayload({ config })

  const postsResult = await payload.find({
    collection: 'posts',
    depth: 2,
    limit: 12,
    locale: 'hr',
    where: {
      _status: { equals: 'published' },
    },
    sort: '-publishedAt',
  })

  const posts = postsResult.docs as Post[]
  const featuredPost = posts[0]
  const sidePosts = posts.slice(1, 3)
  const latestPosts = posts.slice(3, 7)
  const trendingPosts = posts.slice(7, 10)

  return (
    <>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Featured Article */}
          <div className="lg:col-span-8">
            {featuredPost && <PostCard post={featuredPost} variant="featured" />}
          </div>

          {/* Side Featured Articles */}
          <div className="lg:col-span-4 space-y-8">
            {sidePosts.map((post) => (
              <PostCard key={post.id} post={post} variant="side" />
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="divider-line max-w-7xl mx-auto my-12" />

      {/* Latest Articles Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-serif text-3xl font-bold">Najnovije</h2>
          <Link
            href="/posts"
            className="text-sm font-medium uppercase tracking-wider hover:text-neutral-600 transition-colors"
          >
            Pogledaj sve &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {latestPosts.map((post) => (
            <PostCard key={post.id} post={post} variant="default" />
          ))}
        </div>
      </section>

      {/* Trending Section */}
      {trendingPosts.length > 0 && (
        <section className="bg-neutral-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-3xl font-bold">U fokusu</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {trendingPosts.map((post) => (
                <PostCard key={post.id} post={post} variant="trending" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <SubscribeForm variant="hero" />
    </>
  )
}
