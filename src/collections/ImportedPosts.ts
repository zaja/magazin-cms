import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'

export const ImportedPosts: CollectionConfig = {
  slug: 'imported-posts',
  admin: {
    useAsTitle: 'originalTitle',
    group: 'Automation',
    defaultColumns: ['originalTitle', 'rssFeed', 'status', 'processedAt', 'createdAt'],
  },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'processImport',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/ImportedPosts/ProcessImportButton#ProcessImportButton',
        },
        condition: (data) => data.status === 'pending' || data.status === 'failed',
      },
    },
    {
      name: 'originalURL',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Original article URL',
      },
    },
    {
      name: 'originalTitle',
      type: 'text',
      required: true,
      admin: {
        description: 'Original article title',
      },
    },
    {
      name: 'rssFeed',
      type: 'relationship',
      relationTo: 'rss-feeds',
      required: true,
      admin: {
        description: 'Source RSS feed',
      },
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      admin: {
        description: 'Created Payload post (after processing)',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
      admin: {
        description: 'Processing status',
      },
    },
    {
      name: 'errorMessage',
      type: 'textarea',
      admin: {
        description: 'Error details (if failed)',
        condition: (data) => data.status === 'failed',
      },
    },
    {
      name: 'translationTokens',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Claude API tokens used for translation',
      },
    },
    {
      name: 'processedAt',
      type: 'date',
      admin: {
        readOnly: true,
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'retryCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Number of retry attempts',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Original article metadata (raw content, author, etc.)',
      },
    },
    {
      name: 'lockedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Lock timestamp (for concurrent processing prevention)',
      },
    },
    {
      name: 'lockedBy',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Process identifier holding the lock',
      },
    },
  ],
  endpoints: [
    {
      path: '/retry/:id',
      method: 'post',
      handler: async (req) => {
        try {
          const id = req.routeParams?.id as string | undefined

          if (!id) {
            return Response.json(
              { success: false, error: 'Import ID is required' },
              { status: 400 },
            )
          }

          const importedPost = await req.payload.findByID({
            collection: 'imported-posts',
            id,
          })

          if (!importedPost) {
            return Response.json({ success: false, error: 'Import not found' }, { status: 404 })
          }

          if (importedPost.status !== 'failed') {
            return Response.json(
              { success: false, error: 'Only failed imports can be retried' },
              { status: 400 },
            )
          }

          await req.payload.update({
            collection: 'imported-posts',
            id,
            data: {
              status: 'pending',
              retryCount: (importedPost.retryCount || 0) + 1,
              errorMessage: null,
              lockedAt: null,
              lockedBy: null,
            },
          })

          return Response.json({ success: true, message: 'Import queued for retry' })
        } catch (error) {
          return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
  ],
}
