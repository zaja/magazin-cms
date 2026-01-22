import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import crypto from 'crypto'
import { sendSubscriberConfirmation } from '../hooks/emailNotifications'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  access: {
    create: () => true, // Anyone can subscribe
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'status', 'subscribedAt'],
    group: 'Content',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending Confirmation', value: 'pending' },
        { label: 'Active', value: 'active' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
        { label: 'Bounced', value: 'bounced' },
      ],
      required: true,
    },
    {
      type: 'group',
      name: 'preferences',
      fields: [
        {
          name: 'newPosts',
          type: 'checkbox',
          defaultValue: true,
          label: 'New Posts Notifications',
        },
        {
          name: 'commentReplies',
          type: 'checkbox',
          defaultValue: true,
          label: 'Comment Reply Notifications',
        },
        {
          name: 'newsletter',
          type: 'checkbox',
          defaultValue: true,
          label: 'Weekly Newsletter',
        },
      ],
    },
    {
      name: 'subscribedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'confirmedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'confirmationToken',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'unsubscribeToken',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'magicLinkToken',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'magicLinkExpiry',
      type: 'date',
      admin: {
        hidden: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          data.subscribedAt = new Date().toISOString()
          data.confirmationToken = crypto.randomBytes(32).toString('hex')
          data.unsubscribeToken = crypto.randomBytes(32).toString('hex')
        }
        return data
      },
    ],
    afterChange: [sendSubscriberConfirmation],
  },
  timestamps: true,
}
