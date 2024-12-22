import { build } from 'vite'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

await build({ configFile: 'packages/main/vite.config.ts' })
await build({ configFile: 'packages/preload/vite.config.ts' })
await build({ configFile: 'packages/renderer/vite.config.ts' })
