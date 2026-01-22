import type { GlobalConfig } from 'payload'
import { authenticated } from '../access/authenticated'

export const SEO: GlobalConfig = {
  slug: 'seo',
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'defaultMetaTitle',
      type: 'text',
      maxLength: 60,
      admin: {
        description: 'Default title for pages without custom meta title (max 60 chars)',
      },
    },
    {
      name: 'defaultMetaDescription',
      type: 'textarea',
      maxLength: 160,
      admin: {
        description: 'Default description for pages without custom meta description (max 160 chars)',
      },
    },
    {
      name: 'defaultOgImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Default Open Graph image for social sharing',
      },
    },
    {
      name: 'twitterHandle',
      type: 'text',
      admin: {
        description: 'Twitter/X handle (e.g. @username)',
      },
    },
    {
      name: 'googleAnalyticsId',
      type: 'text',
      admin: {
        description: 'Google Analytics measurement ID (e.g. G-XXXXXXXXXX)',
      },
    },
    {
      name: 'googleSiteVerification',
      type: 'text',
      admin: {
        description: 'Google Search Console verification code',
      },
    },
    {
      type: 'group',
      name: 'structuredData',
      label: 'Structured Data (Organization)',
      fields: [
        {
          name: 'organizationName',
          type: 'text',
        },
        {
          name: 'organizationLogo',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'socialLinks',
          type: 'array',
          fields: [
            {
              name: 'platform',
              type: 'select',
              options: [
                { label: 'Facebook', value: 'facebook' },
                { label: 'Twitter/X', value: 'twitter' },
                { label: 'Instagram', value: 'instagram' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'YouTube', value: 'youtube' },
              ],
            },
            {
              name: 'url',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'robots',
      type: 'textarea',
      defaultValue: `User-agent: *
Allow: /
Disallow: /admin/
Sitemap: /sitemap.xml`,
      admin: {
        description: 'robots.txt content',
      },
    },
    {
      type: 'group',
      name: 'sitemap',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'priority',
          type: 'number',
          defaultValue: 0.8,
          min: 0,
          max: 1,
        },
        {
          name: 'changefreq',
          type: 'select',
          defaultValue: 'weekly',
          options: [
            { label: 'Always', value: 'always' },
            { label: 'Hourly', value: 'hourly' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Yearly', value: 'yearly' },
            { label: 'Never', value: 'never' },
          ],
        },
      ],
    },
  ],
}
