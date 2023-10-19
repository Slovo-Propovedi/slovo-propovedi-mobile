import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReadStackParamName, ReadStackScreenProps } from 'shared';
import { COLORS } from 'shared';

export const ReadScreen: React.FC<ReadStackScreenProps<ReadStackParamName.Home>> = () => (
  <SafeAreaView style={styles.Library}>
    <View style={{ backgroundColor: COLORS.blue, flex: 1 }} />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  Library: {
    flex: 1,
  },
});
