import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { match } from 'ts-pattern'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from 'shared/config'
import { SliderItemSize, SliderItemTransform, WhereIsSlideTitleLocated } from 'shared/ui'
import { type ThemeColors } from 'shared/ui/theme'
import { FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/themed'

interface SkeletonSliderItemProps {
  size?: SliderItemSize
  theme: ThemeColors
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}

export const SkeletonSliderItem = ({
  size = SliderItemSize.Small,
  theme,
  transform,
  whereIsSlideTitleLocated = WhereIsSlideTitleLocated.Under,
}: SkeletonSliderItemProps) => {
  const itemWidth = match(size)
    .with(SliderItemSize.Large, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.62)
    .with(SliderItemSize.Middle, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.44)
    .with(SliderItemSize.Small, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.285)
    .with(SliderItemSize.XLarge, () => SIZE_OF_MINIMUM_SIDE_OF_SCREEN * 0.9)
    .exhaustive()

  const imageHeight = match(transform)
    .with(SliderItemTransform.High, () => itemWidth * 1.3)
    .with(SliderItemTransform.Short, () => itemWidth / 2)
    .with(undefined, () => itemWidth)
    .exhaustive()

  const isVisibleDescriptionOnSlide =
    whereIsSlideTitleLocated === WhereIsSlideTitleLocated.On ||
    whereIsSlideTitleLocated === WhereIsSlideTitleLocated.BothOnAndUnder

  const isVisibleDescriptionUnderSlide =
    whereIsSlideTitleLocated === WhereIsSlideTitleLocated.Under ||
    whereIsSlideTitleLocated === WhereIsSlideTitleLocated.BothOnAndUnder

  return (
    <TouchableOpacity activeOpacity={0.8} testID='slider-item'>
      <View style={[styles.component, { width: itemWidth }]}>
        <View style={[styles.image, { backgroundColor: theme.skeleton, height: imageHeight }]}>
          {isVisibleDescriptionOnSlide && (
            <View style={[styles.descriptionOnSlide, { backgroundColor: theme.skeleton }]} />
          )}
        </View>
        {isVisibleDescriptionUnderSlide && (
          <View style={[styles.descriptionUnderSlide, { backgroundColor: theme.skeleton }]} />
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  component: {
    borderRadius: RADIUSES.large,
    minHeight: 50,
    minWidth: 50,
  },
  descriptionOnSlide: {
    borderRadius: RADIUSES.low,
    height: INDENTS.middle * 2 + FONT_SIZES.h3,
    marginBottom: INDENTS.low,
    marginHorizontal: INDENTS.middle,
    marginTop: 'auto',
    width: '80%',
  },
  descriptionUnderSlide: {
    alignSelf: 'center',
    borderRadius: RADIUSES.low,
    height: INDENTS.middle * 2 + FONT_SIZES.h3,
    marginTop: INDENTS.low,
    width: '80%',
  },
  image: {
    borderRadius: RADIUSES.large,
    justifyContent: 'flex-end',
    width: '100%',
  },
})
