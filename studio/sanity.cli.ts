import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || '9wt4tu94',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // `npx sanity deploy` publishes the Studio to https://<studioHost>.sanity.studio (free)
  studioHost: process.env.SANITY_STUDIO_HOST || 'fine-print',
  deployment: {appId: 'zdhdtqdrylkhfds501sgwqzg', autoUpdates: true},
})
