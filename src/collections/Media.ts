import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['filename', 'alt', 'updatedAt', 'readableFilesize'],
  },
  fields: [
    {
      name: 'readableFilesize',
      type: 'text',
      virtual: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            const bytes = siblingData?.filesize as number | undefined
            if (!bytes || bytes === 0) return '0 B'
            const k = 1024
            const sizes = ['B', 'KB', 'MB', 'GB']
            const i = Math.floor(Math.log(bytes) / Math.log(k))
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
          },
        ],
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alternative text for accessibility and SEO',
      },
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description: 'Photo/media credit or attribution',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Tags for organizing media',
      },
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    crop: true,
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/avif',
    ],
    // Convert all image sizes to webp format for optimal performance
    formatOptions: {
      format: 'webp',
      options: {
        quality: 80,
      },
    },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 200,
        crop: 'focalPoint',
        formatOptions: { format: 'webp', options: { quality: 75 } },
      },
      {
        name: 'square',
        width: 500,
        height: 500,
        crop: 'focalPoint',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'small',
        width: 600,
        crop: 'focalPoint',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'medium',
        width: 900,
        crop: 'focalPoint',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'large',
        width: 1400,
        crop: 'focalPoint',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'xlarge',
        width: 1920,
        crop: 'focalPoint',
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'focalPoint',
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
    ],
  },
}
