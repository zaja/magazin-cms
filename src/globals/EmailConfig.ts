import type { GlobalConfig } from 'payload'
import { authenticated } from '../access/authenticated'

export const EmailConfig: GlobalConfig = {
  slug: 'email-config',
  access: {
    read: authenticated,
    update: authenticated,
  },
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'provider',
      type: 'select',
      defaultValue: 'smtp',
      options: [
        { label: 'SMTP', value: 'smtp' },
        { label: 'Resend', value: 'resend' },
      ],
      required: true,
    },
    {
      type: 'group',
      name: 'smtp',
      label: 'SMTP Settings',
      admin: {
        condition: (data) => data?.provider === 'smtp',
      },
      fields: [
        {
          name: 'host',
          type: 'text',
        },
        {
          name: 'port',
          type: 'number',
          defaultValue: 587,
        },
        {
          name: 'secure',
          type: 'checkbox',
          defaultValue: false,
          label: 'Use SSL/TLS',
        },
        {
          name: 'user',
          type: 'text',
        },
        {
          name: 'password',
          type: 'text',
          admin: {
            description: 'SMTP password (stored securely)',
          },
        },
        {
          name: 'fromEmail',
          type: 'email',
        },
        {
          name: 'fromName',
          type: 'text',
        },
      ],
    },
    {
      type: 'group',
      name: 'resend',
      label: 'Resend Settings',
      admin: {
        condition: (data) => data?.provider === 'resend',
      },
      fields: [
        {
          name: 'apiKey',
          type: 'text',
          admin: {
            description: 'Resend API Key',
          },
        },
        {
          name: 'fromEmail',
          type: 'email',
        },
        {
          name: 'fromName',
          type: 'text',
        },
      ],
    },
    {
      type: 'group',
      name: 'templates',
      label: 'Email Templates',
      fields: [
        {
          name: 'newCommentAdmin',
          type: 'richText',
          label: 'New Comment Notification (Admin)',
          admin: {
            description:
              'Variables: {{postTitle}}, {{authorName}}, {{commentContent}}, {{adminUrl}}',
          },
        },
        {
          name: 'commentApproved',
          type: 'richText',
          label: 'Comment Approved Notification',
          admin: {
            description: 'Variables: {{authorName}}, {{postTitle}}, {{postUrl}}',
          },
        },
        {
          name: 'commentReply',
          type: 'richText',
          label: 'Comment Reply Notification',
          admin: {
            description: 'Variables: {{authorName}}, {{replyAuthor}}, {{postTitle}}, {{postUrl}}',
          },
        },
        {
          name: 'newPostSubscriber',
          type: 'richText',
          label: 'New Post Notification (Subscribers)',
          admin: {
            description:
              'Variables: {{postTitle}}, {{postExcerpt}}, {{postUrl}}, {{unsubscribeUrl}}',
          },
        },
        {
          name: 'subscribeConfirmation',
          type: 'richText',
          label: 'Subscription Confirmation',
          admin: {
            description: 'Variables: {{confirmUrl}}, {{unsubscribeUrl}}',
          },
        },
        {
          name: 'passwordReset',
          type: 'richText',
          label: 'Password Reset',
          admin: {
            description: 'Variables: {{resetUrl}}, {{userName}}',
          },
        },
      ],
    },
    {
      name: 'testEmail',
      type: 'email',
      admin: {
        description: 'Email address for sending test emails',
      },
    },
    {
      name: 'testEmailButton',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/TestEmailButton',
        },
      },
    },
  ],
}
