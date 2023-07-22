import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SceneMap } from 'react-native-tab-view';
import { BooksListOnBible } from 'widgets';

const NewRoute = () => <View style={{ flex: 1, backgroundColor: '#673ab7' }} />;

const OnBibleRoute = () => (
  <ScrollView style={styles.scroll}>
    <BooksListOnBible />
  </ScrollView>
);

const TopicalRoute = () => <View style={{ flex: 1, backgroundColor: 'blueviolet' }} />;

export enum SermonsRoute {
  New = 'New',
  OnBible = 'OnBible',
  Topical = 'Topical',
}

export const renderScene = SceneMap({
  [SermonsRoute.New]: NewRoute,
  [SermonsRoute.OnBible]: OnBibleRoute,
  [SermonsRoute.Topical]: TopicalRoute,
});

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: '100%',
  },
});
