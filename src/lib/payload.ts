import type { Post, Category, Tag, Page } from '@/payload-types'

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

interface PaginatedResponse<T> {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export async function getPosts(options?: {
  page?: number
  limit?: number
  category?: string
  tag?: string
}): Promise<PaginatedResponse<Post>> {
  const { page = 1, limit = 10, category, tag } = options || {}

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    depth: '1',
    sort: '-publishedAt',
    'where[_status][equals]': 'published',
  })

  if (category) {
    params.append('where[categories.slug][equals]', category)
  }

  if (tag) {
    params.append('where[tags.slug][equals]', tag)
  }

  const res = await fetch(`${API_URL}/api/posts?${params}`, {
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch posts')
  }

  return res.json()
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const res = await fetch(
    `${API_URL}/api/posts?where[slug][equals]=${slug}&where[_status][equals]=published&depth=2&limit=1`,
    { next: { revalidate: 60 } },
  )

  if (!res.ok) {
    return null
  }

  const data = await res.json()
  return data.docs[0] || null
}

export async function getFeaturedPosts(limit = 3): Promise<Post[]> {
  const res = await fetch(
    `${API_URL}/api/posts?where[_status][equals]=published&depth=1&limit=${limit}&sort=-publishedAt`,
    { next: { revalidate: 60 } },
  )

  if (!res.ok) {
    return []
  }

  const data = await res.json()
  return data.docs
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories?depth=0&limit=100&sort=order`, {
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    return []
  }

  const data = await res.json()
  return data.docs
}

export async function getTags(): Promise<Tag[]> {
  const res = await fetch(`${API_URL}/api/tags?depth=0&limit=100&sort=name`, {
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    return []
  }

  const data = await res.json()
  return data.docs
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const res = await fetch(`${API_URL}/api/tags?where[slug][equals]=${slug}&limit=1`, {
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    return null
  }

  const data = await res.json()
  return data.docs[0] || null
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const res = await fetch(
    `${API_URL}/api/pages?where[slug][equals]=${slug}&where[_status][equals]=published&depth=2&limit=1`,
    { next: { revalidate: 60 } },
  )

  if (!res.ok) {
    return null
  }

  const data = await res.json()
  return data.docs[0] || null
}

export async function getRelatedPosts(
  postId: string,
  categoryIds: string[],
  limit = 4,
): Promise<Post[]> {
  if (!categoryIds.length) return []

  const categoryQuery = categoryIds.map((id) => `where[categories][in]=${id}`).join('&')

  const res = await fetch(
    `${API_URL}/api/posts?${categoryQuery}&where[id][not_equals]=${postId}&where[_status][equals]=published&depth=1&limit=${limit}&sort=-publishedAt`,
    { next: { revalidate: 60 } },
  )

  if (!res.ok) {
    return []
  }

  const data = await res.json()
  return data.docs
}

export function formatDate(date: string, locale = 'hr-HR'): string {
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(date: string, locale = 'hr-HR'): string {
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  })
}
