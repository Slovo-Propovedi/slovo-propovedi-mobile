import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BodyXMLElementName, XMLElementType, parseFb2BookToObject } from 'entities/book-reader';
import { INDENTS } from 'shared';
import { drawText } from './lib';
import { testFb2String } from './testFiles/testFb2';

export const BookReader = () => {
  const book = parseFb2BookToObject(testFb2String);

  if (!book) return null;

  const { elements } = book;

  const body = elements.find(
    ({ name, type }) => type === XMLElementType.Element && name === BodyXMLElementName.Body,
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* <Text>{JSON.stringify(description?.elements, null, 2)}</Text> */}
        {body && drawText({ element: body })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: INDENTS.middle,
  },
});
