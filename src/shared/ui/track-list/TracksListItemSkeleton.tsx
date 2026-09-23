import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { useSkeletonPulse } from '../skeleton/useSkeletonPulse'
import { TRACK_LIST_ITEM_SIZES } from './styles'

interface TracksListItemSkeletonProps {
  style?: StyleProp<ViewStyle>
}

export const TracksListItemSkeleton = ({ style }: TracksListItemSkeletonProps) => {
  const { currentTheme } = useTheme()
  const { pulseStyle } = useSkeletonPulse()

  return (
    <Animated.View
      testID='tracks-list-item-skeleton'
      style={[
        styles.card,
        { backgroundColor: currentTheme.skeleton },
        pulseStyle,
        style,
        { pointerEvents: 'none' },
      ]}
    >
      <View style={[styles.art, { backgroundColor: currentTheme.card }]} />
      <View style={styles.textColumn}>
        <View style={[styles.titleBar, { backgroundColor: currentTheme.card }]} />
        <View style={[styles.subtitleBar, { backgroundColor: currentTheme.card }]} />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  art: {
    borderRadius: RADIUSES.low,
    height: TRACK_LIST_ITEM_SIZES.albumArtSize,
    marginRight: INDENTS.middle,
    width: TRACK_LIST_ITEM_SIZES.albumArtSize,
  },
  card: {
    alignItems: 'center',
    borderRadius: RADIUSES.middle,
    flexDirection: 'row',
    paddingHorizontal: INDENTS.middle,
    paddingVertical: INDENTS.middle,
  },
  subtitleBar: {
    borderRadius: RADIUSES.low,
    height: FONT_SIZES.base,
    marginTop: INDENTS.lowest,
    width: '40%',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleBar: {
    borderRadius: RADIUSES.low,
    height: FONT_SIZES.md,
    width: '60%',
  },
})
