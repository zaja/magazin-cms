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
          name: 'newCommentAdminSubject',
          type: 'text',
          label: 'New Comment (Admin) - Subject',
          defaultValue: 'Novi komentar na post: {{postTitle}}',
          admin: {
            description: 'Variables: {{postTitle}}, {{authorName}}',
          },
        },
        {
          name: 'newCommentAdmin',
          type: 'richText',
          label: 'New Comment (Admin) - Body',
          admin: {
            description:
              'Variables: {{postTitle}}, {{authorName}}, {{commentContent}}, {{adminUrl}}',
          },
        },
        {
          name: 'commentApprovedSubject',
          type: 'text',
          label: 'Comment Approved - Subject',
          defaultValue: 'Vaš komentar je odobren!',
          admin: {
            description: 'Variables: {{authorName}}, {{postTitle}}',
          },
        },
        {
          name: 'commentApproved',
          type: 'richText',
          label: 'Comment Approved - Body',
          admin: {
            description: 'Variables: {{authorName}}, {{postTitle}}, {{postUrl}}',
          },
        },
        {
          name: 'commentReplySubject',
          type: 'text',
          label: 'Comment Reply - Subject',
          defaultValue: 'Novi odgovor na vaš komentar: {{postTitle}}',
          admin: {
            description: 'Variables: {{authorName}}, {{replyAuthor}}, {{postTitle}}',
          },
        },
        {
          name: 'commentReply',
          type: 'richText',
          label: 'Comment Reply - Body',
          admin: {
            description: 'Variables: {{authorName}}, {{replyAuthor}}, {{postTitle}}, {{postUrl}}',
          },
        },
        {
          name: 'newPostSubscriberSubject',
          type: 'text',
          label: 'New Post (Subscribers) - Subject',
          defaultValue: 'Novi članak: {{postTitle}}',
          admin: {
            description: 'Variables: {{postTitle}}',
          },
        },
        {
          name: 'newPostSubscriber',
          type: 'richText',
          label: 'New Post (Subscribers) - Body',
          admin: {
            description:
              'Variables: {{postTitle}}, {{postExcerpt}}, {{postUrl}}, {{unsubscribeUrl}}',
          },
        },
        {
          name: 'subscribeConfirmationSubject',
          type: 'text',
          label: 'Subscription Confirmation - Subject',
          defaultValue: 'Potvrdite pretplatu na newsletter',
          admin: {
            description: 'Variables: {{confirmUrl}}',
          },
        },
        {
          name: 'subscribeConfirmation',
          type: 'richText',
          label: 'Subscription Confirmation - Body',
          admin: {
            description: 'Variables: {{confirmUrl}}, {{unsubscribeUrl}}',
          },
        },
        {
          name: 'passwordResetSubject',
          type: 'text',
          label: 'Password Reset - Subject',
          defaultValue: 'Resetiranje lozinke',
          admin: {
            description: 'Variables: {{resetUrl}}, {{userName}}',
          },
        },
        {
          name: 'passwordReset',
          type: 'richText',
          label: 'Password Reset - Body',
          admin: {
            description: 'Variables: {{resetUrl}}, {{userName}}',
          },
        },
        {
          name: 'magicLinkSubject',
          type: 'text',
          label: 'Magic Link Login - Subject',
          defaultValue: 'Vaš link za prijavu',
          admin: {
            description: 'Variables: {{loginUrl}}, {{email}}, {{expiresIn}}',
          },
        },
        {
          name: 'magicLink',
          type: 'richText',
          label: 'Magic Link Login - Body',
          admin: {
            description: 'Variables: {{loginUrl}}, {{email}}, {{expiresIn}}',
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
