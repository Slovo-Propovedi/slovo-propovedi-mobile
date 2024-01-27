import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BodyXMLElementName, XMLElementType, parseFb2BookToObject } from 'entities/book-reader';
import { INDENTS, type ReadStackParamName, type ReadStackScreenProps } from 'shared';
import { parseObjectToStylizedElements } from './lib';
import { testFb2String } from './testFiles/testFb2';

export const BookReaderScreen: React.FC<
  ReadStackScreenProps<ReadStackParamName.BookReader>
> = () => {
  const book = parseFb2BookToObject(testFb2String);

  if (!book) return null;

  const { elements } = book;

  const body = elements.find(
    ({ name, type }) => type === XMLElementType.Element && name === BodyXMLElementName.Body,
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ScrollView>
          {/* <Text>{JSON.stringify(description?.elements, null, 2)}</Text> */}
          {body && parseObjectToStylizedElements({ element: body })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: INDENTS.middle,
  },
});
