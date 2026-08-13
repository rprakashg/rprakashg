'use client'

import { codeInput } from '@sanity/code-input'
import { table } from '@sanity/table'
import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import { apiVersion, dataset, projectId, studioBasePath } from './src/sanity/env'
import { schema } from './src/sanity/schemaTypes'
import { structure } from './src/sanity/structure'

export default defineConfig({
  basePath: studioBasePath,
  name: 'default',
  title: "Ram's Blog Studio",
  projectId,
  dataset,
  schema,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: apiVersion }),
    codeInput(),
    table(),
  ],
  document: {
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter((template) => template.templateId !== 'profile')
        : prev,
    actions: (prev, { schemaType }) =>
      schemaType === 'profile'
        ? prev.filter(({ action }) => action !== 'duplicate')
        : prev,
  },
})
