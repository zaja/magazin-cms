import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Settings',
  },
  hooks: {
    afterChange: [revalidateFooter],
  },
  fields: [
    {
      name: 'description',
      type: 'textarea',
      label: 'Footer Description',
      admin: {
        description: 'Tagline text below the logo (e.g. "Vaš izvor inspiracije za modu...")',
      },
    },
    {
      name: 'columns',
      type: 'array',
      label: 'Footer Columns',
      labels: {
        singular: 'Column',
        plural: 'Columns',
      },
      maxRows: 4,
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Column Title',
          required: true,
        },
        {
          name: 'navItems',
          type: 'array',
          label: 'Links',
          labels: {
            singular: 'Link',
            plural: 'Links',
          },
          fields: [
            link({
              appearances: false,
            }),
          ],
          maxRows: 8,
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: '@/Footer/RowLabel#RowLabel',
            },
          },
        },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      label: 'Copyright Text',
      admin: {
        description: 'e.g. © 2026 Your Company. All rights reserved.',
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Links',
      labels: {
        singular: 'Social Link',
        plural: 'Social Links',
      },
      maxRows: 6,
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Twitter/X', value: 'twitter' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
          required: true,
        },
      ],
    },
  ],
}
