import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InfoStackParamName, InfoStackScreenProps } from 'routing';
import { COLORS } from 'shared';

export const Info: React.FC<InfoStackScreenProps<InfoStackParamName.Home>> = () => (
  <SafeAreaView style={styles.info}>
    <View style={{ flex: 1, backgroundColor: COLORS.disabled }} />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  info: {
    flex: 1,
  },
});
