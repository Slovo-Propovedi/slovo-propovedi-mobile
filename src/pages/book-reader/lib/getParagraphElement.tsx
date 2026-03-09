import { Text, View } from 'react-native'
import { BodyXMLElementName, type XMLElement } from 'entities/book-reader'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import { getElementKey } from './getElementKey'
import { getElementsInBlockElement } from './getElementsInBlockElement'

export interface GetParagraphElementProps {
  childrenStyle: StyleProp<TextStyle>
  elements: XMLElement[]
  parentKey: string
  style: StyleProp<ViewStyle>
  textStyle: StyleProp<TextStyle>
}

export const getParagraphElement = ({
  childrenStyle,
  elements,
  parentKey,
  style,
  textStyle,
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
      })}
    </Text>
  </View>
)
