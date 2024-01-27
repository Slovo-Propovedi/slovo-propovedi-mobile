import type { StyleProp, TextStyle } from 'react-native';
import type { XMLElement } from 'entities/book-reader';
import { getTextElement } from './getTextElement';

export interface GetTextElementsInInlineElementProps {
  elements: XMLElement[];
  parentKey: string;
  style: StyleProp<TextStyle>;
}

export const getTextElementsInInlineElement = ({
  elements,
  parentKey,
  style,
}: GetTextElementsInInlineElementProps) =>
  elements.map((element, index) =>
    getTextElement({
      element,
      elementKey: `${parentKey}${element.name}${index}`,
      style,
    }),
  );
