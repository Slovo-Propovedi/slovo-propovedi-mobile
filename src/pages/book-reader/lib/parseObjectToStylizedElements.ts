import { type StyleProp, type TextStyle } from 'react-native'
import {
  BodyXMLElementName,
  type XMLElementElement,
  type XMLElementText,
} from 'entities/book-reader'
import { type ThemeColors } from 'shared/ui/theme'
import { getBlockElement } from './getBlockElement'
import { getElementKey } from './getElementKey'
import { getParagraphElement } from './getParagraphElement'
import { getTextElement } from './getTextElement'
import { getTextElementStyles } from './getTextElementStyles'

interface ParseObjectToStylizedElementsProps {
  element: XMLElementElement
  expandedTextStyle?: StyleProp<TextStyle>
  parentKey?: string
  theme: ThemeColors
}

export const parseObjectToStylizedElements = ({
  element: { elements, name },
  expandedTextStyle,
  parentKey = '',
  theme,
}: ParseObjectToStylizedElementsProps): React.ReactNode => {
  if (!elements?.length) return null

  const { style, textStyle } = getTextElementStyles(name, theme)

  const composedTextStyle: StyleProp<TextStyle> = [textStyle, expandedTextStyle]

  if (name === BodyXMLElementName.Emphasis || name === BodyXMLElementName.Strong)
    return elements.map((element, index) =>
      getTextElement({
        // не хочет воспринимать как текст без as
        element: element as XMLElementText,
        elementKey: getElementKey({
          endWith: index,
          name: '',
          startWith: parentKey,
        }),
        style: composedTextStyle,
      }),
    )

  const elementGeneralProps = {
    elements,
    parentKey,
    theme,
  }
  const blockElementGeneralProps = {
    childrenStyle: composedTextStyle,
    style,
    ...elementGeneralProps,
  }

  if (name === BodyXMLElementName.P)
    return getParagraphElement({
      textStyle,
      ...blockElementGeneralProps,
    })

  return getBlockElement({
    name,
    ...blockElementGeneralProps,
  })
}
