import { StyleSheet } from 'react-native'
import { type ThemeColors } from 'shared/ui/theme'
import { COLORS, FONT_SIZES } from 'shared/ui/themed'

export const THUMB_SIZE = 10

export const createProgressBarStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: { width: '100%' },
    downloadProgress: {
      ...StyleSheet.absoluteFill,
      backgroundColor: COLORS.maximumTrackTintColor,
      borderBottomLeftRadius: 2.5,
      borderTopLeftRadius: 2.5,
    },
    progress: {
      ...StyleSheet.absoluteFill,
      backgroundColor: COLORS.primary,
      borderBottomLeftRadius: 2.5,
      borderTopLeftRadius: 2.5,
    },
    thumb: {
      backgroundColor: COLORS.primary,
      borderRadius: THUMB_SIZE / 2,
      elevation: 2,
      height: THUMB_SIZE,
      position: 'absolute',
      shadowColor: '#000',
      shadowOffset: { height: 1, width: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      top: -2.5,
      width: THUMB_SIZE,
    },
    timeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    timeText: { color: theme.textMuted, fontSize: FONT_SIZES.sm },
    track: {
      backgroundColor: COLORS.gray,
      borderRadius: 2.5,
      height: 5,
      position: 'relative',
    },
    trackBackground: {
      ...StyleSheet.absoluteFill,
      backgroundColor: COLORS.gray,
    },
    trackContainer: { height: 20, justifyContent: 'center' },
  })
