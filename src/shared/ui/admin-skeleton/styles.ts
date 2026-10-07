import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from '../theme/themed'

export const styles = StyleSheet.create({
  artwork: {
    borderRadius: RADIUSES.low,
    height: 56,
    width: 56,
  },
  avatar: {
    borderRadius: RADIUSES.round,
    height: 44,
    width: 44,
  },
  badge: {
    height: FONT_SIZES.base,
    width: 56,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: INDENTS.low,
    marginTop: INDENTS.low,
  },
  bar: {
    borderRadius: RADIUSES.low,
  },
  body: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: 'transparent',
    marginBottom: INDENTS.medium,
  },
  contentCardLine: {
    height: FONT_SIZES.base,
    marginTop: INDENTS.low,
    width: '100%',
  },
  contentCardLineShort: {
    height: FONT_SIZES.base,
    marginTop: INDENTS.low,
    width: '70%',
  },
  contentCardTitle: {
    height: FONT_SIZES.h3,
    width: '45%',
  },
  dragHandle: {
    height: FONT_SIZES.h3,
    width: 26,
  },
  mediaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
  },
  metaBar: {
    height: FONT_SIZES.sm,
    marginTop: 6,
    width: '40%',
  },
  row: {
    borderRadius: RADIUSES.middle,
    borderWidth: 1,
    marginBottom: INDENTS.medium,
    padding: INDENTS.medium,
  },
  shell: {
    flex: 1,
    padding: INDENTS.medium,
  },
  shellTitle: {
    height: FONT_SIZES.h2,
    marginBottom: INDENTS.medium,
    width: '40%',
  },
  titleBar: {
    height: FONT_SIZES.md,
    width: '60%',
  },
  userRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
  },
})
