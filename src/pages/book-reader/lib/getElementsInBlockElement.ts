import { XMLElementType } from 'entities/book-reader'
import { type ThemeColors } from 'shared/ui/theme'
import type { XMLElement } from 'entities/book-reader'
import type { StyleProp, TextStyle } from 'react-native'
import { getElementKey } from './getElementKey'
import { getTextElement } from './getTextElement'
import { parseObjectToStylizedElements } from './parseObjectToStylizedElements'

interface GetElementsInBlockElementProps {
  elements: XMLElement[]
  parentKey: string
  style: StyleProp<TextStyle>
  theme: ThemeColors
}

export const getElementsInBlockElement = ({
  elements,
  parentKey,
  style,
  theme,
}: GetElementsInBlockElementProps) =>
  elements.map((element, index) => {
    const elementKey = getElementKey({
      endWith: index,
      name: element.name || '',
      startWith: parentKey,
    })

    if (element.type === XMLElementType.Element)
      return parseObjectToStylizedElements({
        element,
        expandedTextStyle: style,
        parentKey: elementKey,
        theme,
      })

    return getTextElement({ element, elementKey, style })
  })
