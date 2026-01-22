/**
 * Generates URL-safe slugs with Croatian character support
 */

const croatianCharMap: Record<string, string> = {
  đ: 'dj',
  Đ: 'dj',
  č: 'c',
  Č: 'c',
  ć: 'c',
  Ć: 'c',
  š: 's',
  Š: 's',
  ž: 'z',
  Ž: 'z',
}

/**
 * Generates a URL-safe slug from a title string
 * Supports Croatian characters (đ, č, ć, š, ž)
 *
 * @param title - The title to convert to a slug
 * @returns URL-safe slug string
 */
export function generateSlug(title: string): string {
  if (!title) return ''

  let slug = title.toLowerCase()

  // Replace Croatian characters
  for (const [char, replacement] of Object.entries(croatianCharMap)) {
    slug = slug.replace(new RegExp(char, 'g'), replacement)
  }

  // Replace common special characters
  slug = slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

  return slug
}

/**
 * Generates a unique slug by appending a number if needed
 *
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns Unique slug string
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }

  let counter = 1
  let uniqueSlug = `${baseSlug}-${counter}`

  while (existingSlugs.includes(uniqueSlug)) {
    counter++
    uniqueSlug = `${baseSlug}-${counter}`
  }

  return uniqueSlug
}
