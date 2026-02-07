import { postgresAdapter } from '@payloadcms/db-postgres'
import { hr } from '@payloadcms/translations/languages/hr'
import { en } from '@payloadcms/translations/languages/en'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Tags } from './collections/Tags'
import { Comments } from './collections/Comments'
import { Subscribers } from './collections/Subscribers'
import { RSSFeeds } from './collections/RSSFeeds'
import { ImportedPosts } from './collections/ImportedPosts'
import { Newsletters } from './collections/Newsletters'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { Settings } from './globals/Settings'
import { SEO } from './globals/SEO'
import { EmailConfig } from './globals/EmailConfig'
import { ContentStyles } from './globals/ContentStyles'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  i18n: {
    supportedLanguages: { en, hr },
    fallbackLanguage: 'en',
  },
  localization: {
    locales: [
      {
        label: 'English',
        code: 'en',
      },
      {
        label: 'Hrvatski',
        code: 'hr',
      },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    Tags,
    Comments,
    Subscribers,
    RSSFeeds,
    ImportedPosts,
    Newsletters,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer, Settings, SEO, EmailConfig, ContentStyles],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    autoRun: [
      {
        cron: '*/5 * * * *',
        queue: 'notifications',
        limit: 10,
      },
    ],
    deleteJobOnComplete: true,
    tasks: [
      {
        slug: 'sendPostNotificationBatch',
        label: 'Send Post Notification Batch',
        inputSchema: [
          {
            name: 'postId',
            type: 'number',
          },
        ],
        outputSchema: [
          {
            name: 'sent',
            type: 'number',
          },
          {
            name: 'posts',
            type: 'number',
          },
        ],
        handler: async (args) => {
          const { sendPostNotificationBatch } = await import('./jobs/tasks/sendPostNotificationBatch')
          return sendPostNotificationBatch(args as any)
        },
        retries: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000,
          },
        },
      },
      {
        slug: 'sendWeeklyDigest',
        label: 'Send Weekly Digest',
        inputSchema: [],
        outputSchema: [
          {
            name: 'sent',
            type: 'number',
          },
          {
            name: 'posts',
            type: 'number',
          },
        ],
        handler: async (args) => {
          const { sendWeeklyDigest } = await import('./jobs/tasks/sendWeeklyDigest')
          return sendWeeklyDigest(args as any)
        },
        retries: {
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 300000,
          },
        },
        schedule: [
          {
            cron: '0 8 * * 1',
            queue: 'notifications',
          },
        ],
      },
      {
        slug: 'sendNewsletter',
        label: 'Send Newsletter',
        inputSchema: [
          {
            name: 'newsletterId',
            type: 'number',
            required: true,
          },
        ],
        outputSchema: [
          {
            name: 'sent',
            type: 'number',
          },
        ],
        handler: async (args) => {
          const { sendNewsletter } = await import('./jobs/tasks/sendNewsletter')
          return sendNewsletter(args as any)
        },
        retries: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000,
          },
        },
      },
    ],
  },
})
