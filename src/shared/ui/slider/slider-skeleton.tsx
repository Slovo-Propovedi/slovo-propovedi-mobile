import { Entypo } from '@expo/vector-icons'
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { useSkeletonPulse } from '../skeleton/useSkeletonPulse'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { FONT_SIZES, INDENTS, RADIUSES } from '../theme/themed'
import { SliderItemSkeleton } from './slider-item/skeleton'
import {
  SliderItemSize,
  type SliderItemTransform,
  WhereIsSlideTitleLocated,
} from './slider-item/slider-item.types'
import { getItemsByRows, getMarginBottom } from './slider-skeleton.lib'

interface SliderSkeletonProps {
  borderRadius?: boolean
  itemsCount?: number
  itemsRows?: number
  itemsSize?: SliderItemSize
  style?: StyleProp<ViewStyle>
  titleFontSize?: number
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}

export const SliderSkeleton = ({
  borderRadius = false,
  itemsCount = 4,
  itemsRows = 1,
  itemsSize = SliderItemSize.Small,
  style,
  titleFontSize = FONT_SIZES.h2,
  transform,
  whereIsSlideTitleLocated = WhereIsSlideTitleLocated.Under,
}: SliderSkeletonProps) => {
  const { currentTheme } = useTheme()
  const { pulseStyle } = useSkeletonPulse()
  const marginBottom = getMarginBottom(itemsSize, titleFontSize)
  const itemsByRows = getItemsByRows(itemsCount, itemsRows)
  const sectionStyle = {
    paddingHorizontal: INDENTS.middle,
    ...(borderRadius ? { borderRadius: RADIUSES.low } : {}),
  }

  return (
    <View
      style={[
        styles.slider,
        { marginTop: titleFontSize / 2 },
        { marginBottom },
        sectionStyle,
        style,
      ]}
    >
      <View testID='title' style={styles.title}>
        <Animated.View
          style={[
            styles.titleBar,
            { backgroundColor: currentTheme.skeleton, height: titleFontSize },
            pulseStyle,
          ]}
        />
        <Entypo name='chevron-right' size={titleFontSize} color={currentTheme.skeleton} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {itemsByRows.map((count, rowIndex) => (
          <View key={rowIndex} style={styles.row} testID='slider-row'>
            {Array.from({ length: count }).map((_, itemIndex) => (
              <SliderItemSkeleton
                key={itemIndex}
                size={itemsSize}
                transform={transform}
                whereIsSlideTitleLocated={whereIsSlideTitleLocated}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'column-reverse',
    gap: INDENTS.middle,
  },
  row: {
    flexDirection: 'row',
    gap: INDENTS.middle,
    maxWidth: '100%',
    width: '100%',
  },
  slider: { maxWidth: '100%' },
  title: {
    alignItems: 'center',
    flexDirection: 'row',
    fontWeight: 'bold',
    paddingBottom: INDENTS.middle,
    paddingLeft: INDENTS.lowest,
    paddingTop: INDENTS.lowest,
  },
  titleBar: {
    borderRadius: RADIUSES.low,
    marginRight: 4,
    width: '80%',
  },
})
