import { type ComponentRef, useRef } from 'react'
import { type View } from 'react-native'

/**
 * Native: lists virtualize offscreen rows themselves, so a mounted cover is
 * treated as near the viewport. Web resolves `useNearViewport.web.ts`.
 * @param _enabled - Unused on native (kept for the shared signature).
 */
export const useNearViewport = (_enabled: boolean) => ({
  isNear: true,
  ref: useRef<ComponentRef<typeof View>>(null),
})
