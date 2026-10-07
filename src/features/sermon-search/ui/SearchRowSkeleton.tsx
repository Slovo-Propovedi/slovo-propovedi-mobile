import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { LIST_ITEM_CARD_ARTWORK_SIZE } from 'entities/list-item'
import { useSkeletonPulse } from 'shared/ui/skeleton/useSkeletonPulse'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'

export const SearchRowSkeleton = () => {
  const { currentTheme } = useTheme()
  const { pulseStyle } = useSkeletonPulse()

  return (
    <Animated.View
      testID='search-row-skeleton'
      style={[styles.row, { backgroundColor: currentTheme.skeleton }, pulseStyle]}
    >
      <View style={[styles.artwork, { backgroundColor: currentTheme.card }]} />
      <View style={styles.texts}>
        <View style={[styles.titleBar, { backgroundColor: currentTheme.card }]} />
        <View style={[styles.subtitleBar, { backgroundColor: currentTheme.card }]} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  artwork: {
    borderRadius: RADIUSES.low,
    height: LIST_ITEM_CARD_ARTWORK_SIZE,
    width: LIST_ITEM_CARD_ARTWORK_SIZE,
  },
  row: {
    alignItems: 'center',
    borderRadius: RADIUSES.middle,
    flexDirection: 'row',
    gap: INDENTS.medium,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.medium,
  },
  subtitleBar: {
    borderRadius: RADIUSES.low,
    height: FONT_SIZES.md,
    marginTop: INDENTS.low,
    width: '40%',
  },
  texts: {
    flex: 1,
  },
  titleBar: {
    borderRadius: RADIUSES.low,
    height: FONT_SIZES.h3,
    width: '60%',
  },
})
