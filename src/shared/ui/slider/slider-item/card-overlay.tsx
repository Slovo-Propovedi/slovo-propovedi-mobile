import { StyleSheet, View } from 'react-native'
import { INDENTS } from '../../theme/themed'
import { SliderItemText } from '../slider-item-text/slider-item-text'
import {
  type SliderItemTextAlign,
  SliderItemTextBackgroundStyle,
} from '../slider-item-text/slider-item-text.types'
import { DESCRIPTION_ON_CARD_BACKGROUND, DescriptionOnCard } from './description-on-card'
import { getTitleAreaStyleName, getTitleFontSize } from './slider-item.lib'
import {
  type SliderItemSize,
  type SliderItemTransform,
  WhereIsSlideTitleLocated,
} from './slider-item.types'

// Контейнер оверлея не несёт собственного текста — служит якорем для тестов,
// различающих заголовок «на карточке» и заголовок «под карточкой».
export const TITLE_ON_CARD_TEST_ID = 'slider-item-title-on-card'

// Слой поверх обложки: заголовок центрируется в оставшейся области, описание
// прижато к низу карточки. Пустой заголовок/описание не рендерятся. В
// bottom-режиме заголовок и описание делят одну тёмную плашку.
export const CardOverlay = ({
  backgroundStyle,
  description,
  isTitleBottom,
  size,
  title,
  titleTextAlign,
  transform,
}: {
  backgroundStyle?: SliderItemTextBackgroundStyle
  description?: string
  isTitleBottom?: boolean
  size: SliderItemSize
  title: string
  titleTextAlign?: SliderItemTextAlign
  transform?: SliderItemTransform
}) => {
  const isStackedTitle = !!title && !!isTitleBottom
  const titleFontSize = getTitleFontSize(
    size,
    isTitleBottom ? WhereIsSlideTitleLocated.Both : WhereIsSlideTitleLocated.On,
  )

  return (
    <View style={styles.overlayContent}>
      {title ? (
        <View testID={TITLE_ON_CARD_TEST_ID} style={styles[getTitleAreaStyleName(!!isTitleBottom)]}>
          {isStackedTitle ? (
            <View style={styles.bottomStack}>
              <SliderItemText
                maxLines={1}
                title={title}
                titleFontSize={titleFontSize}
                style={styles.bottomStackItem}
                titleTextAlign={titleTextAlign}
                backgroundStyle={SliderItemTextBackgroundStyle.Dark}
              />
              {description ? (
                <DescriptionOnCard plain size={size} text={description} transform={transform} />
              ) : null}
            </View>
          ) : (
            <SliderItemText
              isOnArtwork
              maxLines={1}
              title={title}
              titleFontSize={titleFontSize}
              titleTextAlign={titleTextAlign}
              backgroundStyle={backgroundStyle}
            />
          )}
        </View>
      ) : null}
      {!isStackedTitle && description ? (
        <DescriptionOnCard size={size} text={description} transform={transform} />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  bottomStack: {
    backgroundColor: DESCRIPTION_ON_CARD_BACKGROUND,
    gap: INDENTS.lowest,
    paddingHorizontal: INDENTS.middle,
    paddingVertical: INDENTS.middle,
    width: '100%',
  },
  // Гасит собственную плашку и отступы SliderItemText: общий фон даёт bottomStack.
  bottomStackItem: { backgroundColor: 'transparent', padding: 0 },
  overlayContent: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  titleBottomArea: { width: '100%' },
  titleOnCardArea: { flex: 1, justifyContent: 'center', width: '100%' },
})
