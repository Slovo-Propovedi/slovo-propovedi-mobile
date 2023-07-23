import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LibraryStackParamName, LibraryStackScreenProps } from 'routing';
import { COLORS } from 'shared';

export const Library: React.FC<LibraryStackScreenProps<LibraryStackParamName.Home>> = () => (
  <SafeAreaView style={styles.Library}>
    <View style={{ flex: 1, backgroundColor: COLORS.blue }} />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  Library: {
    flex: 1,
  },
});
