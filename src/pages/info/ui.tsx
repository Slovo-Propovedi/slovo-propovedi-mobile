import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootTabName, RootTabsScreenProps } from 'shared';
import { COLORS } from 'shared';

export const Info: React.FC<RootTabsScreenProps<RootTabName.Info>> = () => (
  <SafeAreaView style={styles.info}>
    <View style={{ backgroundColor: COLORS.disabled, flex: 1 }} />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  info: {
    flex: 1,
  },
});
