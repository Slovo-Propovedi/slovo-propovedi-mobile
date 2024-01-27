import type { StyleProp, TextStyle } from 'react-native';
import { BodyXMLElementName, XMLElementType } from 'entities/book-reader';
import type { XMLElement } from 'entities/book-reader';
import { getBlockElement } from './getBlockElement';
import { getParagraphElement } from './getParagraphElement';
import { getTextElementsInInlineElement } from './getTextElementsInInlineElement';
import { getTextElementStyles } from './getTextElementStyles';

interface ParseObjectToStylizedElementsProps {
  element: XMLElement;
  expandedTextStyle?: StyleProp<TextStyle>;
  parentKey?: string;
}

export const parseObjectToStylizedElements = ({
  element: {
    elements,
    // странно, но ts ругается, что name может быть undefined ниже условия "type === XMLElementType.Text"
    name = BodyXMLElementName.P,
    text = '',
    type,
  },
  expandedTextStyle,
  parentKey = '',
}: ParseObjectToStylizedElementsProps): React.ReactNode => {
  if (type === XMLElementType.Text)
    return typeof text === 'string' ? text.replace(/((\n)|(\s))+/g, ' ') : text;

  if (!elements?.length) return null;

  const { style, textStyle } = getTextElementStyles(name);

  const composedTextStyle: StyleProp<TextStyle> = [textStyle, expandedTextStyle];

  const elementGeneralProps = {
    elements,
    parentKey,
  };

  if (name === BodyXMLElementName.Emphasis || name === BodyXMLElementName.Strong)
    return getTextElementsInInlineElement({ style: composedTextStyle, ...elementGeneralProps });

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
