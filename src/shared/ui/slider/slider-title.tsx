import { Entypo } from '@expo/vector-icons'
import { Text } from 'react-native'
import { type GestureResponderEvent } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { createSliderStyles as styles } from './slider.styles'

interface SliderTitleProps {
  fontSize: number
  onPress?: (event: GestureResponderEvent) => void
  title?: string
}

// Неразрывный пробел перед стрелкой: заголовок переносится на несколько строк,
// но стрелка всегда приклеена к последнему слову и не уезжает на отдельную строку.
const INLINE_ARROW_GAP = '\u00A0'

// Заголовок секции: текст переносится естественно на несколько строк, стрелка-
// «показать все» рендерится инлайн внутри того же Text и приклеена к концу текста.
export const SliderTitle = ({ fontSize, onPress, title }: SliderTitleProps) => {
  const { currentTheme } = useTheme()
  const sliderStyles = styles(currentTheme)

  return (
    <Text testID='title' onPress={onPress} style={[sliderStyles.title, { fontSize }]}>
      {title}
      {INLINE_ARROW_GAP}
      <Entypo size={fontSize} name='chevron-right' color={currentTheme.text} />
    </Text>
  )
}
