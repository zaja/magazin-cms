import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { authenticated } from '../access/authenticated'

export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
    read: () => true,
    update: authenticated,
  },
  admin: {
    group: 'Settings',
  },
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_settings')
          console.log('[Settings] Cache revalidated')
        } catch (_e) {
          // Ignore errors when not in request context
        }
      },
    ],
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      required: true,
      localized: true,
      defaultValue: 'Magazin CMS',
    },
    {
      name: 'siteDescription',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'logoWidth',
      type: 'number',
      label: 'Logo Width (px)',
      defaultValue: 120,
      min: 50,
      max: 300,
      admin: {
        description: 'Width of the site logo in pixels (50-300)',
      },
    },
    {
      name: 'favicon',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'domain',
      type: 'text',
      admin: {
        description: 'Full domain URL (e.g. https://example.com)',
      },
    },
    {
      name: 'language',
      type: 'select',
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Hrvatski', value: 'hr' },
      ],
    },
    {
      name: 'timezone',
      type: 'select',
      defaultValue: 'Europe/Zagreb',
      options: [
        { label: 'Europe/Zagreb', value: 'Europe/Zagreb' },
        { label: 'Europe/London', value: 'Europe/London' },
        { label: 'America/New_York', value: 'America/New_York' },
        { label: 'UTC', value: 'UTC' },
      ],
    },
    {
      name: 'postsPerPage',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 50,
    },
    {
      name: 'dateFormat',
      type: 'text',
      defaultValue: 'dd.MM.yyyy',
      admin: {
        description: 'Date format pattern (e.g. dd.MM.yyyy, MM/dd/yyyy)',
      },
    },
    {
      name: 'allowRegistration',
      type: 'checkbox',
      defaultValue: false,
      label: 'Allow Public Registration',
    },
    {
      name: 'moderateComments',
      type: 'checkbox',
      defaultValue: true,
      label: 'Moderate Comments Before Publishing',
    },
    {
      name: 'maintenanceMode',
      type: 'checkbox',
      defaultValue: false,
      label: 'Enable Maintenance Mode',
    },
    {
      name: 'maintenanceMessage',
      type: 'richText',
      admin: {
        condition: (data) => data?.maintenanceMode === true,
      },
    },
  ],
}
