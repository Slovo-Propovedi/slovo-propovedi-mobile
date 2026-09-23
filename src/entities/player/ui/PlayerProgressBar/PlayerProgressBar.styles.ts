import { StyleSheet } from 'react-native'
import { type ThemeColors } from 'shared/ui/theme'
import { COLORS, FONT_SIZES } from 'shared/ui/theme'

export const THUMB_SIZE = 10

export const createProgressBarStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: { width: '100%' },
    downloadProgress: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(255,255,255,0.35)',
      borderBottomLeftRadius: 2.5,
      borderTopLeftRadius: 2.5,
      pointerEvents: 'none',
    },
    progress: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 2.5,
      borderTopLeftRadius: 2.5,
      pointerEvents: 'none',
    },
    thumb: {
      backgroundColor: theme.primary,
      borderRadius: THUMB_SIZE / 2,
      boxShadow: '0px 1px 2px rgba(0,0,0,0.2)',
      elevation: 2,
      height: THUMB_SIZE,
      pointerEvents: 'none',
      position: 'absolute',
      top: -2.5,
      width: THUMB_SIZE,
    },
    timeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    timeText: { color: theme.textMuted, fontSize: FONT_SIZES.sm },
    track: {
      backgroundColor: COLORS.gray,
      borderRadius: 2.5,
      height: 5,
      pointerEvents: 'none',
      position: 'relative',
    },
    trackBackground: {
      ...StyleSheet.absoluteFill,
      backgroundColor: COLORS.gray,
      pointerEvents: 'none',
    },
    trackContainer: { height: 20, justifyContent: 'center' },
  })
