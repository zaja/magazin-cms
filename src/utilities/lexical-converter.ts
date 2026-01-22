/**
 * Lexical editor content converter utilities
 * Converts between HTML and Lexical JSON format
 */

import type { SerializedLexicalNode } from 'lexical'
import { JSDOM } from 'jsdom'

interface LexicalTextNode {
  type: 'text'
  text: string
  format: number
  detail: number
  mode: string
  style: string
  version: number
}

interface LexicalElementNode {
  type: string
  children: SerializedLexicalNode[]
  direction: 'ltr' | 'rtl' | null
  format: string
  indent: number
  version: number
  tag?: string
  listType?: string
  start?: number
  value?: number
}

/**
 * Converts HTML string to Lexical JSON format
 * Creates a simplified Lexical structure compatible with Payload's Lexical editor
 *
 * @param html - HTML string to convert
 * @returns Lexical JSON structure
 */
export function htmlToLexical(html: string): Record<string, unknown> {
  if (!html || html.trim() === '') {
    return createEmptyLexicalState()
  }

  // Parse HTML using JSDOM (server-compatible)
  const dom = new JSDOM(html)
  const body = dom.window.document.body

  // Recursively collect all block-level nodes, flattening containers
  const children = collectBlockNodes(body)

  // If no children were parsed, create a single paragraph with the plain text
  if (children.length === 0) {
    // Strip HTML tags and use plain text
    const plainText = html.replace(/<[^>]*>/g, '').trim()
    children.push(createParagraphNode([createTextNode(plainText || ' ')]))
  }

  // Filter out any null/undefined children and ensure all are valid
  const validChildren = children.filter((child): child is SerializedLexicalNode => {
    if (!child) return false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = child as any
    // Ensure required fields exist
    return typeof c.type === 'string' && typeof c.version === 'number'
  })

  // If still no valid children, create a placeholder paragraph
  if (validChildren.length === 0) {
    validChildren.push(createParagraphNode([createTextNode(' ')]))
  }

  return {
    root: {
      type: 'root',
      children: validChildren,
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

/**
 * Recursively collects block-level nodes from DOM, flattening containers
 */
function collectBlockNodes(element: Element): SerializedLexicalNode[] {
  const blocks: SerializedLexicalNode[] = []
  const CONTAINER_TAGS = new Set(['div', 'article', 'section', 'main', 'figure'])
  const BLOCK_TAGS = new Set([
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'blockquote',
    'pre',
  ])

  for (const child of Array.from(element.childNodes)) {
    const TEXT_NODE = 3
    const ELEMENT_NODE = 1

    // Handle text nodes - wrap in paragraph if non-empty
    if (child.nodeType === TEXT_NODE) {
      const text = child.textContent?.trim()
      if (text) {
        blocks.push(createParagraphNode([createTextNode(text)]))
      }
      continue
    }

    if (child.nodeType !== ELEMENT_NODE) continue

    const el = child as Element
    const tagName = el.tagName.toLowerCase()

    // Container elements - recurse into them
    if (CONTAINER_TAGS.has(tagName)) {
      const nestedBlocks = collectBlockNodes(el)
      blocks.push(...nestedBlocks)
      continue
    }

    // Block-level elements - convert directly
    if (BLOCK_TAGS.has(tagName)) {
      const node = convertDOMNodeToLexical(child)
      if (node) {
        blocks.push(node)
      }
      continue
    }

    // Other elements - try to convert, wrap in paragraph if inline
    const node = convertDOMNodeToLexical(child)
    if (node) {
      if (isBlockNode(node)) {
        blocks.push(node)
      } else {
        // Wrap inline nodes in a paragraph
        blocks.push(createParagraphNode([node]))
      }
    }
  }

  return blocks
}

/**
 * Creates an empty Lexical editor state
 */
function createEmptyLexicalState(): Record<string, unknown> {
  return {
    root: {
      type: 'root',
      children: [createParagraphNode([])],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

/**
 * Creates a text node
 */
function createTextNode(text: string, format: number = 0): LexicalTextNode {
  return {
    type: 'text',
    text,
    format,
    detail: 0,
    mode: 'normal',
    style: '',
    version: 1,
  }
}

/**
 * Creates a paragraph node
 * Ensures paragraph always has valid children (at least one text node)
 */
function createParagraphNode(children: SerializedLexicalNode[]): LexicalElementNode {
  // Payload's Lexical requires paragraphs to have at least one child with content
  const validChildren = children.filter((c) => c !== null && c !== undefined)

  // If no valid children, add a space to make it valid
  if (validChildren.length === 0) {
    validChildren.push(createTextNode(' '))
  }

  return {
    type: 'paragraph',
    children: validChildren,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

/**
 * Creates a heading node
 */
function createHeadingNode(
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  children: SerializedLexicalNode[],
): LexicalElementNode {
  return {
    type: 'heading',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    tag,
  }
}

/**
 * Creates a list node
 */
function createListNode(
  listType: 'bullet' | 'number',
  children: SerializedLexicalNode[],
): LexicalElementNode {
  return {
    type: 'list',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    listType,
    start: 1,
    tag: listType === 'number' ? 'ol' : 'ul',
  }
}

/**
 * Creates a list item node
 */
function createListItemNode(children: SerializedLexicalNode[], value: number): LexicalElementNode {
  return {
    type: 'listitem',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    value,
  }
}

/**
 * Creates a quote node
 */
function createQuoteNode(children: SerializedLexicalNode[]): LexicalElementNode {
  return {
    type: 'quote',
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

/**
 * Generates a random ID for Lexical nodes
 */
function generateNodeId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Creates a link node in Payload's expected format
 */
function createLinkNode(url: string, children: SerializedLexicalNode[]): SerializedLexicalNode {
  return {
    type: 'link',
    id: generateNodeId(),
    children,
    direction: null,
    format: '',
    indent: 0,
    version: 3,
    fields: {
      url,
      newTab: true,
      linkType: 'custom',
    },
  } as SerializedLexicalNode
}

/**
 * Converts a DOM node to Lexical node
 */
function convertDOMNodeToLexical(node: Node): SerializedLexicalNode | null {
  // Node type constants (for server-side compatibility)
  const TEXT_NODE = 3
  const ELEMENT_NODE = 1

  if (node.nodeType === TEXT_NODE) {
    const text = node.textContent?.trim()
    if (!text) return null
    return createTextNode(text)
  }

  if (node.nodeType !== ELEMENT_NODE) {
    return null
  }

  const element = node as Element
  const tagName = element.tagName.toLowerCase()
  const children = convertChildNodes(element)

  switch (tagName) {
    case 'p':
      return createParagraphNode(children)

    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return createHeadingNode(tagName as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6', children)

    case 'ul':
      return createListNode('bullet', children)

    case 'ol':
      return createListNode('number', children)

    case 'li': {
      // For list items, wrap text content in a paragraph if needed
      const liChildren =
        children.length > 0 ? children : [createTextNode(element.textContent || '')]
      return createListItemNode(liChildren, 1)
    }

    case 'blockquote':
      return createQuoteNode(children)

    case 'a': {
      const href = element.getAttribute('href') || '#'
      const linkChildren =
        children.length > 0 ? children : [createTextNode(element.textContent || '')]
      return createLinkNode(href, linkChildren)
    }

    case 'strong':
    case 'b': {
      const text = element.textContent || ''
      return createTextNode(text, 1) // 1 = bold format
    }

    case 'em':
    case 'i': {
      const text = element.textContent || ''
      return createTextNode(text, 2) // 2 = italic format
    }

    case 'u': {
      const text = element.textContent || ''
      return createTextNode(text, 8) // 8 = underline format
    }

    case 's':
    case 'strike': {
      const text = element.textContent || ''
      return createTextNode(text, 4) // 4 = strikethrough format
    }

    case 'br':
      return createTextNode('\n')

    case 'div':
    case 'article':
    case 'section':
    case 'figure': {
      // Container elements - process all children including blocks
      const allChildren = convertAllChildNodes(element)
      if (allChildren.length === 0) {
        const text = element.textContent?.trim()
        if (text) {
          return createParagraphNode([createTextNode(text)])
        }
        return null
      }
      // If single child, return it directly
      if (allChildren.length === 1) {
        return allChildren[0]
      }
      // For multiple block children, return first one (flatten structure)
      // This prevents nesting blocks inside blocks
      return allChildren[0]
    }

    case 'span':
      // Span is inline - just return text content
      if (children.length === 0) {
        const text = element.textContent?.trim()
        if (text) {
          return createTextNode(text)
        }
        return null
      }
      if (children.length === 1) {
        return children[0]
      }
      // Multiple children in span - return first text node
      return children[0]

    default:
      // Unknown elements - try to preserve text content
      if (children.length > 0) {
        return createParagraphNode(children)
      }
      const textContent = element.textContent?.trim()
      if (textContent) {
        return createParagraphNode([createTextNode(textContent)])
      }
      return null
  }
}

/**
 * Block-level element tags that should not be nested inside paragraphs
 */
const _BLOCK_LEVEL_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'div',
  'article',
  'section',
  'figure',
  'pre',
])

/**
 * Checks if a Lexical node is a block-level element
 */
function isBlockNode(node: SerializedLexicalNode): boolean {
  const blockTypes = ['paragraph', 'heading', 'list', 'listitem', 'quote']
  return blockTypes.includes(node.type)
}

/**
 * Converts child nodes of an element to inline Lexical nodes
 * Preserves whitespace between inline elements to maintain proper spacing
 */
function convertChildNodes(element: Element): SerializedLexicalNode[] {
  const children: SerializedLexicalNode[] = []

  for (const child of Array.from(element.childNodes)) {
    const TEXT_NODE = 3

    // Handle text nodes directly - preserve spaces for inline content
    if (child.nodeType === TEXT_NODE) {
      const rawText = child.textContent || ''
      // Normalize whitespace: collapse multiple spaces but preserve single spaces
      const text = rawText.replace(/\s+/g, ' ')
      // Only skip if completely empty
      if (text && text !== '') {
        // Trim only leading/trailing spaces from the paragraph, not between words
        children.push(createTextNode(text))
      }
      continue
    }

    const node = convertDOMNodeToLexical(child)
    if (node) {
      // If it's a block node, extract its text content instead
      if (isBlockNode(node)) {
        const textContent = (child as Element).textContent?.trim()
        if (textContent) {
          children.push(createTextNode(textContent))
        }
      } else {
        children.push(node)
      }
    }
  }

  // If still no children, try to get text content directly
  if (children.length === 0) {
    const text = element.textContent?.trim()
    if (text) {
      children.push(createTextNode(text))
    }
  }

  // Post-process: trim leading space from first text node and trailing from last
  if (children.length > 0) {
    const first = children[0] as LexicalTextNode
    if (first.type === 'text' && first.text.startsWith(' ')) {
      first.text = first.text.trimStart()
    }
    const last = children[children.length - 1] as LexicalTextNode
    if (last.type === 'text' && last.text.endsWith(' ')) {
      last.text = last.text.trimEnd()
    }
  }

  return children
}

/**
 * Converts all child nodes including blocks (for root-level processing)
 */
function convertAllChildNodes(element: Element): SerializedLexicalNode[] {
  const children: SerializedLexicalNode[] = []

  for (const child of Array.from(element.childNodes)) {
    const node = convertDOMNodeToLexical(child)
    if (node) {
      children.push(node)
    }
  }

  return children
}

/**
 * Converts Lexical JSON to HTML string
 *
 * @param lexicalState - Lexical editor state
 * @returns HTML string
 */
export function lexicalToHTML(lexicalState: Record<string, unknown> | null): string {
  if (!lexicalState) return ''

  const root = lexicalState.root as { children?: SerializedLexicalNode[] } | undefined
  if (!root?.children) {
    return ''
  }

  return root.children.map(convertLexicalNodeToHTML).join('')
}

/**
 * Converts a single Lexical node to HTML
 */
function convertLexicalNodeToHTML(node: SerializedLexicalNode): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lexicalNode = node as any

  switch (lexicalNode.type as string) {
    case 'text': {
      let text = escapeHTML(lexicalNode.text || '')
      const format = lexicalNode.format || 0

      if (format & 1) text = `<strong>${text}</strong>` // bold
      if (format & 2) text = `<em>${text}</em>` // italic
      if (format & 4) text = `<s>${text}</s>` // strikethrough
      if (format & 8) text = `<u>${text}</u>` // underline

      return text
    }

    case 'paragraph': {
      const content = lexicalNode.children?.map(convertLexicalNodeToHTML).join('') || ''
      return `<p>${content}</p>`
    }

    case 'heading': {
      const tag = lexicalNode.tag || 'h2'
      const content = lexicalNode.children?.map(convertLexicalNodeToHTML).join('') || ''
      return `<${tag}>${content}</${tag}>`
    }

    case 'list': {
      const tag = lexicalNode.listType === 'number' ? 'ol' : 'ul'
      const content = lexicalNode.children?.map(convertLexicalNodeToHTML).join('') || ''
      return `<${tag}>${content}</${tag}>`
    }

    case 'listitem': {
      const content = lexicalNode.children?.map(convertLexicalNodeToHTML).join('') || ''
      return `<li>${content}</li>`
    }

    case 'quote': {
      const content = lexicalNode.children?.map(convertLexicalNodeToHTML).join('') || ''
      return `<blockquote>${content}</blockquote>`
    }

    case 'link': {
      const url = lexicalNode.url || '#'
      const content = lexicalNode.children?.map(convertLexicalNodeToHTML).join('') || ''
      return `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${content}</a>`
    }

    default:
      return lexicalNode.children?.map(convertLexicalNodeToHTML).join('') || ''
  }
}

/**
 * Escapes HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
