import type { Access, CollectionConfig, FieldAccess } from 'payload'

import { authenticated } from '../../access/authenticated'

const isAdmin: Access = ({ req: { user } }) => {
  return Boolean(user?.roles?.includes('admin'))
}

const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true
  return { id: { equals: user?.id } }
}

const isAdminFieldAccess: FieldAccess = ({ req: { user } }) => {
  return Boolean(user?.roles?.includes('admin'))
}

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => {
      if (!user) return false
      return ['admin', 'editor', 'author'].includes(user?.roles?.[0])
    },
    create: isAdmin,
    delete: isAdmin,
    read: authenticated,
    update: isAdminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles', 'createdAt'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 604800, // 7 days
    verify: false,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        hidden: true,
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            return `${siblingData.firstName || ''} ${siblingData.lastName || ''}`.trim()
          },
        ],
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['author'],
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Author', value: 'author' },
        { label: 'Subscriber', value: 'subscriber' },
      ],
      required: true,
      saveToJWT: true,
      access: {
        update: isAdminFieldAccess,
      },
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      type: 'group',
      name: 'social',
      fields: [
        {
          name: 'twitter',
          type: 'text',
        },
        {
          name: 'linkedin',
          type: 'text',
        },
        {
          name: 'website',
          type: 'text',
        },
      ],
    },
  ],
  timestamps: true,
}
