/**
 * Processes media resource URL to ensure proper formatting.
 * Returns RELATIVE URLs for local media to avoid hydration mismatches
 * between server (localhost) and client (actual IP/domain).
 *
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  let cacheSuffix = ''
  if (cacheTag && cacheTag !== '') {
    cacheSuffix = `?${encodeURIComponent(cacheTag)}`
  }

  // If URL is already absolute (external), return as-is with cache tag
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `${url}${cacheSuffix}`
  }

  // For local media, use relative URL to avoid SSR/client hostname mismatch
  // Ensure URL starts with /
  const relativeUrl = url.startsWith('/') ? url : `/${url}`
  return `${relativeUrl}${cacheSuffix}`
}
