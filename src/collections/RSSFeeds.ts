import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import Parser from 'rss-parser'

export const RSSFeeds: CollectionConfig = {
  slug: 'rss-feeds',
  admin: {
    useAsTitle: 'name',
    group: 'Automation',
    defaultColumns: ['name', 'url', 'active', 'lastChecked', 'itemsProcessed'],
  },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'triggerPoll',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/RSSFeeds/TriggerPollButton#TriggerPollButton',
        },
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Descriptive name for this RSS feed',
      },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'RSS feed URL',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Enable/disable polling for this feed',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Default category for imported posts',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Default tags for imported posts',
      },
    },
    {
      name: 'checkInterval',
      type: 'number',
      defaultValue: 60,
      min: 5,
      admin: {
        description: 'How often to check this feed (in minutes)',
      },
    },
    {
      name: 'lastChecked',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last time this feed was polled',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'itemsProcessed',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Total items imported from this feed',
      },
    },
    {
      name: 'translateContent',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Translate content to Croatian using Claude AI',
      },
    },
    {
      name: 'generateSEO',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Generate SEO metadata using Claude AI',
      },
    },
    {
      name: 'autoPublish',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        description: 'Status to set for imported posts',
      },
    },
    {
      name: 'maxItemsPerCheck',
      type: 'number',
      defaultValue: 5,
      min: 1,
      max: 20,
      admin: {
        description: 'Maximum items to import per poll cycle',
      },
    },
  ],
  endpoints: [
    {
      path: '/test-feed',
      method: 'post',
      handler: async (req) => {
        try {
          const body = await req.json?.()
          const feedUrl = body?.feedUrl

          if (!feedUrl) {
            return Response.json({ success: false, error: 'feedUrl is required' }, { status: 400 })
          }

          const parser = new Parser()
          const feed = await parser.parseURL(feedUrl)

          return Response.json({
            success: true,
            feedTitle: feed.title,
            feedDescription: feed.description,
            itemsFound: feed.items.length,
            latestItems: feed.items.slice(0, 5).map((item) => ({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
            })),
          })
        } catch (error) {
          return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 400 },
          )
        }
      },
    },
    {
      path: '/trigger-poll/:id',
      method: 'post',
      handler: async (req) => {
        try {
          const id = req.routeParams?.id as string | undefined

          if (!id) {
            return Response.json({ success: false, error: 'Feed ID is required' }, { status: 400 })
          }

          const { RSSPoller } = await import('../services/RSSPoller')
          const poller = new RSSPoller(req.payload)
          const result = await poller.pollFeed(id)

          return Response.json({ success: true, result })
        } catch (error) {
          return Response.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
          )
        }
      },
    },
    {
      path: '/health',
      method: 'get',
      handler: async (req) => {
        try {
          const { MonitoringService } = await import('../services/MonitoringService')
          const monitor = new MonitoringService(req.payload)
          const health = await monitor.getSystemHealth()

          return Response.json(health, { status: health.healthy ? 200 : 503 })
        } catch (error) {
          return Response.json(
            {
              healthy: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 503 },
          )
        }
      },
    },
    {
      path: '/process-single',
      method: 'post',
      handler: async (req) => {
        try {
          const body = await req.json?.()
          const importId = body?.importId as string | undefined

          if (!importId) {
            return Response.json({ success: false, error: 'importId is required' }, { status: 400 })
          }

          const { ContentProcessor } = await import('../services/ContentProcessor')
          const processor = new ContentProcessor(req.payload)

          await processor.processImportedPost(importId)

          return Response.json({
            success: true,
            message: 'Import procesiran, draft post kreiran!',
          })
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
