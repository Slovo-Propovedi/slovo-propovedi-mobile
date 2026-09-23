import { StyleSheet } from 'react-native'
import type { ThemeColors } from 'shared/ui/theme'

export const createCommonStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      backgroundColor: theme.surface,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 150,
    },
    container: {
      backgroundColor: theme.surface,
      overflow: 'hidden',
      position: 'absolute',
      zIndex: 200,
    },
    // Full-screen wrapper for the whole widget (background-recovery remount subtree).
    // pointerEvents must live inside StyleSheet.create (NOT inline): on web RNW only
    // polyfills the non-CSS values 'box-none'/'box-only' when it compiles a style to
    // classes; inline style.pointerEvents:'box-none' would emit the invalid CSS value
    // `pointer-events: box-none`, the browser drops it, the wrapper becomes
    // pointer-events:auto and swallows every touch on the page below the player.
    recoveryOverlay: {
      ...StyleSheet.absoluteFill,
      pointerEvents: 'box-none',
    },
  })
