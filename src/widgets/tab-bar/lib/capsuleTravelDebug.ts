import { makeMutable } from 'react-native-reanimated'

declare global {
  var __CAPSULE_DEBUG__: boolean | undefined
}

// TEMPORARY capsule-travel diagnostics (remove with the fix). The flag is read
// once at module init; the shared mirror lets the dev console flip it after load
// and reach the UI-thread worklets (synced on every JS-side travel entry point).
const debugAtInit = globalThis.__CAPSULE_DEBUG__ === true
export const capsuleDebugFlag = makeMutable(debugAtInit)

export const isCapsuleDebug = (): boolean => debugAtInit || globalThis.__CAPSULE_DEBUG__ === true

export const syncCapsuleDebugFlag = (): void => {
  capsuleDebugFlag.value = isCapsuleDebug()
}

// Compact, greppable: `[CAPSULE] <event> ...`. Silent unless the flag is on.
export const capsuleLog = (message: string): void => {
  if (!isCapsuleDebug()) return

  console.log(`[CAPSULE] ${message}`)
}

// UI-thread variant: reads the synced mirror, never the JS global.
export const capsuleWorkletLog = (message: string): void => {
  'worklet'
  if (!capsuleDebugFlag.value) return

  console.log(`[CAPSULE] ${message}`)
}
