import { type StyleProp, Text, type TextStyle } from 'react-native'
import type { XMLElementText } from '../model'

interface GetTextElementProps {
  element: XMLElementText
  elementKey: string
  style: StyleProp<TextStyle>
}

export const getTextElement = ({ element: { text }, elementKey, style }: GetTextElementProps) => (
  <Text style={style} key={elementKey}>
    {typeof text === 'string' ? text.replace(/((\n)|(\s))+/g, ' ') : text}
  </Text>
)
