import { View } from 'react-native'
import type { XMLElement, XMLElementName } from 'entities/book-reader'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import { getElementKey } from './getElementKey'
import { getElementsInBlockElement } from './getElementsInBlockElement'

export interface GetBlockElementProps {
  childrenStyle: StyleProp<TextStyle>
  elements: XMLElement[]
  name: XMLElementName
  parentKey: string
  style: StyleProp<ViewStyle>
}

export const getBlockElement = ({
  childrenStyle,
  elements,
  name,
  parentKey,
  style,
}: GetBlockElementProps) => (
  <View
    style={style}
    key={getElementKey({
      name,
      startWith: parentKey,
    })}
  >
    {getElementsInBlockElement({
      elements,
      parentKey,
      style: childrenStyle,
    })}
  </View>
)
