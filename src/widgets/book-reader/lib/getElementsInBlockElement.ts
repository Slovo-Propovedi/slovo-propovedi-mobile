import type { StyleProp, TextStyle } from 'react-native';
import { XMLElementType } from 'entities/book-reader';
import type { XMLElement } from 'entities/book-reader';
import { getElementKey } from './getElementKey';
import { getTextElement } from './getTextElement';
import { parseObjectToStylizedElements } from './parseObjectToStylizedElements';

interface GetElementsInBlockElementProps {
  elements: XMLElement[];
  parentKey: string;
  style: StyleProp<TextStyle>;
}

export const getElementsInBlockElement = ({
  elements,
  parentKey,
  style,
}: GetElementsInBlockElementProps) =>
  elements.map((element, index) => {
    const elementKey = getElementKey({
      endWith: index,
      name: element.name || '',
      startWith: parentKey,
    });

    if (element.type === XMLElementType.Element)
      return parseObjectToStylizedElements({
        element,
        expandedTextStyle: style,
        parentKey: elementKey,
      });

    return getTextElement({ element, elementKey, style });
  });
