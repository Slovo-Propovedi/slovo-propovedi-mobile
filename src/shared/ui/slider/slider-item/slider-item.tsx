import { StyleSheet, View } from 'react-native'
import { match } from 'ts-pattern'
import { CoverImage } from '../../cover-image/cover-image'
import { useTheme } from '../../theme/ThemeContext/useTheme'
import { RADIUSES } from '../../theme/themed'
import { TouchableButton } from '../../touchable-button/TouchableButton'
import { SliderItemText } from '../slider-item-text/slider-item-text'
import { CardOverlay, TITLE_ON_CARD_TEST_ID } from './card-overlay'
import { SliderItemSkeleton } from './skeleton'
import { getSliderItemWidth } from './slider-item.lib'
import {
  type SliderItemProps,
  SliderItemSize,
  SliderItemTransform,
  WhereIsSlideTitleLocated,
} from './slider-item.types'

export const SliderItem = ({
  artwork,
  artworkIcon,
  borderRadius,
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
  const { currentTheme } = useTheme()
  const conditionSize = getSliderItemWidth(size)
  const radius = (borderRadius ?? true) ? RADIUSES.large : 0

  const isTitleOnCard = whereIsSlideTitleLocated === WhereIsSlideTitleLocated.On && !!title
  const isTitleUnderCard = whereIsSlideTitleLocated === WhereIsSlideTitleLocated.Under && !!title
  const cardDescription =
    isDescriptionTitleOnSlideLarge && !artworkIcon ? description?.trim() : undefined

  const imageHeight = match(transform)
    .with(SliderItemTransform.High, () => conditionSize * 1.3)
    .with(SliderItemTransform.Short, () => conditionSize / 2)
    .with(undefined, () => conditionSize)
    .exhaustive()

  return (
    <TouchableButton
      testID={testID}
      onPress={onPress}
      activeOpacity={0.8}
      onLongPress={onLongPress}
    >
      <View style={[styles.component, { borderRadius: radius, width: conditionSize }, style]}>
        {artworkIcon ? (
          <View
            style={[
              styles.iconBackground,
              { backgroundColor: currentTheme.surface, borderRadius: radius, height: imageHeight },
            ]}
          >
            {artworkIcon}
            {isTitleOnCard ? (
              <View style={styles.titleOnIconCard} testID={TITLE_ON_CARD_TEST_ID}>
                <SliderItemText
                  title={title ?? ''}
                  titleTextAlign={titleTextAlign}
                  backgroundStyle={descriptionBackgroundStyle}
                />
              </View>
            ) : null}
          </View>
        ) : (
          <CoverImage
            uri={artwork}
            style={[styles.imageBackground, { borderRadius: radius, height: imageHeight }]}
          >
            {isTitleOnCard || cardDescription ? (
              <CardOverlay
                size={size}
                title={title ?? ''}
                description={cardDescription}
                titleTextAlign={titleTextAlign}
                backgroundStyle={descriptionBackgroundStyle}
              />
            ) : null}
          </CoverImage>
        )}
        {isTitleUnderCard ? (
          <SliderItemText
            title={title ?? ''}
            borderRadius={borderRadius}
            titleTextAlign={titleTextAlign}
            backgroundStyle={descriptionBackgroundStyle}
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
  iconBackground: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  imageBackground: { justifyContent: 'flex-end', width: '100%' },
  titleOnIconCard: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
})
