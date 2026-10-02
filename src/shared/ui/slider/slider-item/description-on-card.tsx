import { StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../../theme/colors'
import { INDENTS } from '../../theme/themed'
import { getDescriptionOnCardFontSize, getDescriptionOnCardNumberOfLines } from './slider-item.lib'
import { type SliderItemSize } from './slider-item.types'

// Translucent scrim keeps the white description readable over any artwork.
const DESCRIPTION_ON_CARD_BACKGROUND = 'rgba(0, 0, 0, 0.55)'

// Плашка описания плейлиста: прижата к низу карточки, тёмный полупрозрачный
// фон, белый текст, масштабируемый от размера карточки.
export const DescriptionOnCard = ({ size, text }: { size: SliderItemSize; text: string }) => (
  <View style={styles.component}>
    <Text
      numberOfLines={getDescriptionOnCardNumberOfLines(size)}
      style={[styles.text, { fontSize: getDescriptionOnCardFontSize(size) }]}
    >
      {text}
    </Text>
  </View>
)

const styles = StyleSheet.create({
  component: {
    backgroundColor: DESCRIPTION_ON_CARD_BACKGROUND,
    paddingHorizontal: INDENTS.middle,
    paddingVertical: INDENTS.low,
    width: '100%',
  },
  text: { color: COLORS.white, fontWeight: '500' },
})
