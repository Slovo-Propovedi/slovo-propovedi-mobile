import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flexDirection: 'row',
    gap: INDENTS.low,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  actions: {
    flexDirection: 'row',
    gap: INDENTS.low,
    marginTop: INDENTS.medium,
  },
  actionText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  artwork: {
    borderRadius: RADIUSES.middle,
    height: 140,
    width: '100%',
  },
  audioFill: {
    borderRadius: RADIUSES.low,
    height: '100%',
  },
  audioProgress: {
    flex: 1,
  },
  audioRow: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flexDirection: 'row',
    gap: INDENTS.medium,
    padding: INDENTS.medium,
  },
  audioTime: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.lowest,
  },
  audioTrack: {
    borderRadius: RADIUSES.low,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  card: {
    borderRadius: RADIUSES.middle,
    marginTop: INDENTS.medium,
    padding: INDENTS.medium,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: INDENTS.medium,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  description: {
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  header: {
    paddingBottom: INDENTS.medium,
  },
  listContent: {
    padding: INDENTS.medium,
  },
  mediaLink: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flexDirection: 'row',
    gap: INDENTS.low,
    marginTop: INDENTS.low,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.medium,
  },
  mediaLinkText: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  playlistArtwork: {
    borderRadius: RADIUSES.low,
    height: 44,
    width: 44,
  },
  playlistRow: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    flexDirection: 'row',
    gap: INDENTS.medium,
    marginTop: INDENTS.low,
    padding: INDENTS.medium,
  },
  playlistTitle: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginTop: INDENTS.medium,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.lowest,
  },
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
    marginTop: INDENTS.medium,
  },
})
