import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useLayoutBaseWidth } from '../../layout/lib/useLayoutBaseWidth'
import { useSkeletonPulse } from '../../skeleton/useSkeletonPulse'
import { useTheme } from '../../theme/ThemeContext/useTheme'
import { FONT_SIZES, INDENTS, RADIUSES } from '../../theme/themed'
import { SliderItemText } from '../slider-item-text/slider-item-text'
import { getSliderCardLayout, getSliderLayoutViewport } from '../slider-layout.lib'
import { getSliderItemImageHeight } from './slider-item.lib'
import {
  SliderItemSize,
  type SliderItemTransform,
  WhereIsSlideTitleLocated,
} from './slider-item.types'

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
  const baseWidth = useLayoutBaseWidth()

  const itemWidth = getSliderCardLayout(size, getSliderLayoutViewport(baseWidth)).cardWidth
  const radius = (borderRadius ?? true) ? RADIUSES.slider : 0
  const imageHeight = getSliderItemImageHeight(itemWidth, transform)

  const isTitleOnCard =
    whereIsSlideTitleLocated === WhereIsSlideTitleLocated.On ||
    whereIsSlideTitleLocated === WhereIsSlideTitleLocated.Both

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
        {isTitleUnderCard && (
          <SliderItemText.Skeleton fontSize={FONT_SIZES.md} style={styles.titleUnderCard} />
        )}
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
    paddingHorizontal: 0,
  },
})
