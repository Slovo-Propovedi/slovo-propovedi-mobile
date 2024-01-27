import type { StyleProp, TextStyle } from 'react-native';
import { BodyXMLElementName } from 'entities/book-reader';
import type { XMLElementElement, XMLElementText } from 'entities/book-reader';
import { getBlockElement } from './getBlockElement';
import { getElementKey } from './getElementKey';
import { getParagraphElement } from './getParagraphElement';
import { getTextElement } from './getTextElement';
import { getTextElementStyles } from './getTextElementStyles';

interface ParseObjectToStylizedElementsProps {
  element: XMLElementElement;
  expandedTextStyle?: StyleProp<TextStyle>;
  parentKey?: string;
}

export const parseObjectToStylizedElements = ({
  element: { elements, name },
  expandedTextStyle,
  parentKey = '',
}: ParseObjectToStylizedElementsProps): React.ReactNode => {
  if (!elements?.length) return null;

  const { style, textStyle } = getTextElementStyles(name);

  const composedTextStyle: StyleProp<TextStyle> = [textStyle, expandedTextStyle];

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
    );

  const elementGeneralProps = {
    elements,
    parentKey,
  };
  const blockElementGeneralProps = {
    childrenStyle: composedTextStyle,
    style,
    ...elementGeneralProps,
  };

  if (name === BodyXMLElementName.P)
    return getParagraphElement({
      textStyle,
      ...blockElementGeneralProps,
    });

  return getBlockElement({
    name,
    ...blockElementGeneralProps,
  });
};
