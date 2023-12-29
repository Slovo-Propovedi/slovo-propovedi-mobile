import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { parseFb2BookToObject } from 'shared/lib';
import { testFb2String } from 'shared/testFiles/testFb2';

export const BookReader = () => {
  const book = parseFb2BookToObject(testFb2String);

  const element = book.elements?.at(0);
  if (!element) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text>BookReader</Text>
    </View>
  );
};

const styles = StyleSheet.create({ container: {} });
