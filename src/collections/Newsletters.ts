import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import {
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  HeadingFeature,
  ParagraphFeature,
  LinkFeature,
  OrderedListFeature,
  UnorderedListFeature,
  BlockquoteFeature,
  HorizontalRuleFeature,
  AlignFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Newsletters: CollectionConfig = {
  slug: 'newsletters',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'status', 'audience', 'sentAt', 'sentCount'],
    group: 'Content',
  },
  fields: [
    {
      name: 'subject',
      type: 'text',
      required: true,
      label: 'Naslov emaila',
      admin: {
        description: 'Možete koristiti: {{siteName}}, {{date}}, {{subscriberCount}}',
      },
    },
    {
      name: 'availableTags',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/NewsletterTagsInfo',
        },
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Sadržaj',
      admin: {
        description: 'U tekstu možete koristiti tagove: {{subscriberName}}, {{unsubscribeUrl}}, {{preferencesUrl}}, {{siteName}}, {{siteUrl}}, {{date}}',
      },
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          StrikethroughFeature(),
          LinkFeature({}),
          OrderedListFeature(),
          UnorderedListFeature(),
          BlockquoteFeature(),
          HorizontalRuleFeature(),
          AlignFeature(),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'contentHtml',
      type: 'textarea',
      admin: {
        hidden: true,
        description: 'Auto-generated HTML from rich text content',
      },
    },
    {
      name: 'audience',
      type: 'select',
      required: true,
      defaultValue: 'newsletter_only',
      options: [
        { label: 'Svi aktivni pretplatnici', value: 'all_active' },
        { label: 'Samo newsletter pretplatnici', value: 'newsletter_only' },
        { label: 'Digest pretplatnici', value: 'digest_subscribers' },
      ],
      label: 'Publika',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Queued', value: 'queued' },
        { label: 'Sent', value: 'sent' },
      ],
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'sentCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Broj poslanih emailova',
      },
    },
    {
      name: 'scheduledFor',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Opcionalno: zakaži slanje za određeni datum/vrijeme',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'sendButton',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/SendNewsletterButton',
        },
      },
    },
  ],
  timestamps: true,
}
