import { StyleSheet, View } from 'react-native'
import { useLayoutBaseWidth } from '../../layout/lib/useLayoutBaseWidth'
import { RADIUSES } from '../../theme/themed'
import { TouchableButton } from '../../touchable-button/TouchableButton'
import { SliderItemText } from '../slider-item-text/slider-item-text'
import { getSliderCardLayout, getSliderLayoutViewport } from '../slider-layout.lib'
import { SliderItemSkeleton } from './skeleton'
import { SliderItemArtwork } from './slider-item-artwork'
import { getSliderItemImageHeight, getTitleFontSize } from './slider-item.lib'
import { type SliderItemProps, SliderItemSize, WhereIsSlideTitleLocated } from './slider-item.types'

export const SliderItem = ({
  artwork,
  artworkIcon,
  borderRadius,
  cardWidth,
  description,
  descriptionBackgroundStyle,
  isDescriptionTitleOnSlideLarge,
  onLongPress,
  onPress,
  size = SliderItemSize.Small,
  style,
  testID,
  title,
  titleTextAlign,
  transform,
  whereIsSlideTitleLocated = WhereIsSlideTitleLocated.Under,
}: SliderItemProps) => {
  const baseWidth = useLayoutBaseWidth()
  const conditionSize =
    cardWidth ?? getSliderCardLayout(size, getSliderLayoutViewport(baseWidth)).cardWidth
  const radius = (borderRadius ?? true) ? RADIUSES.slider : 0

  const isTitleOnCard = whereIsSlideTitleLocated === WhereIsSlideTitleLocated.On && !!title
  const isTitleOnCardBottom = whereIsSlideTitleLocated === WhereIsSlideTitleLocated.Both && !!title
  const isTitleUnderCard = whereIsSlideTitleLocated === WhereIsSlideTitleLocated.Under && !!title
  const cardDescription =
    isDescriptionTitleOnSlideLarge && !artworkIcon ? description?.trim() : undefined
  const imageHeight = getSliderItemImageHeight(conditionSize, transform)

  return (
    <TouchableButton
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      onLongPress={onLongPress}
    >
      <View style={[styles.component, { borderRadius: radius, width: conditionSize }, style]}>
        <SliderItemArtwork
          size={size}
          title={title}
          radius={radius}
          artwork={artwork}
          transform={transform}
          artworkIcon={artworkIcon}
          imageHeight={imageHeight}
          conditionSize={conditionSize}
          isTitleOnCard={isTitleOnCard}
          titleTextAlign={titleTextAlign}
          cardDescription={cardDescription}
          isTitleOnCardBottom={isTitleOnCardBottom}
          descriptionBackgroundStyle={descriptionBackgroundStyle}
        />
        {isTitleUnderCard ? (
          <SliderItemText
            maxLines={2}
            title={title ?? ''}
            borderRadius={borderRadius}
            style={styles.underCardTitle}
            titleTextAlign={titleTextAlign}
            backgroundStyle={descriptionBackgroundStyle}
            titleFontSize={getTitleFontSize(size, WhereIsSlideTitleLocated.Under)}
          />
        ) : null}
      </View>
    </TouchableButton>
  )
}

// Скелетон прикреплён к элементу как `SliderItem.Skeleton` — единый источник
// плейсхолдера (composition API), геометрия выводится из стилей элемента.
SliderItem.Skeleton = SliderItemSkeleton

const styles = StyleSheet.create({
  component: { minHeight: 50, minWidth: 50 },
  // Подпись под карточкой тянется во всю её ширину — без боковых отступов.
  underCardTitle: { paddingHorizontal: 0 },
})
