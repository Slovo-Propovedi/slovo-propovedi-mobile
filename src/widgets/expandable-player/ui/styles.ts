/* eslint-disable max-lines -- TODO: refactor styles */
import { StyleSheet } from 'react-native'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'

export const styles = StyleSheet.create({
  artistName: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.lg,
    marginTop: INDENTS.low,
    textAlign: 'center',
  },
  backdrop: {
    backgroundColor: COLORS.black,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 150,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFill,
  },
  bottomContentContainer: {
    paddingBottom: INDENTS.high * 2,
    paddingHorizontal: INDENTS.medium,
  },
  closeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    left: INDENTS.medium,
    position: 'absolute',
    width: 40,
    zIndex: 300, // выше чем у container (200)
  },
  closeIcon: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl * 0.8,
  },
  container: {
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    position: 'absolute',
    zIndex: 200,
  },
  controlIcon: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
  },
  controlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  descriptionCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderRadius: RADIUSES.middle,
    flex: 1,
    marginVertical: INDENTS.medium,
    padding: INDENTS.medium,
  },
  descriptionCloseButton: {
    position: 'absolute',
    right: INDENTS.low,
    top: INDENTS.low,
  },
  descriptionCloseIcon: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xl,
  },
  descriptionContainer: {
    flex: 1,
    marginHorizontal: INDENTS.medium,
    position: 'relative',
  },
  descriptionText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  fullContainer: {
    bottom: 0,
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  menuButton: {
    padding: INDENTS.low,
  },
  menuContainer: {
    position: 'relative',
  },
  menuIcon: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.lg,
  },
  nextSermonContainer: {
    alignItems: 'center',
    left: 0,
    paddingHorizontal: INDENTS.medium,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  nextSermonLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  nextSermonTitle: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '500',
    marginTop: INDENTS.lowest,
    maxWidth: '80%',
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: INDENTS.low,
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: INDENTS.high,
  },
  sideControl: {
    alignItems: 'center',
    padding: INDENTS.low,
    width: 50,
  },
  spacer: {
    flex: 1,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    width: 50,
  },
  trackInfoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: INDENTS.high,
  },
  trackInfoTextContainer: {
    alignItems: 'center',
    flex: 1,
  },
  trackTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
})
