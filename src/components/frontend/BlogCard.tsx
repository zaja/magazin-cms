import Link from 'next/link'
import Image from 'next/image'
import type { Post, Media, Category } from '@/payload-types'
import { formatDate } from '@/lib/payload'

interface BlogCardProps {
  post: Post
  variant?: 'default' | 'featured' | 'small'
}

export function BlogCard({ post, variant = 'default' }: BlogCardProps) {
  const heroImage = post.heroImage as Media | undefined
  const categories = post.categories as Category[] | undefined
  const category = categories?.[0]

  const imageUrl = heroImage?.url || '/placeholder.jpg'
  const imageAlt = heroImage?.alt || post.title

  if (variant === 'featured') {
    return (
      <Link href={`/posts/${post.slug}`} className="group block">
        <div className="overflow-hidden mb-4">
          {heroImage?.url ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={800}
              height={500}
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full aspect-[16/10] bg-neutral-200 flex items-center justify-center">
              <span className="text-neutral-500 font-serif">Slika</span>
            </div>
          )}
        </div>
        {category && (
          <span className="inline-block bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 mb-3">
            {typeof category.title === 'string' ? category.title : category.title}
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
          {post.readingTime && ` • ${post.readingTime} min čitanja`}
        </span>
      </Link>
    )
  }

  if (variant === 'small') {
    return (
      <Link href={`/posts/${post.slug}`} className="flex gap-4 group">
        <div className="w-20 h-20 bg-gray-200 flex-shrink-0 overflow-hidden">
          {heroImage?.url ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200" />
          )}
        </div>
        <div>
          <h5 className="font-semibold text-sm leading-tight group-hover:text-neutral-600 transition-colors">
            {post.title}
          </h5>
          <span className="text-xs text-gray-500">
            {post.publishedAt && formatDate(post.publishedAt)}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <article className="article-card group">
      <Link href={`/posts/${post.slug}`} className="block">
        <div className="overflow-hidden mb-4">
          {heroImage?.url ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={400}
              height={280}
              className="article-image w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-neutral-200 flex items-center justify-center">
              <span className="text-neutral-500 font-serif">Slika</span>
            </div>
          )}
        </div>
        {category && (
          <span className="inline-block bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider px-3 py-1 mb-3">
            {typeof category.title === 'string' ? category.title : category.title}
          </span>
        )}
        <h3 className="article-title font-serif text-xl font-bold leading-tight mb-2 group-hover:text-neutral-600 transition-colors">
          {post.title}
        </h3>
        {post.excerpt && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>}
        <span className="text-sm text-gray-500">
          {post.publishedAt && formatDate(post.publishedAt)}
        </span>
      </Link>
    </article>
  )
}
