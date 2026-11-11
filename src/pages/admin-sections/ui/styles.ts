import { StyleSheet } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

export const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUSES.low,
    borderWidth: 1,
    paddingHorizontal: INDENTS.low,
    paddingVertical: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: INDENTS.low,
    marginTop: INDENTS.low,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.medium,
    paddingBottom: INDENTS.high,
  },
  headerText: {
    flex: 1,
  },
  // DraggableFlatList renders its own wrapper without flex; on react-native-web
  // that wrapper sizes to content and the inner ScrollView never scrolls, so the
  // list tail gets clipped by body { overflow: hidden }.
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: INDENTS.medium,
  },
  reordering: {
    paddingVertical: INDENTS.medium,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.lowest,
  },
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
  },
})
