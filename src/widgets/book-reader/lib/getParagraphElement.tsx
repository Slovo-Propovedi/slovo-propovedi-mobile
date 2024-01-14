import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';
import { BodyXMLElementName, type XMLElement } from 'entities/book-reader';
import { getElementKey } from './getElementKey';
import { getElementsInBlockElement } from './getElementsInBlockElement';

export interface GetParagraphElementProps {
  childrenStyle: StyleProp<TextStyle>;
  elements: XMLElement[];
  parentKey: string;
  style: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
}

export const getParagraphElement = ({
  childrenStyle,
  elements,
  parentKey,
  style,
  textStyle,
}: GetParagraphElementProps) => (
  <View
    key={getElementKey({
      name: BodyXMLElementName.P,
      startWith: parentKey,
    })}
    style={style}
  >
    <Text style={textStyle}>
      {getElementsInBlockElement({
        elements,
        parentKey,
        style: childrenStyle,
      })}
    </Text>
  </View>
);
