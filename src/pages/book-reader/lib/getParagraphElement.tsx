import { Text, View } from 'react-native'
import { type ThemeColors } from 'shared/ui/theme'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import { BodyXMLElementName, type XMLElement } from '../model'
import { getElementKey } from './getElementKey'
import { getElementsInBlockElement } from './getElementsInBlockElement'

export interface GetParagraphElementProps {
  childrenStyle: StyleProp<TextStyle>
  elements: XMLElement[]
  parentKey: string
  style: StyleProp<ViewStyle>
  textStyle: StyleProp<TextStyle>
  theme: ThemeColors
}

export const getParagraphElement = ({
  childrenStyle,
  elements,
  parentKey,
  style,
  textStyle,
  theme,
}: GetParagraphElementProps) => (
  <View
    style={style}
    key={getElementKey({
      name: BodyXMLElementName.P,
      startWith: parentKey,
    })}
  >
    <Text style={textStyle}>
      {getElementsInBlockElement({
        elements,
        parentKey,
        style: childrenStyle,
        theme,
      })}
    </Text>
  </View>
)
