import { Entypo } from '@expo/vector-icons'
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { FONT_SIZES, INDENTS, RADIUSES } from '../theme/themed'
import { SliderItemSkeleton } from './slider-item/skeleton'
import {
  SliderItemSize,
  type SliderItemTransform,
  WhereIsSlideTitleLocated,
} from './slider-item/slider-item.types'

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

const getMarginBottom = (itemsSize: SliderItemSize, titleFontSize: number): number =>
  ({
    [SliderItemSize.Large]: titleFontSize * 2,
    [SliderItemSize.Middle]: titleFontSize,
    [SliderItemSize.Small]: titleFontSize,
    [SliderItemSize.XLarge]: titleFontSize * 2,
  })[itemsSize]

const getItemsByRows = (itemsCount: number, itemsRows: number): number[] => {
  const rows: number[] = []
  let rowIndex = 0
  for (let i = 0; i < itemsCount; i++) {
    if (!rows[rowIndex]) rows[rowIndex] = 0
    rows[rowIndex]++
    rowIndex++
    if (rowIndex >= itemsRows) rowIndex = 0
  }
  return rows
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
        <View
          style={[
            styles.titleBar,
            { backgroundColor: currentTheme.skeleton, height: titleFontSize },
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
