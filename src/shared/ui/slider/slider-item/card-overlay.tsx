import { StyleSheet, View } from 'react-native'
import { SliderItemText } from '../slider-item-text/slider-item-text'
import {
  type SliderItemTextAlign,
  type SliderItemTextBackgroundStyle,
} from '../slider-item-text/slider-item-text.types'
import { DescriptionOnCard } from './description-on-card'
import { type SliderItemSize } from './slider-item.types'

// Контейнер оверлея не несёт собственного текста — служит якорем для тестов,
// различающих заголовок «на карточке» и заголовок «под карточкой».
export const TITLE_ON_CARD_TEST_ID = 'slider-item-title-on-card'

// Слой поверх обложки: заголовок центрируется в оставшейся области, описание
// прижато к низу карточки. Пустой заголовок/описание не рендерятся.
export const CardOverlay = ({
  backgroundStyle,
  description,
  size,
  title,
  titleTextAlign,
}: {
  backgroundStyle?: SliderItemTextBackgroundStyle
  description?: string
  size: SliderItemSize
  title: string
  titleTextAlign?: SliderItemTextAlign
}) => (
  <View style={styles.overlayContent}>
    {title ? (
      <View style={styles.titleOnCardArea} testID={TITLE_ON_CARD_TEST_ID}>
        <SliderItemText
          title={title}
          titleTextAlign={titleTextAlign}
          backgroundStyle={backgroundStyle}
        />
      </View>
    ) : null}
    {description ? <DescriptionOnCard size={size} text={description} /> : null}
  </View>
)

const styles = StyleSheet.create({
  overlayContent: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  titleOnCardArea: { flex: 1, justifyContent: 'center', width: '100%' },
})
