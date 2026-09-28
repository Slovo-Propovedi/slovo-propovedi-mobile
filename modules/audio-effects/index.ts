// Metro resolves './platform' per platform: platform.native.ts on Android/iOS,
// platform.web.ts on web. The plain platform.ts is a TypeScript fallback only.
export * from './platform'
export { DEFAULT_AUDIO_EFFECTS_INFO } from './types'

export type { AudioEffectsInfo, AudioEffectsSettings } from './types'
