import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReadStackParamName, ReadStackScreenProps } from 'routing';
import { COLORS } from 'shared';

export const ReadScreen: React.FC<ReadStackScreenProps<ReadStackParamName.Home>> = () => (
  <SafeAreaView style={styles.Library}>
    <View style={{ flex: 1, backgroundColor: COLORS.blue }} />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  Library: {
    flex: 1,
  },
});
