import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'Fine Print',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'placeholder',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool({structure}), visionTool({defaultApiVersion: '2026-09-24'})],
  schema: {types: schemaTypes},
})
