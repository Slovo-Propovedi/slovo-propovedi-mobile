import { StyleSheet } from 'react-native'
import { type ThemeColors } from 'shared/ui/theme'

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
    // No elevation: the tab-bar backdrop is flat (its elevation moved to the islands
    // row), so the draw order is the document one — screens -> tab bar (shade +
    // islands) -> player (pill).
    recoveryOverlay: {
      ...StyleSheet.absoluteFill,
      pointerEvents: 'box-none',
    },
  })

// Full-screen pass-through layer that carries the keyboard lift of the mini pill.
// The pill's absolute geometry keeps resolving against the same full-window box;
// the transform only shifts the rendered layer.
// `box-none` must be a PROP on the Animated.View, never a style key: Reanimated
// applies animated styles inline on web, and the browser drops the invalid CSS
// value `pointer-events: box-none`, leaving the overlay pointer-events:auto and
// swallowing every touch on the page (Issue: web UI unresponsive).
//
// `elevation` is intentionally absent: the tab-bar backdrop is flat (the
// elevation moved to the islands row), so the draw order is the document one —
// screens -> tab bar (shade + islands) -> player (pill). An elevation here only
// raced the tab-bar container's old projection and is no longer needed.
export const miniLayerStyle = StyleSheet.create({
  layer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
}).layer
