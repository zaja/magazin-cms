import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import crypto from 'crypto'
import {
  notifyAdminOnNewComment,
  notifyOnCommentApproved,
  notifyOnCommentReply,
} from '../hooks/emailNotifications'

const generateGravatarUrl = (email: string): string => {
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex')
  return `https://www.gravatar.com/avatar/${hash}?d=mp`
}

export const Comments: CollectionConfig = {
  slug: 'comments',
  access: {
    create: () => true, // Anyone can submit comments
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['content', 'post', 'status', 'createdAt'],
    group: 'Content',
  },
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      index: true,
    },
    {
      name: 'parentComment',
      type: 'relationship',
      relationTo: 'comments',
      admin: {
        description: 'For nested replies',
      },
    },
    {
      type: 'group',
      name: 'author',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'email',
          type: 'email',
          required: true,
        },
        {
          name: 'website',
          type: 'text',
          validate: (val: string | null | undefined) => {
            if (!val) return true
            try {
              new URL(val)
              return true
            } catch {
              return 'Please enter a valid URL'
            }
          },
        },
        {
          name: 'avatar',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'Auto-generated from Gravatar',
          },
        },
      ],
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      maxLength: 2000,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Spam', value: 'spam' },
        { label: 'Deleted', value: 'deleted' },
      ],
      required: true,
      access: {
        update: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'subscribedToReplies',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          // Auto-generate Gravatar URL
          if (data?.author?.email) {
            data.author.avatar = generateGravatarUrl(data.author.email)
          }
          // Capture IP and User Agent
          const ip =
            req.headers?.get?.('x-forwarded-for') || req.headers?.get?.('x-real-ip') || 'unknown'
          data.ipAddress = typeof ip === 'string' ? ip.split(',')[0] : 'unknown'
          data.userAgent = req.headers?.get?.('user-agent') || 'unknown'
        }
        return data
      },
    ],
    afterChange: [notifyAdminOnNewComment, notifyOnCommentApproved, notifyOnCommentReply],
  },
  timestamps: true,
}
