import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  actionLabel: {
    flex: 1,
    fontSize: FONT_SIZES.base,
  },
  actionRow: {
    alignItems: 'center',
    borderRadius: RADIUSES.middle,
    flexDirection: 'row',
    gap: INDENTS.medium,
    marginTop: INDENTS.middle,
    padding: INDENTS.medium,
  },
  card: {
    alignItems: 'center',
    borderRadius: RADIUSES.middle,
    flex: 1,
    gap: INDENTS.low,
    padding: INDENTS.medium,
  },
  cards: {
    flexDirection: 'row',
    gap: INDENTS.middle,
    marginTop: INDENTS.high,
  },
  cardTitle: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: INDENTS.high,
    paddingBottom: INDENTS.highest,
  },
  count: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTexts: {
    flex: 1,
    gap: INDENTS.lowest,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
  },
  headerUser: {
    fontSize: FONT_SIZES.base,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: INDENTS.highest,
    textTransform: 'uppercase',
  },
  statCountBar: {
    height: FONT_SIZES.xxl,
    width: '50%',
  },
})
