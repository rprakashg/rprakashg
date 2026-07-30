import { CaseIcon } from '@sanity/icons/Case'
import { defineArrayMember, defineField, defineType } from 'sanity'

export const profile = defineType({
  name: 'profile',
  title: 'Profile',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Headline',
      type: 'string',
      description: 'e.g. "Full stack engineer"',
    }),
    defineField({
      name: 'photo',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alternative text', type: 'string' }),
      ],
    }),
    defineField({
      name: 'bio',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'skills',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'experience',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'experienceItem',
          fields: [
            defineField({
              name: 'role',
              title: 'Role',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'company',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: 'startDate', type: 'date' }),
            defineField({ name: 'endDate', type: 'date' }),
            defineField({
              name: 'current',
              title: 'Currently working here',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({ name: 'description', type: 'text', rows: 3 }),
          ],
          preview: {
            select: { title: 'role', subtitle: 'company' },
          },
        }),
      ],
    }),
    defineField({
      name: 'contact',
      type: 'object',
      fields: [
        defineField({ name: 'email', type: 'string' }),
        defineField({ name: 'phone', type: 'string' }),
        defineField({ name: 'location', type: 'string' }),
        defineField({ name: 'github', title: 'GitHub URL', type: 'url' }),
        defineField({ name: 'linkedin', title: 'LinkedIn URL', type: 'url' }),
        defineField({ name: 'facebook', title: 'Facebook URL', type: 'url' }),
        defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
        defineField({ name: 'tiktok', title: 'TikTok URL', type: 'url' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'title', media: 'photo' },
  },
})
