import { Platform } from 'react-native'

/**
 * Web running in a browser tab (not an installed home-screen PWA). False on
 * native by definition (short-circuit before any window access). Re-reads the
 * media query every render so tests can drive it through a matchMedia mock.
 */
export const useIsBrowserWeb = (): boolean =>
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  !window.matchMedia('(display-mode: standalone)').matches
