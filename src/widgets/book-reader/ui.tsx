import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { XMLElement } from 'entities/book-reader';
import { XMLElementName, XMLElementType, parseFb2BookToObject } from 'entities/book-reader';
import { testFb2String } from 'shared/testFiles/testFb2';

interface ListOfContentsItem {
  page?: number;
  text: boolean | number | string;
}

type ListOfContents = ListOfContentsItem[];

const getListOfContents = ({ elements, name, text, type }: XMLElement): ListOfContents => {
  if (type === XMLElementType.Element) {
    console.log('elements: ', elements);
    console.log('name: ', name);
  } else {
    console.log('text: ', text);
  }

  return [];
};

export const BookReader = () => {
  const book = parseFb2BookToObject(testFb2String);

  if (!book) {
    return null;
  }

  const { elements } = book;
  const description = elements.find(
    ({ name, type }) => type === XMLElementType.Element && name === XMLElementName.Description,
  );
  const body = elements.find(
    ({ name, type }) => type === XMLElementType.Element && name === XMLElementName.Body,
  );

  const listOfContents = body && getListOfContents(body);
  console.log('listOfContents: ', listOfContents);

  return (
    <View style={styles.container}>
      <Text>BookReader</Text>
      <ScrollView>
        <Text style={{ color: 'green', fontSize: 50 }}>Description</Text>
        <Text>{JSON.stringify(description, null, 2)}</Text>
        <Text style={{ color: 'green', fontSize: 50 }}>Body</Text>
        <Text>{JSON.stringify(body, null, 2)}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({ container: {} });
