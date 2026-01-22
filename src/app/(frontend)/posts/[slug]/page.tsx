import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Post, Media, Category, Tag } from '@/payload-types'
import { SubscribeForm } from '@/components/frontend/SubscribeForm'
import { ViewTracker } from '@/components/frontend/ViewTracker'
import RichText from '@/components/RichText'
import { CommentSection } from './CommentSection'

type Props = {
  params: Promise<{ slug: string }>
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
    collection: 'posts',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    depth: 1,
    limit: 1,
  })

  const post = result.docs[0] as Post | undefined

  if (!post) {
    return { title: 'Post Not Found' }
  }

  return {
    title: post.title,
    description: post.excerpt || post.title,
  }
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    depth: 2,
    limit: 1,
    locale: 'hr',
  })

  const post = result.docs[0] as Post | undefined

  if (!post) {
    notFound()
  }

  const heroImage = post.heroImage as Media | undefined
  const categories = post.categories as Category[] | undefined
  const tags = post.tags as Tag[] | undefined
  const authors = post.populatedAuthors as Array<{ id: string; name: string }> | undefined
  const author = authors?.[0]

  const relatedResult = await payload.find({
    collection: 'posts',
    where: {
      and: [{ _status: { equals: 'published' } }, { id: { not_equals: post.id } }],
    },
    depth: 2,
    limit: 4,
    sort: '-publishedAt',
    locale: 'hr',
  })

  const relatedPosts = relatedResult.docs as Post[]

  return (
    <>
      <ViewTracker postId={post.id} />

      {/* Breadcrumb */}
      <nav className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/" className="text-gray-500 hover:text-neutral-900 transition-colors">
                Naslovnica
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link
                href="/posts"
                className="text-gray-500 hover:text-neutral-900 transition-colors"
              >
                Blog
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-neutral-900 font-medium truncate max-w-[200px]">{post.title}</li>
          </ol>
        </div>
      </nav>

      {/* Article Header */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              {categories?.[0] && (
                <span className="inline-block bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1">
                  {typeof categories[0].title === 'string' ? categories[0].title : 'Kategorija'}
                </span>
              )}
              <span className="text-gray-500 text-sm">
                {post.publishedAt && formatDate(post.publishedAt)}
              </span>
              {post.readingTime && (
                <>
                  <span className="text-gray-500 text-sm">•</span>
                  <span className="text-gray-500 text-sm">{post.readingTime} min čitanja</span>
                </>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-xl text-gray-600 leading-relaxed mb-8">{post.excerpt}</p>
            )}

            {/* Author */}
            {author && (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-200 flex items-center justify-center">
                  <span className="font-serif font-bold text-neutral-700">
                    {author.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || 'AU'}
                  </span>
                </div>
                <div>
                  <div className="font-semibold">{author.name}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {heroImage?.url && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <Image
              src={heroImage.url}
              alt={heroImage.alt || post.title}
              width={1200}
              height={600}
              className="w-full"
            />
            {heroImage.caption && (
              <p className="text-center text-sm text-gray-500 mt-4">
                {typeof heroImage.caption === 'string' ? heroImage.caption : 'Foto'}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Article Content & Sidebar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <article className="lg:col-span-8">
            {post.content && (
              <RichText
                data={post.content}
                enableGutter={false}
                enableProse={true}
                className="prose-lg prose-neutral"
              />
            )}

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500 mr-2">Tagovi:</span>
                  {tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="px-3 py-1 bg-gray-100 text-sm text-gray-700 hover:bg-neutral-900 hover:text-white transition-colors"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Share Buttons */}
            <div className="mt-8 flex items-center gap-4">
              <span className="text-sm font-semibold uppercase tracking-wider">Podijeli:</span>
              <div className="flex gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_SERVER_URL}/posts/${post.slug}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-all"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_SERVER_URL}/posts/${post.slug}`,
                  )}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-all"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Comments Section */}
            {post.allowComments !== false && <CommentSection postId={String(post.id)} />}
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            {/* Newsletter */}
            <div className="mb-8">
              <SubscribeForm variant="sidebar" />
            </div>

            {/* Categories */}
            {categories && categories.length > 0 && (
              <div className="mb-8">
                <h4 className="font-serif text-lg font-bold mb-4 pb-2 border-b border-gray-200">
                  Kategorije
                </h4>
                <ul className="space-y-2">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <Link
                        href={`/posts?category=${cat.slug}`}
                        className="flex justify-between items-center py-2 text-sm hover:text-neutral-600 transition-colors"
                      >
                        <span>{typeof cat.title === 'string' ? cat.title : 'Kategorija'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl font-bold mb-8">Možda vam se sviđa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedPosts.map((relatedPost) => {
                const relatedImage = relatedPost.heroImage as Media | undefined
                const relatedCategories = relatedPost.categories as Category[] | undefined

                return (
                  <Link
                    key={relatedPost.id}
                    href={`/posts/${relatedPost.slug}`}
                    className="article-card group"
                  >
                    <div className="overflow-hidden mb-4">
                      {relatedImage?.url ? (
                        <Image
                          src={relatedImage.url}
                          alt={relatedImage.alt || relatedPost.title}
                          width={300}
                          height={200}
                          className="article-image w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full aspect-[3/2] bg-neutral-100 flex items-center justify-center">
                          <span className="text-neutral-400 font-serif">Slika</span>
                        </div>
                      )}
                    </div>
                    {relatedCategories?.[0] && (
                      <span className="inline-block bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider px-3 py-1 mb-3">
                        {typeof relatedCategories[0].title === 'string'
                          ? relatedCategories[0].title
                          : 'Kategorija'}
                      </span>
                    )}
                    <h3 className="article-title font-serif text-base font-bold leading-tight group-hover:text-neutral-600 transition-colors">
                      {relatedPost.title}
                    </h3>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
