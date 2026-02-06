import type { GlobalConfig } from 'payload'
import { authenticated } from '../access/authenticated'

export const ContentStyles: GlobalConfig = {
  slug: 'content-styles',
  label: 'Stilovi sadržaja',
  admin: {
    group: 'Settings',
  },
  access: {
    read: authenticated,
    update: authenticated,
  },
  fields: [
    {
      name: 'styles',
      type: 'array',
      label: 'Stilovi prijevoda',
      minRows: 1,
      maxRows: 10,
      admin: {
        description: 'Definirajte stilove za kreiranje prevedenog sadržaja iz RSS feedova',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Naziv stila',
          admin: {
            description: 'Npr. "Kratki sažetak", "Srednji članak", "Opširni članak"',
          },
        },
        {
          name: 'key',
          type: 'text',
          required: true,
          unique: true,
          label: 'Ključ',
          admin: {
            description: 'Jedinstveni identifikator (npr. "short", "medium", "full")',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Opis',
          admin: {
            description: 'Kratki opis stila za prikaz u admin sučelju',
          },
        },
        {
          name: 'prompt',
          type: 'textarea',
          required: true,
          label: 'Prompt za Claude AI',
          admin: {
            description: 'Upute za AI pri kreiranju sadržaja. Koristite {title} i {content} kao placeholdere.',
            rows: 15,
          },
        },
        {
          name: 'maxTokens',
          type: 'number',
          defaultValue: 4096,
          min: 1000,
          max: 16000,
          label: 'Max tokena',
          admin: {
            description: 'Maksimalan broj tokena za AI odgovor',
          },
        },
        {
          name: 'isDefault',
          type: 'checkbox',
          defaultValue: false,
          label: 'Zadani stil',
          admin: {
            description: 'Koristi ovaj stil kao zadani za nove importe',
          },
        },
      ],
    },
  ],
}
