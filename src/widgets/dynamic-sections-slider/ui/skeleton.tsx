import { Entypo } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SliderItemSize, SliderItemTransform, WhereIsSlideTitleLocated } from 'shared/ui'
import { type ThemeColors } from 'shared/ui/theme'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/themed'
import { SkeletonSliderItem } from './skeleton-slider-item'

interface SkeletonSectionProps {
  borderRadius?: boolean
  itemsCount?: number
  itemsRows?: number
  itemsSize?: SliderItemSize
  titleFontSize?: number
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}

const SKELETON_SECTIONS: SkeletonSectionProps[] = [
  { itemsCount: 6, itemsSize: SliderItemSize.Small },
  { itemsCount: 6, itemsSize: SliderItemSize.Middle },
  { itemsCount: 4, itemsSize: SliderItemSize.XLarge },
  { itemsCount: 6, itemsSize: SliderItemSize.Middle, transform: SliderItemTransform.Short },
]

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

export const SectionsSkeleton = () => {
  const { currentTheme } = useTheme()
  return (
    <>
      {SKELETON_SECTIONS.map((section, index) => (
        <SkeletonSection key={index} theme={currentTheme} {...section} />
      ))}
    </>
  )
}

const SkeletonSection = ({
  borderRadius = false,
  itemsCount = 4,
  itemsRows = 1,
  itemsSize = SliderItemSize.Small,
  theme,
  titleFontSize = FONT_SIZES.h2,
  transform,
  whereIsSlideTitleLocated = WhereIsSlideTitleLocated.Under,
}: { theme: ThemeColors } & SkeletonSectionProps) => {
  const marginBottom = getMarginBottom(itemsSize, titleFontSize)
  const itemsByRows = getItemsByRows(itemsCount, itemsRows)
  const sectionStyle = {
    paddingHorizontal: INDENTS.middle,
    ...(borderRadius ? { borderRadius: RADIUSES.low } : {}),
  }

  return (
    <View style={[styles.slider, { marginTop: titleFontSize / 2 }, { marginBottom }, sectionStyle]}>
      <View testID='title' style={styles.title}>
        <View
          style={[styles.titleBar, { backgroundColor: theme.skeleton, height: titleFontSize }]}
        />
        <Entypo name='chevron-right' size={titleFontSize} color={theme.skeleton} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {itemsByRows.map((count, rowIndex) => (
          <View key={rowIndex} style={styles.row} testID='slider-row'>
            {Array.from({ length: count }).map((_, itemIndex) => (
              <SkeletonSliderItem
                theme={theme}
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
