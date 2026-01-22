/**
 * Input sanitization utilities for preventing XSS and other injection attacks
 */

const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return ''
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char)
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(str: string): string {
  if (typeof str !== 'string') return ''
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Sanitize a string for safe database storage
 * Removes null bytes and trims whitespace
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') return ''
  return str
    .replace(/\0/g, '') // Remove null bytes
    .trim()
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''
  return email.toLowerCase().trim()
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  if (typeof url !== 'string') return null

  const trimmed = url.trim()

  // Check for javascript: or data: URLs (XSS vectors)
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return null
  }

  // Ensure URL starts with http:// or https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`
  }

  return trimmed
}

/**
 * Sanitize slug (URL-safe string)
 */
export function sanitizeSlug(str: string): string {
  if (typeof str !== 'string') return ''
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Check if string contains potential SQL injection patterns
 */
export function hasSqlInjection(str: string): boolean {
  if (typeof str !== 'string') return false
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b)\s*\d+\s*=\s*\d+/i,
  ]
  return sqlPatterns.some((pattern) => pattern.test(str))
}

/**
 * Sanitize comment content
 */
export function sanitizeComment(content: string): string {
  if (typeof content !== 'string') return ''

  // Strip HTML, remove null bytes, trim
  let sanitized = stripHtml(content)
  sanitized = sanitizeString(sanitized)

  // Limit length
  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000)
  }

  return sanitized
}
