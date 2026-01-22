import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'parent', 'order', 'createdAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField({
      position: undefined,
    }),
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Parent category for hierarchical structure',
      },
      filterOptions: ({ id }) => {
        if (!id) return true
        return {
          id: { not_equals: id },
        }
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Order for sorting (lower numbers first)',
      },
    },
  ],
  timestamps: true,
}
