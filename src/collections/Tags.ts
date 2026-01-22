import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'color', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      localized: true,
    },
    slugField({ fieldToUse: 'name' }),
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color code (e.g. #FF5733)',
      },
      validate: (val: string | null | undefined) => {
        if (!val) return true
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
        if (!hexRegex.test(val)) {
          return 'Please enter a valid hex color code'
        }
        return true
      },
    },
  ],
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        const posts = await req.payload.find({
          collection: 'posts',
          where: {
            tags: { contains: id },
          },
          limit: 1,
        })
        if (posts.totalDocs > 0) {
          throw new Error('Cannot delete tag that is used in posts')
        }
      },
    ],
  },
  timestamps: true,
}
