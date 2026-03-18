import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES } from 'shared/ui/themed'

export const THUMB_SIZE = 14

export const progressBarStyles = StyleSheet.create({
  container: { width: '100%' },
  progress: { backgroundColor: COLORS.primary },
  remaining: { backgroundColor: COLORS.gray },
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
    top: -3,
    width: THUMB_SIZE,
  },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
  track: {
    borderRadius: 4,
    flexDirection: 'row',
    height: 8,
    position: 'relative',
  },
  trackContainer: { height: 20, justifyContent: 'center' },
})
