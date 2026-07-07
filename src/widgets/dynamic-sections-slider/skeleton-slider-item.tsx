import { StyleSheet, View } from 'react-native'
import { match } from 'ts-pattern'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from 'shared/config'
import { type ThemeColors } from 'shared/ui/theme'
import { INDENTS, RADIUSES } from 'shared/ui/themed'

interface SkeletonSliderItemProps {
  size?: 'middle' | 'small' | 'xLarge'
  theme: ThemeColors
  transform?: 'high' | 'short'
}

export const SkeletonSliderItem = ({
  size = 'small',
  theme,
  transform,
}: SkeletonSliderItemProps) => {
  const itemWidth = match(size)
    .with('middle', () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.44)
    .with('small', () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.285)
    .with('xLarge', () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.9)
    .exhaustive()

  const itemHeight = match(transform)
    .with('high', () => itemWidth * 1.3)
    .with('short', () => itemWidth / 2)
    .with(undefined, () => itemWidth)
    .exhaustive()

  return (
    <View style={[styles.item, { width: itemWidth }]}>
      <View style={[styles.image, { backgroundColor: theme.skeleton, height: itemHeight }]} />
      <View style={[styles.title, { backgroundColor: theme.skeleton }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    borderRadius: RADIUSES.large,
    width: '100%',
  },
  item: {
    borderRadius: RADIUSES.large,
    marginRight: INDENTS.middle,
    minHeight: 50,
    minWidth: 50,
  },
  title: {
    borderRadius: RADIUSES.low,
    height: 14,
    marginTop: 6,
    width: '80%',
  },
})
