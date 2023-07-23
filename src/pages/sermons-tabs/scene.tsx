import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SceneMap } from 'react-native-tab-view';
import { BooksListOnBible } from 'widgets';

const NewTab = () => <View style={{ flex: 1, backgroundColor: '#673ab7' }} />;

const OnBibleTab = () => (
  <ScrollView style={styles.scroll}>
    <BooksListOnBible />
  </ScrollView>
);

const TopicalTab = () => <View style={{ flex: 1, backgroundColor: 'blueviolet' }} />;

export enum SermonsTab {
  New = 'New',
  OnBible = 'OnBible',
  Topical = 'Topical',
}

export const renderScene = SceneMap({
  [SermonsTab.New]: NewTab,
  [SermonsTab.OnBible]: OnBibleTab,
  [SermonsTab.Topical]: TopicalTab,
});

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: '100%',
  },
});
