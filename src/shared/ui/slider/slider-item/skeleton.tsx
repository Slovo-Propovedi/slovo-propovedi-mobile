import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { match } from 'ts-pattern'
import { useSkeletonPulse } from '../../skeleton/useSkeletonPulse'
import { useTheme } from '../../theme/ThemeContext/useTheme'
import { INDENTS, RADIUSES } from '../../theme/themed'
import { SliderItemText } from '../slider-item-text/slider-item-text'
import { getSliderItemWidth } from './slider-item.lib'
import { SliderItemSize, SliderItemTransform, WhereIsSlideTitleLocated } from './slider-item.types'

export const SliderItemSkeleton = ({
  borderRadius,
  size = SliderItemSize.Small,
  testID = 'slider-item',
  transform,
  whereIsSlideTitleLocated = WhereIsSlideTitleLocated.Under,
}: {
  borderRadius?: boolean
  size?: SliderItemSize
  testID?: string
  transform?: SliderItemTransform
  whereIsSlideTitleLocated?: WhereIsSlideTitleLocated
}) => {
  const { currentTheme } = useTheme()
  const { pulseStyle } = useSkeletonPulse()

  const itemWidth = getSliderItemWidth(size)
  const radius = (borderRadius ?? true) ? RADIUSES.large : 0

  const imageHeight = match(transform)
    .with(SliderItemTransform.High, () => itemWidth * 1.3)
    .with(SliderItemTransform.Short, () => itemWidth / 2)
    .with(undefined, () => itemWidth)
    .exhaustive()

  const isTitleOnCard = whereIsSlideTitleLocated === WhereIsSlideTitleLocated.On

  const isTitleUnderCard = whereIsSlideTitleLocated === WhereIsSlideTitleLocated.Under

  return (
    <TouchableOpacity testID={testID} activeOpacity={0.8}>
      <View style={[styles.component, { borderRadius: radius, width: itemWidth }]}>
        <Animated.View
          style={[
            styles.image,
            { backgroundColor: currentTheme.skeleton, borderRadius: radius, height: imageHeight },
            pulseStyle,
          ]}
        >
          {isTitleOnCard && <SliderItemText.Skeleton style={styles.titleOnCard} />}
        </Animated.View>
        {isTitleUnderCard && <SliderItemText.Skeleton style={styles.titleUnderCard} />}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  component: {
    minHeight: 50,
    minWidth: 50,
  },
  image: {
    justifyContent: 'flex-end',
    width: '100%',
  },
  titleOnCard: {
    marginBottom: INDENTS.low,
    marginTop: 'auto',
  },
  titleUnderCard: {
    marginTop: INDENTS.low,
  },
})
