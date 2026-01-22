import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'menus',
      type: 'array',
      label: 'Navigation Menus',
      labels: {
        singular: 'Menu',
        plural: 'Menus',
      },
      maxRows: 3,
      admin: {
        initCollapsed: false,
        description: 'Create multiple menu groups (e.g., Main Menu, Top Bar Menu)',
      },
      fields: [
        {
          name: 'menuName',
          type: 'text',
          label: 'Menu Name',
          required: true,
          admin: {
            description: 'Internal identifier (e.g., main, topbar, secondary)',
          },
        },
        {
          name: 'navItems',
          type: 'array',
          label: 'Navigation Items',
          labels: {
            singular: 'Nav Item',
            plural: 'Nav Items',
          },
          fields: [
            link({
              appearances: false,
            }),
            {
              name: 'hasSubmenu',
              type: 'checkbox',
              label: 'Has Dropdown Submenu',
              defaultValue: false,
            },
            {
              name: 'subItems',
              type: 'array',
              label: 'Submenu Items',
              labels: {
                singular: 'Submenu Item',
                plural: 'Submenu Items',
              },
              admin: {
                condition: (_, siblingData) => siblingData?.hasSubmenu === true,
              },
              fields: [
                link({
                  appearances: false,
                }),
              ],
              maxRows: 10,
            },
          ],
          maxRows: 10,
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: '@/Header/RowLabel#RowLabel',
            },
          },
        },
      ],
    },
    // Keep legacy navItems for backward compatibility
    {
      name: 'navItems',
      type: 'array',
      label: 'Main Navigation (Legacy)',
      labels: {
        singular: 'Nav Item',
        plural: 'Nav Items',
      },
      admin: {
        description: 'Legacy field - use "Navigation Menus" above instead',
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
      fields: [
        link({
          appearances: false,
        }),
        {
          name: 'hasSubmenu',
          type: 'checkbox',
          label: 'Has Dropdown Submenu',
          defaultValue: false,
        },
        {
          name: 'subItems',
          type: 'array',
          label: 'Submenu Items',
          labels: {
            singular: 'Submenu Item',
            plural: 'Submenu Items',
          },
          admin: {
            condition: (_, siblingData) => siblingData?.hasSubmenu === true,
          },
          fields: [
            link({
              appearances: false,
            }),
          ],
          maxRows: 10,
        },
      ],
      maxRows: 8,
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
