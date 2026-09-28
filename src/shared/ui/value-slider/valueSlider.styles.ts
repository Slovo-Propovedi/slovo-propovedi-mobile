import { StyleSheet } from 'react-native'
import { COLORS, type ThemeColors } from 'shared/ui/theme'

export const THUMB_SIZE = 20
export const TRACK_HEIGHT = 4

// Effective touch area: container height + hitSlop in ValueSlider = 48dp
// (see MIN_TOUCH_TARGET in shared/ui/theme).
export const TRACK_CONTAINER_HEIGHT = 32

export const createValueSliderStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    disabled: { opacity: 0.5 },
    progress: {
      backgroundColor: theme.primary,
      borderRadius: TRACK_HEIGHT / 2,
      height: '100%',
    },
    thumb: {
      backgroundColor: theme.primary,
      borderRadius: THUMB_SIZE / 2,
      boxShadow: '0px 1px 2px rgba(0,0,0,0.2)',
      elevation: 2,
      height: THUMB_SIZE,
      pointerEvents: 'none',
      position: 'absolute',
      top: (TRACK_HEIGHT - THUMB_SIZE) / 2,
      width: THUMB_SIZE,
    },
    track: {
      backgroundColor: COLORS.gray,
      borderRadius: TRACK_HEIGHT / 2,
      height: TRACK_HEIGHT,
      width: '100%',
    },
    trackContainer: {
      height: TRACK_CONTAINER_HEIGHT,
      justifyContent: 'center',
    },
  })
