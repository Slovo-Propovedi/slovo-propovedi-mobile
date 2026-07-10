import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { match } from 'ts-pattern'
import { SIZE_OF_MINIMUM_SIDE_OF_SCREEN } from 'shared/config'
import { INDENTS, RADIUSES, useTheme } from '../../themed'
import { SliderItemDescriptionSkeleton } from '../slider-item-description/skeleton'
import { SliderItemSize, SliderItemTransform, WhereIsSlideTitleLocated } from './slider-item.types'

interface SliderItemSkeletonProps {
  size?: SliderItemSize
  testID?: string
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}

export const SliderItemSkeleton = ({
  size = SliderItemSize.Small,
  testID = 'slider-item',
  transform,
  whereIsSlideTitleLocated = WhereIsSlideTitleLocated.Under,
}: SliderItemSkeletonProps) => {
  const { currentTheme } = useTheme()

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
    <TouchableOpacity testID={testID} activeOpacity={0.8}>
      <View style={[styles.component, { width: itemWidth }]}>
        <View
          style={[styles.image, { backgroundColor: currentTheme.skeleton, height: imageHeight }]}
        >
          {isVisibleDescriptionOnSlide && (
            <SliderItemDescriptionSkeleton style={styles.descriptionOnSlide} />
          )}
        </View>
        {isVisibleDescriptionUnderSlide && (
          <SliderItemDescriptionSkeleton style={styles.descriptionUnderSlide} />
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
    marginBottom: INDENTS.low,
    marginTop: 'auto',
  },
  descriptionUnderSlide: {
    marginTop: INDENTS.low,
  },
  image: {
    borderRadius: RADIUSES.large,
    justifyContent: 'flex-end',
    width: '100%',
  },
})
