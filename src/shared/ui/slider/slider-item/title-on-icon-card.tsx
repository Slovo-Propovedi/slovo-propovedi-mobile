import { StyleSheet, View } from 'react-native'
import { INDENTS } from '../../theme/themed'
import { SliderItemText } from '../slider-item-text/slider-item-text'
import {
  type SliderItemTextAlign,
  SliderItemTextBackgroundStyle,
} from '../slider-item-text/slider-item-text.types'
import { TITLE_ON_CARD_TEST_ID } from './card-overlay'
import { DESCRIPTION_ON_CARD_BACKGROUND } from './description-on-card'
import { getTitleFontSize } from './slider-item.lib'
import { type SliderItemSize, WhereIsSlideTitleLocated } from './slider-item.types'

// Title drawn over an icon card: centered for the `on` placement, bottom-anchored
// for `bothOnAndUnder` on the shared dark scrim.
export const TitleOnIconCard = ({
  backgroundStyle,
  isBottom,
  size,
  title,
  titleTextAlign,
}: {
  backgroundStyle?: SliderItemTextBackgroundStyle
  isBottom: boolean
  size: SliderItemSize
  title: string
  titleTextAlign?: SliderItemTextAlign
}) => {
  const titleFontSize = getTitleFontSize(
    size,
    isBottom ? WhereIsSlideTitleLocated.Both : WhereIsSlideTitleLocated.On,
  )

  return (
    <View
      testID={TITLE_ON_CARD_TEST_ID}
      style={[styles.container, isBottom && styles.containerBottom]}
    >
      {isBottom ? (
        <View style={styles.bottomStack}>
          <SliderItemText
            maxLines={1}
            title={title}
            titleFontSize={titleFontSize}
            style={styles.bottomStackItem}
            titleTextAlign={titleTextAlign}
            backgroundStyle={SliderItemTextBackgroundStyle.Dark}
          />
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
  )
}

const styles = StyleSheet.create({
  bottomStack: {
    backgroundColor: DESCRIPTION_ON_CARD_BACKGROUND,
    paddingHorizontal: INDENTS.middle,
    paddingVertical: INDENTS.middle,
    width: '100%',
  },
  // Гасит собственную плашку и отступы SliderItemText: общий фон даёт bottomStack.
  bottomStackItem: { backgroundColor: 'transparent', padding: 0 },
  container: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  containerBottom: { justifyContent: 'flex-end' },
})
