import { type StyleProp, type TextStyle, View, type ViewStyle } from 'react-native'
import { type ThemeColors } from 'shared/ui/theme'
import { type XMLElement, type XMLElementName } from '../model'
import { getElementKey } from './getElementKey'
import { getElementsInBlockElement } from './getElementsInBlockElement'

export interface GetBlockElementProps {
  childrenStyle: StyleProp<TextStyle>
  elements: XMLElement[]
  name: XMLElementName
  parentKey: string
  style: StyleProp<ViewStyle>
  theme: ThemeColors
}

export const getBlockElement = ({
  childrenStyle,
  elements,
  name,
  parentKey,
  style,
  theme,
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
      theme,
    })}
  </View>
)
